#!/usr/bin/env python3
"""
Full RAG pipeline evaluation — bước 1 (Hybrid) + bước 2 (LLM batch rank).

Bước 1: Hybrid Retrieval (TF-IDF + Embedding, alpha=0.4) → top-20
Bước 2: gpt-4o-mini batch rank top-20 → top-5

Ground truth: category-based (tất cả JD cùng category với CV = relevant)
Corpus: 307 JD, Queries: 369 CV

Output:
  data/eval/rag_full_results.json   per-query breakdown
  data/eval/rag_full_summary.json   aggregated metrics
"""
from __future__ import annotations

import hashlib, json, math, os, time
from collections import defaultdict
from pathlib import Path

import numpy as np

REPO        = Path(__file__).resolve().parent.parent
PAIRS_JSON  = REPO / 'data' / 'eval' / 'pairs.json'
EMBED_CACHE = REPO / 'data' / 'eval' / 'embeddings_cache.json'
FULL_RESULTS = REPO / 'data' / 'eval' / 'rag_full_results.json'
FULL_SUMMARY = REPO / 'data' / 'eval' / 'rag_full_summary.json'

ALPHA   = 0.4
TOP_K1  = 20
TOP_K2  = 5
BATCH_SIZE = 100  # stop after this many new queries (re-run to continue)
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')

STOP = {'the','and','or','of','to','with','in','for','a','an','be','is','are','will','have','has','on','at','by','from','as','this','that','we','you','they','it','our','your','their','all','not','but','can','do','its'}

# =============================================================================
# Helpers (same as evaluate-rag.py)
# =============================================================================

def sha256(t): return hashlib.sha256(t.encode()).hexdigest()

def tokenize(text):
    import re
    return [t for t in re.split(r'\W+', text.lower()) if len(t)>2 and t not in STOP]

def build_corpus(docs):
    N = len(docs)
    tf_maps, df = [], defaultdict(int)
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
    dot = qn = dn = 0.0
    for t in set(qf)|set(doc_tf):
        w = idf.get(t,0.0)
        qw,dw = qf.get(t,0)*w, doc_tf.get(t,0)*w
        dot+=qw*dw; qn+=qw*qw; dn+=dw*dw
    denom = math.sqrt(qn)*math.sqrt(dn)
    return dot/denom if denom else 0.0

def cosine(a, b):
    dot = sum(x*y for x,y in zip(a,b))
    na = math.sqrt(sum(x*x for x in a))
    nb = math.sqrt(sum(x*x for x in b))
    return dot/(na*nb) if na and nb else 0.0

def ndcg_at_k(ranked, rel, k):
    gains = [1.0 if r in rel else 0.0 for r in ranked[:k]]
    dcg  = sum(g/math.log2(i+2) for i,g in enumerate(gains))
    idcg = sum(1.0/math.log2(i+2) for i in range(min(k,len(rel))))
    return dcg/idcg if idcg else 0.0

def precision_at_k(ranked, rel, k):
    return sum(1 for r in ranked[:k] if r in rel) / k

def recall_at_k(ranked, rel, k):
    if not rel: return 0.0
    return sum(1 for r in ranked[:k] if r in rel) / len(rel)

def mrr(ranked, rel):
    for i,r in enumerate(ranked):
        if r in rel: return 1.0/(i+1)
    return 0.0

# =============================================================================
# LLM batch rank — mirrors ragPipeline.ts llmBatchRank()
# =============================================================================

def llm_batch_rank(cv_text: str, top20_jobs: list[dict]) -> list[dict]:
    """
    Call gpt-4o-mini to rank top-20 JDs for a CV.
    Returns list of {key, llm_score, reason} sorted by llm_score desc.
    Falls back to hybrid order on error.
    """
    import urllib.request

    cv_summary = cv_text[:800]
    job_summaries = [
        {'id': j['key'][:8], 'title': j['title'], 'jdSnippet': j['text'][:200]}
        for j in top20_jobs
    ]
    n = len(top20_jobs)

    system_prompt = 'You are a recruiter. Rank the following job postings by fit for this candidate. Return ONLY valid JSON array.'
    user_prompt = f"""=== CANDIDATE CV (summary) ===
{cv_summary}

=== JOB POSTINGS TO RANK ===
{json.dumps(job_summaries)}

Return JSON array (rank all {n} jobs):
[{{"rank": 1, "id": "shortid", "score": 85, "reason": "one sentence why"}}]"""

    payload = json.dumps({
        'model': 'gpt-4o-mini',
        'temperature': 0,
        'max_tokens': 1500,
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user',   'content': user_prompt},
        ]
    }).encode()

    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=payload,
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {OPENAI_API_KEY}'},
        method='POST'
    )

    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read())
            break
        except Exception as e:
            print(f'    LLM attempt {attempt+1} error: {e}')
            if attempt < 2:
                time.sleep(5 * (attempt + 1))
            else:
                return [{'key': j['key'], 'llm_score': 80 - i*2, 'reason': 'fallback'} for i,j in enumerate(top20_jobs)]

    raw = data['choices'][0]['message']['content']
    # strip markdown fences
    raw = raw.strip()
    if raw.startswith('```'):
        raw = raw.split('\n', 1)[1].rsplit('```', 1)[0].strip()

    try:
        parsed = json.loads(raw)
    except Exception as e:
        print(f'    JSON parse error: {e} — using hybrid order')
        return [{'key': j['key'], 'llm_score': 80 - i*2, 'reason': 'fallback'} for i,j in enumerate(top20_jobs)]

    # Map short id back to full key
    shortid_to_key = {j['key'][:8]: j['key'] for j in top20_jobs}
    results = []
    for item in parsed:
        short_id = str(item.get('id', ''))
        key = shortid_to_key.get(short_id)
        if key:
            results.append({'key': key, 'llm_score': float(item.get('score', 0)), 'reason': str(item.get('reason', ''))})

    # Fill any missing
    found_keys = {r['key'] for r in results}
    for i, j in enumerate(top20_jobs):
        if j['key'] not in found_keys:
            results.append({'key': j['key'], 'llm_score': 0.0, 'reason': 'missing'})

    results.sort(key=lambda x: -x['llm_score'])
    return results

