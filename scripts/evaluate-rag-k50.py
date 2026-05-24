#!/usr/bin/env python3
"""
Full pipeline eval with TOP_K=50: Hybrid retrieve top-50, LLM re-rank to top-5.
Checkpoint: data/eval/rag_k50_checkpoint.json
"""
import json, math, hashlib, re, os, time, urllib.request
from pathlib import Path
from collections import defaultdict
import numpy as np

REPO        = Path(__file__).resolve().parent.parent
PAIRS_JSON  = REPO / 'data' / 'eval' / 'pairs.json'
EMBED_CACHE = REPO / 'data' / 'eval' / 'embeddings_cache.json'
CHECKPOINT  = REPO / 'data' / 'eval' / 'rag_k50_checkpoint.json'
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
    N = len(docs); tf_maps, df = [], defaultdict(int)
    for doc in docs:
        freq = defaultdict(int)
        for t in tokenize(doc): freq[t] += 1
        tf_maps.append(dict(freq))
        for t in freq: df[t] += 1
    idf = {t: math.log((N+1)/(c+1))+1 for t,c in df.items()}
    return tf_maps, idf

def tfidf_score(q_tokens, doc_tf, idf):
    qf = defaultdict(int)
    for t in q_tokens: qf[t] += 1
    dot=qn=dn=0.0
    for t in set(qf)|set(doc_tf):
        w=idf.get(t,0.); qw,dw=qf.get(t,0)*w,doc_tf.get(t,0)*w
        dot+=qw*dw; qn+=qw*qw; dn+=dw*dw
    d=math.sqrt(qn)*math.sqrt(dn); return dot/d if d else 0.

def cosine(a,b):
    dot=sum(x*y for x,y in zip(a,b))
    na=math.sqrt(sum(x*x for x in a)); nb=math.sqrt(sum(x*x for x in b))
    return dot/(na*nb) if na and nb else 0.

def llm_rerank(cv_text, jd_items):
    """jd_items: list of {key, title, text}. Returns list of keys in ranked order (top-5)."""
    jd_block = '\n'.join(
        f'[{i+1}] {jd["title"]}\n{jd["text"][:300]}' for i,jd in enumerate(jd_items)
    )
    prompt = f"""You are a recruiter. Given the candidate's CV summary and {len(jd_items)} job descriptions, select the TOP 5 most suitable jobs.

CV (first 600 chars):
{cv_text[:600]}

Job Descriptions:
{jd_block}

Reply with ONLY 5 numbers separated by commas, e.g.: 3,1,7,12,5
No explanation."""
    payload = json.dumps({
        'model': MODEL,
        'messages': [{'role':'user','content':prompt}],
        'max_tokens': 30, 'temperature': 0
    }).encode()
    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions', data=payload,
        headers={'Content-Type':'application/json','Authorization':f'Bearer {API_KEY}'},
        method='POST'
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read())
            raw = data['choices'][0]['message']['content'].strip()
            indices = [int(x.strip())-1 for x in raw.split(',') if x.strip().isdigit()]
            indices = [i for i in indices if 0 <= i < len(jd_items)]
            top5 = [jd_items[i]['key'] for i in indices[:5]]
            # fill missing
            if len(top5) < 5:
                for jd in jd_items:
                    if jd['key'] not in top5: top5.append(jd['key'])
                    if len(top5) == 5: break
            return top5, None
        except Exception as e:
            if attempt < 2: time.sleep(5*(attempt+1))
    return [jd['key'] for jd in jd_items[:5]], 'fallback'

def recall_at_k(r,rel,k):
    if not rel: return 0.
    return sum(1 for x in r[:k] if x in rel)/len(rel)
def precision_at_k(r,rel,k):
    return sum(1 for x in r[:k] if x in rel)/k if k else 0.
def mrr_fn(r,rel):
    for i,x in enumerate(r):
        if x in rel: return 1./(i+1)
    return 0.
