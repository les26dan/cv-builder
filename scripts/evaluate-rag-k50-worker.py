#!/usr/bin/env python3
"""Worker cho K=50 eval — nhận worker_id và n_workers, xử lý subset CV."""
import json, math, hashlib, re, os, time, sys, urllib.request, fcntl
from pathlib import Path
from collections import defaultdict

REPO        = Path(__file__).resolve().parent.parent
PAIRS_JSON  = REPO / 'data' / 'eval' / 'pairs.json'
EMBED_CACHE = REPO / 'data' / 'eval' / 'embeddings_cache.json'
CHECKPOINT  = REPO / 'data' / 'eval' / 'rag_k50_checkpoint.json'
LOCK_FILE   = REPO / 'data' / 'eval' / 'rag_k50.lock'
API_KEY     = os.environ.get('OPENAI_API_KEY', '')
MODEL       = 'gpt-4o-mini'
ALPHA       = 0.4
TOP_K       = 50
EXCLUDE     = {'ADVOCATE', 'AUTOMOBILE', 'BPO', 'CONSULTANT'}

STOP = {'the','and','or','of','to','with','in','for','a','an','be','is','are',
        'will','have','has','on','at','by','from','as','this','that','we','you',
        'they','it','our','your','their','all','not','but','can','do','its'}

def sha256(t): return hashlib.sha256(t.encode()).hexdigest()
def tokenize(t): return [w for w in re.split(r'\W+', t.lower()) if len(w)>2 and w not in STOP]

def build_corpus(docs):
    N=len(docs); tf_maps,df=[],defaultdict(int)
    for doc in docs:
        freq=defaultdict(int)
        for t in tokenize(doc): freq[t]+=1
        tf_maps.append(dict(freq))
        for t in freq: df[t]+=1
    idf={t:math.log((N+1)/(c+1))+1 for t,c in df.items()}
    return tf_maps,idf

def tfidf_score(q_tokens,doc_tf,idf):
    qf=defaultdict(int)
    for t in q_tokens: qf[t]+=1
    dot=qn=dn=0.
    for t in set(qf)|set(doc_tf):
        w=idf.get(t,0.); qw,dw=qf.get(t,0)*w,doc_tf.get(t,0)*w
        dot+=qw*dw; qn+=qw*qw; dn+=dw*dw
    d=math.sqrt(qn)*math.sqrt(dn); return dot/d if d else 0.

def cosine(a,b):
    dot=sum(x*y for x,y in zip(a,b))
    na=math.sqrt(sum(x*x for x in a)); nb=math.sqrt(sum(x*x for x in b))
    return dot/(na*nb) if na and nb else 0.

def llm_rerank(cv_text, jd_items):
    jd_block='\n'.join(f'[{i+1}] {jd["title"]}\n{jd["text"][:250]}' for i,jd in enumerate(jd_items))
    prompt=f"""Recruiter task: rank the TOP 5 most suitable jobs for this candidate.

CV (first 500 chars):
{cv_text[:500]}

Jobs:
{jd_block}

Reply ONLY with 5 comma-separated numbers, e.g.: 3,1,7,12,5"""
    payload=json.dumps({'model':MODEL,'messages':[{'role':'user','content':prompt}],
                        'max_tokens':25,'temperature':0}).encode()
    req=urllib.request.Request('https://api.openai.com/v1/chat/completions',data=payload,
        headers={'Content-Type':'application/json','Authorization':f'Bearer {API_KEY}'},method='POST')
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req,timeout=45) as resp:
                data=json.loads(resp.read())
            raw=data['choices'][0]['message']['content'].strip()
            indices=[int(x.strip())-1 for x in raw.split(',') if x.strip().isdigit()]
            indices=[i for i in indices if 0<=i<len(jd_items)]
            top5=[jd_items[i]['key'] for i in indices[:5]]
            if len(top5)<5:
                for jd in jd_items:
                    if jd['key'] not in top5: top5.append(jd['key'])
                    if len(top5)==5: break
            return top5,None
        except Exception as e:
            if attempt<2: time.sleep(4*(attempt+1))
    return [jd['key'] for jd in jd_items[:5]],'fallback'

def load_checkpoint():
    if CHECKPOINT.exists():
        return json.loads(CHECKPOINT.read_text())
    return []

def save_row(row):
    """Thread-safe append to checkpoint."""
    with open(LOCK_FILE,'w') as lf:
        fcntl.flock(lf,fcntl.LOCK_EX)
        data=load_checkpoint()
        data.append(row)
        CHECKPOINT.write_text(json.dumps(data,indent=2))
        fcntl.flock(lf,fcntl.LOCK_UN)

def main():
    worker_id  = int(sys.argv[1]) if len(sys.argv)>1 else 0
    n_workers  = int(sys.argv[2]) if len(sys.argv)>2 else 1

    pairs=json.loads(PAIRS_JSON.read_text())
    cache=json.loads(EMBED_CACHE.read_text())

    jd_list=[]
    seen=set()
    for p in pairs:
        key=sha256(p['jdText'])
        if key not in seen:
            seen.add(key)
            jd_list.append({'key':key,'text':p['jdText'],'category':p['jdCategory'],'title':p.get('jdTitle','JD')})
    jd_by_cat=defaultdict(set)
    for jd in jd_list: jd_by_cat[jd['category']].add(jd['key'])
    tf_maps,idf=build_corpus([jd['text'] for jd in jd_list])

    cv_map={}
    for p in pairs:
        if p['resumeId'] not in cv_map:
            cv_map[p['resumeId']]={'id':p['resumeId'],'text':p['resumeText'],'category':p['resumeCategory']}
    cv_list=[v for v in cv_map.values() if v['category'] not in EXCLUDE]

    done_ids={r['cv_id'] for r in load_checkpoint()}
    todo=[cv for cv in cv_list if cv['id'] not in done_ids]
    # This worker handles its slice
    my_todo=[cv for i,cv in enumerate(todo) if i%n_workers==worker_id]
    print(f'Worker {worker_id}: {len(my_todo)} CVs to process')

    llm_calls=fallback=0
    for i,cv in enumerate(my_todo):
        tokens=tokenize(cv['text'])
        cv_vec=cache.get(sha256(cv['text']))
        rel=jd_by_cat[cv['category']]
        scores={}
        for j,jd in enumerate(jd_list):
            tf_s=tfidf_score(tokens,tf_maps[j],idf)
            jd_vec=cache.get(jd['key'])
            emb_s=cosine(cv_vec,jd_vec) if cv_vec and jd_vec else 0.
            scores[jd['key']]=ALPHA*tf_s+(1-ALPHA)*emb_s
        ranked=sorted(scores,key=lambda k:-scores[k])
        top50=ranked[:TOP_K]
        jd_items=[{'key':k,'title':next(jd['title'] for jd in jd_list if jd['key']==k),
                   'text':next(jd['text'] for jd in jd_list if jd['key']==k)} for k in top50]
        top5,err=llm_rerank(cv['text'],jd_items)
        if err: fallback+=1
        else: llm_calls+=1
        save_row({'cv_id':cv['id'],'category':cv['category'],
                  'relevant_keys':list(rel),'top50_keys':top50,'top5_keys':top5})
        if (i+1)%10==0:
            print(f'  W{worker_id}: {i+1}/{len(my_todo)} | llm={llm_calls} fb={fallback}')
        time.sleep(0.1)
    print(f'Worker {worker_id} done. llm={llm_calls} fallback={fallback}')

if __name__=='__main__':
    main()