# =============================================================================
# Main
# =============================================================================

def main():
    if not OPENAI_API_KEY:
        print('ERROR: OPENAI_API_KEY not set'); return

    pairs = json.loads(PAIRS_JSON.read_text())
    cache: dict = json.loads(EMBED_CACHE.read_text())
    print(f'Pairs: {len(pairs)}  |  Embed cache: {len(cache)} vectors')

    # Build JD corpus
    jd_list = []
    seen = set()
    for p in pairs:
        key = sha256(p['jdText'])
        if key not in seen:
            seen.add(key)
            jd_list.append({'key':key,'text':p['jdText'],'category':p['jdCategory'],'title':p['jdTitle']})
    print(f'JD corpus: {len(jd_list)}')

    # Build CV list
    cv_map = {}
    for p in pairs:
        if p['resumeId'] not in cv_map:
            cv_map[p['resumeId']] = {'text':p['resumeText'],'category':p['resumeCategory']}
    cv_list = list(cv_map.values())
    print(f'CV queries: {len(cv_list)}')

    # Ground truth
    jd_by_cat = defaultdict(set)
    for jd in jd_list:
        jd_by_cat[jd['category']].add(jd['key'])

    # Precompute TF-IDF
    tf_maps, idf = build_corpus([jd['text'] for jd in jd_list])
    jd_keys = [jd['key'] for jd in jd_list]
    jd_by_key = {jd['key']: jd for jd in jd_list}

    # Resume from checkpoint if exists
    checkpoint_path = REPO / 'data' / 'eval' / 'rag_full_checkpoint.json'
    done_results = []
    done_ids = set()
    if checkpoint_path.exists():
        done_results = json.loads(checkpoint_path.read_text())
        done_ids = {r.get('category', r.get('resumeCategory','')) + '::' + str(i) for i,r in enumerate(done_results)}
        print(f'Resuming from checkpoint: {len(done_results)} done')

    all_results = list(done_results)
    total_cost = 0.0

    metrics_step1 = {'r20':[], 'r5':[], 'p5':[], 'mrr':[], 'n5':[], 'n20':[]}
    metrics_step2 = {'r5':[], 'p5':[], 'mrr':[], 'n5':[]}

    # Recompute step1 metrics for already-done results
    for r in done_results:
        rel = set(r['relevant_keys'])
        ranked1 = r['top20_keys']
        ranked2 = r['top5_keys']
        metrics_step1['r20'].append(recall_at_k(ranked1, rel, 20))
        metrics_step1['r5'].append(recall_at_k(ranked1, rel, 5))
        metrics_step1['p5'].append(precision_at_k(ranked1, rel, 5))
        metrics_step1['mrr'].append(mrr(ranked1, rel))
        metrics_step1['n5'].append(ndcg_at_k(ranked1, rel, 5))
        metrics_step1['n20'].append(ndcg_at_k(ranked1, rel, 20))
        metrics_step2['r5'].append(recall_at_k(ranked2, rel, 5))
        metrics_step2['p5'].append(precision_at_k(ranked2, rel, 5))
        metrics_step2['mrr'].append(mrr(ranked2, rel))
        metrics_step2['n5'].append(ndcg_at_k(ranked2, rel, 5))

    print()
    print('Running full pipeline (step1=Hybrid, step2=LLM)...')
    print('%-5s %-20s %-8s  %-30s  %-30s' % ('q','category','R@20','top5 titles','relevant?'))
    print('-'*100)

    for q_i, cv in enumerate(cv_list):
        if q_i < len(done_results):
            continue

        cv_tokens = tokenize(cv['text'])
        cv_vec    = cache.get(sha256(cv['text']))
        rel       = jd_by_cat[cv['category']]

        # --- Step 1: Hybrid retrieve top-20 ---
        scores = {}
        for j_i, jd in enumerate(jd_list):
            tf_s  = tfidf_score(cv_tokens, tf_maps[j_i], idf)
            jd_vec = cache.get(jd['key'])
            emb_s = cosine(cv_vec, jd_vec) if cv_vec and jd_vec else 0.0
            scores[jd['key']] = ALPHA*tf_s + (1-ALPHA)*emb_s

        top20_keys = sorted(scores, key=lambda k: -scores[k])[:TOP_K1]
        top20_jobs = [jd_by_key[k] for k in top20_keys]

        # --- Step 2: LLM batch rank ---
        llm_results = llm_batch_rank(cv['text'], top20_jobs)
        top5_keys = [r['key'] for r in llm_results[:TOP_K2]]

        # Cost estimate: ~1000 tokens per call
        total_cost += 1000 * 0.15 / 1_000_000  # gpt-4o-mini input price

        # Metrics
        metrics_step1['r20'].append(recall_at_k(top20_keys, rel, 20))
        metrics_step1['r5'].append(recall_at_k(top20_keys, rel, 5))
        metrics_step1['p5'].append(precision_at_k(top20_keys, rel, 5))
        metrics_step1['mrr'].append(mrr(top20_keys, rel))
        metrics_step1['n5'].append(ndcg_at_k(top20_keys, rel, 5))
        metrics_step1['n20'].append(ndcg_at_k(top20_keys, rel, 20))
        metrics_step2['r5'].append(recall_at_k(top5_keys, rel, 5))
        metrics_step2['p5'].append(precision_at_k(top5_keys, rel, 5))
        metrics_step2['mrr'].append(mrr(top5_keys, rel))
        metrics_step2['n5'].append(ndcg_at_k(top5_keys, rel, 5))

        # Print progress
        top5_titles = ' | '.join(
            jd_by_key[k]['title'][:15] + ('*' if k in rel else '')
            for k in top5_keys
        )
        r20_val = metrics_step1['r20'][-1]
        print('%-5d %-20s %-8.2f  %s' % (q_i+1, cv['category'][:20], r20_val, top5_titles[:80]))

        # Save row
        row = {
            'q_i': q_i,
            'category': cv['category'],
            'relevant_keys': list(rel),
            'top20_keys': top20_keys,
            'top5_keys': top5_keys,
            'llm_results': llm_results,
        }
        all_results.append(row)

        # Checkpoint every 10
        if (q_i+1) % 10 == 0:
            checkpoint_path.write_text(json.dumps(all_results, indent=2))
            n_done = len(metrics_step2['p5'])
            print(f'  --- checkpoint {q_i+1}/{len(cv_list)} | '
                  f'step1 P@5={np.mean(metrics_step1["p5"]):.3f} | '
                  f'step2 P@5={np.mean(metrics_step2["p5"]):.3f} | '
                  f'est cost=${total_cost:.3f} ---')

        time.sleep(0.1)  # gentle rate limit

        # Stop after BATCH_SIZE new queries — re-run to continue
        new_done = q_i + 1 - len(done_results)
        if new_done >= BATCH_SIZE:
            print(f'\nBatch of {BATCH_SIZE} done. Re-run script to continue.')
            checkpoint_path.write_text(json.dumps(all_results, indent=2))
            break

    # Save full results
    FULL_RESULTS.write_text(json.dumps(all_results, indent=2))

    # Summary
    summary = {
        'n_queries': len(cv_list),
        'corpus_size': len(jd_list),
        'ground_truth': 'category-based',
        'alpha': ALPHA,
        'step1_hybrid_top20': {
            'recall@20':   float(np.mean(metrics_step1['r20'])),
            'recall@5':    float(np.mean(metrics_step1['r5'])),
            'precision@5': float(np.mean(metrics_step1['p5'])),
            'mrr':         float(np.mean(metrics_step1['mrr'])),
            'ndcg@5':      float(np.mean(metrics_step1['n5'])),
            'ndcg@20':     float(np.mean(metrics_step1['n20'])),
        },
        'step2_llm_top5': {
            'recall@5':    float(np.mean(metrics_step2['r5'])),
            'precision@5': float(np.mean(metrics_step2['p5'])),
            'mrr':         float(np.mean(metrics_step2['mrr'])),
            'ndcg@5':      float(np.mean(metrics_step2['n5'])),
        },
        'estimated_cost_usd': total_cost,
    }
    FULL_SUMMARY.write_text(json.dumps(summary, indent=2))

    print()
    print('=== RESULTS ===')
    print('Step 1 - Hybrid Retrieval (top-20):')
    s1 = summary['step1_hybrid_top20']
    print('  R@20=%.3f  R@5=%.3f  P@5=%.3f  MRR=%.3f  nDCG@5=%.3f  nDCG@20=%.3f' %
          (s1['recall@20'],s1['recall@5'],s1['precision@5'],s1['mrr'],s1['ndcg@5'],s1['ndcg@20']))
    print('Step 2 - LLM Re-rank (top-5):')
    s2 = summary['step2_llm_top5']
    print('  R@5=%.3f  P@5=%.3f  MRR=%.3f  nDCG@5=%.3f' %
          (s2['recall@5'],s2['precision@5'],s2['mrr'],s2['ndcg@5']))
    print(f'Estimated cost: ${total_cost:.3f} USD')
    print(f'Summary -> {FULL_SUMMARY}')

if __name__ == '__main__':
    main()