def ndcg_at_k(r,rel,k):
    g=[1. if x in rel else 0. for x in r[:k]]
    dcg=sum(x/math.log2(i+2) for i,x in enumerate(g))
    idcg=sum(1./math.log2(i+2) for i in range(min(k,len(rel))))
    return dcg/idcg if idcg else 0.

def main():
    if not API_KEY: print('ERROR: OPENAI_API_KEY not set'); return

    pairs = json.loads(PAIRS_JSON.read_text())
    cache = json.loads(EMBED_CACHE.read_text())

    jd_list = []
    seen = set()
    for p in pairs:
        key = sha256(p['jdText'])
        if key not in seen:
            seen.add(key)
            jd_list.append({'key':key,'text':p['jdText'],'category':p['jdCategory'],'title':p['jdTitle']})
    jd_by_cat = defaultdict(set)
    for jd in jd_list: jd_by_cat[jd['category']].add(jd['key'])
    tf_maps, idf = build_corpus([jd['text'] for jd in jd_list])

    cv_map = {}
    for p in pairs:
        if p['resumeId'] not in cv_map:
            cv_map[p['resumeId']] = {'id':p['resumeId'],'text':p['resumeText'],'category':p['resumeCategory']}
    cv_list = [v for v in cv_map.values() if v['category'] not in EXCLUDE]
    print(f'CVs: {len(cv_list)} | JDs: {len(jd_list)}')

    ckpt = []
    if CHECKPOINT.exists():
        ckpt = json.loads(CHECKPOINT.read_text())
        print(f'Checkpoint: {len(ckpt)} done')
    done_ids = {r['cv_id'] for r in ckpt}

    llm_calls = fallback = 0
    for i, cv in enumerate(cv_list):
        if cv['id'] in done_ids: continue

        tokens = tokenize(cv['text'])
        cv_vec = cache.get(sha256(cv['text']))
        rel = jd_by_cat[cv['category']]

        scores = {}
        for j, jd in enumerate(jd_list):
            tf_s = tfidf_score(tokens, tf_maps[j], idf)
            jd_vec = cache.get(jd['key'])
            emb_s = cosine(cv_vec, jd_vec) if cv_vec and jd_vec else 0.
            scores[jd['key']] = ALPHA*tf_s + (1-ALPHA)*emb_s

        ranked = sorted(scores, key=lambda k:-scores[k])
        top50 = ranked[:TOP_K]

        jd_items = [{'key':k,'title':next(jd['title'] for jd in jd_list if jd['key']==k),
                     'text':next(jd['text'] for jd in jd_list if jd['key']==k)} for k in top50]

        top5, err = llm_rerank(cv['text'], jd_items)
        if err: fallback += 1
        else: llm_calls += 1

        ckpt.append({'cv_id':cv['id'],'category':cv['category'],
                     'relevant_keys':list(rel),'top50_keys':top50,'top5_keys':top5})

        if (len(ckpt)) % 10 == 0:
            CHECKPOINT.write_text(json.dumps(ckpt, indent=2))
            print(f'  {len(ckpt)}/{len(cv_list)} | llm={llm_calls} fallback={fallback}')
        time.sleep(0.2)

    CHECKPOINT.write_text(json.dumps(ckpt, indent=2))
    print(f'\nDone. {len(ckpt)} CVs | LLM={llm_calls} fallback={fallback}')

    # Metrics
    r50,p5,ndcg5,mrr_v = [],[],[],[]
    for r in ckpt:
        rel = set(r['relevant_keys'])
        top50 = r['top50_keys']
        top5  = r['top5_keys']
        r50.append(recall_at_k(top50, rel, 50))
        p5.append(precision_at_k(top5, rel, 5))
        ndcg5.append(ndcg_at_k(top5, rel, 5))
        mrr_v.append(mrr_fn(top5, rel))

    print(f'\nResults (K=50, n={len(ckpt)}):')
    print(f'  R@50:   {np.mean(r50):.3f}')
    print(f'  P@5:    {np.mean(p5):.3f}')
    print(f'  nDCG@5: {np.mean(ndcg5):.3f}')
    print(f'  MRR:    {np.mean(mrr_v):.3f}')

if __name__ == '__main__':
    main()
