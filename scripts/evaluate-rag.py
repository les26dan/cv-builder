#!/usr/bin/env python3
"""
RAG pipeline experiment — Chương 5.

Ground truth: category-based.
  - Corpus: 307 JD unique từ pairs.json
  - Query:  369 CV unique
  - Relevant(cv) = tất cả JD trong corpus có cùng category với CV

Pipeline variants (mirror ragPipeline.ts bước 1):
  tfidf_only      — cosine TF-IDF, IDF trên 307 JD
  embedding_only  — cosine text-embedding-3-small (từ cache)
  hybrid          — alpha*tfidf + (1-alpha)*embedding, alpha=0.4

Metrics (macro-average qua 369 CV):
  Recall@20, Recall@5, Precision@5, MRR, nDCG@5, nDCG@20

Output:
  data/eval/rag_summary.json
  thesis/Hinh_ve/rag_recall.png, rag_ndcg.png, rag_mrr.png
"""
from __future__ import annotations

import hashlib, json, math, sys
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

REPO        = Path(__file__).resolve().parent.parent
PAIRS_JSON  = REPO / 'data' / 'eval' / 'pairs.json'
EMBED_CACHE = REPO / 'data' / 'eval' / 'embeddings_cache.json'
RAG_SUMMARY = REPO / 'data' / 'eval' / 'rag_summary.json'
FIG_DIR     = REPO / 'thesis' / 'Hinh_ve'
FIG_DIR.mkdir(parents=True, exist_ok=True)

ALPHA  = 0.4   # TF-IDF weight (matches ragPipeline.ts)
TOP_K1 = 20
TOP_K2 = 5

STOP = {
    'the','and','or','of','to','with','in','for','a','an','be','is','are',
    'will','have','has','on','at','by','from','as','this','that','we','you',
    'they','it','our','your','their','all','not','but','can','do','its',
}

# =============================================================================
# TF-IDF
# =============================================================================

def tokenize(text: str) -> list[str]:
    import re
    return [t for t in re.split(r'\W+', text.lower()) if len(t) > 2 and t not in STOP]

def build_corpus(docs: list[str]):
    N = len(docs)
    tf_maps, df = [], defaultdict(int)
    for doc in docs:
        freq: dict[str,int] = defaultdict(int)
        for t in tokenize(doc): freq[t] += 1
        tf_maps.append(dict(freq))
        for t in freq: df[t] += 1
    idf = {t: math.log((N+1)/(c+1))+1 for t,c in df.items()}
    return tf_maps, idf

def tfidf_score(q_tokens: list[str], doc_tf: dict[str,int], idf: dict[str,float]) -> float:
    qf: dict[str,int] = defaultdict(int)
    for t in q_tokens: qf[t] += 1
    dot = qn = dn = 0.0
    for t in set(qf) | set(doc_tf):
        w = idf.get(t, 0.0)
        qw, dw = qf.get(t,0)*w, doc_tf.get(t,0)*w
        dot += qw*dw; qn += qw*qw; dn += dw*dw
    denom = math.sqrt(qn)*math.sqrt(dn)
    return dot/denom if denom else 0.0

# =============================================================================
# Embedding
# =============================================================================

def sha256(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()

def cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x*y for x,y in zip(a,b))
    na = math.sqrt(sum(x*x for x in a))
    nb = math.sqrt(sum(x*x for x in b))
    return dot/(na*nb) if na and nb else 0.0

# =============================================================================
# Metrics
# =============================================================================

def recall_at_k(ranked: list[str], rel: set[str], k: int) -> float:
    if not rel: return 0.0
    return sum(1 for r in ranked[:k] if r in rel) / len(rel)

def precision_at_k(ranked: list[str], rel: set[str], k: int) -> float:
    if not k: return 0.0
    return sum(1 for r in ranked[:k] if r in rel) / k

def mrr(ranked: list[str], rel: set[str]) -> float:
    for i, r in enumerate(ranked):
        if r in rel: return 1.0/(i+1)
    return 0.0

def ndcg_at_k(ranked: list[str], rel: set[str], k: int) -> float:
    gains = [1.0 if r in rel else 0.0 for r in ranked[:k]]
    dcg  = sum(g/math.log2(i+2) for i,g in enumerate(gains))
    idcg = sum(1.0/math.log2(i+2) for i in range(min(k, len(rel))))
    return dcg/idcg if idcg else 0.0

# =============================================================================
# Main
# =============================================================================

def main():
    pairs = json.loads(PAIRS_JSON.read_text())
    cache: dict[str, list[float]] = json.loads(EMBED_CACHE.read_text())
    print(f'Pairs: {len(pairs)}  |  Embed cache: {len(cache)} vectors')

    # --- Build JD corpus ---
    jd_list: list[dict] = []
    seen_jd: set[str] = set()
    for p in pairs:
        key = sha256(p['jdText'])
        if key not in seen_jd:
            seen_jd.add(key)
            jd_list.append({'key': key, 'text': p['jdText'],
                            'category': p['jdCategory'], 'title': p['jdTitle']})
    print(f'JD corpus: {len(jd_list)} unique JDs')

    # --- Build CV list ---
    cv_map: dict[str, dict] = {}
    for p in pairs:
        if p['resumeId'] not in cv_map:
            cv_map[p['resumeId']] = {'text': p['resumeText'], 'category': p['resumeCategory']}
    cv_list = list(cv_map.values())
    print(f'CV queries: {len(cv_list)} unique CVs')

    # --- Ground truth: category-based ---
    # relevant(cv) = set of jd keys có cùng category với cv
    jd_by_cat: dict[str, set[str]] = defaultdict(set)
    for jd in jd_list:
        jd_by_cat[jd['category']].add(jd['key'])

    cat_dist = Counter(jd['category'] for jd in jd_list)
    print('\nJDs per category (ground truth size):')
    for cat, cnt in sorted(cat_dist.items()):
        print(f'  {cat}: {cnt}')

    # --- Precompute TF-IDF ---
    jd_texts = [jd['text'] for jd in jd_list]
    tf_maps, idf = build_corpus(jd_texts)
    print('\nTF-IDF corpus built.')

    # --- Score all (CV, JD) pairs for each pipeline ---
    pipelines = ['tfidf_only', 'embedding_only', 'hybrid']
    metrics_keys = ['recall@20','recall@5','precision@5','mrr','ndcg@5','ndcg@20']
    accum: dict[str, dict[str, list[float]]] = {
        p: {m: [] for m in metrics_keys} for p in pipelines
    }

    missing_cv_emb = 0
    for q_idx, cv in enumerate(cv_list):
        cv_tokens = tokenize(cv['text'])
        cv_hash   = sha256(cv['text'])
        cv_vec    = cache.get(cv_hash)
        if cv_vec is None:
            missing_cv_emb += 1

        relevant = jd_by_cat[cv['category']]  # set of jd keys

        # Score every JD
        scores: dict[str, dict[str,float]] = {p: {} for p in pipelines}
        for j_idx, jd in enumerate(jd_list):
            jd_key = jd['key']
            tf_s = tfidf_score(cv_tokens, tf_maps[j_idx], idf)

            jd_vec = cache.get(jd_key)
            if cv_vec is not None and jd_vec is not None:
                emb_s = cosine(cv_vec, jd_vec)
            else:
                emb_s = 0.0

            scores['tfidf_only'][jd_key]    = tf_s
            scores['embedding_only'][jd_key] = emb_s
            scores['hybrid'][jd_key]         = ALPHA*tf_s + (1-ALPHA)*emb_s

        # Compute metrics per pipeline
        for pipe in pipelines:
            ranked = sorted(scores[pipe], key=lambda k: -scores[pipe][k])
            accum[pipe]['recall@20'].append(recall_at_k(ranked, relevant, 20))
            accum[pipe]['recall@5'].append(recall_at_k(ranked, relevant, 5))
            accum[pipe]['precision@5'].append(precision_at_k(ranked, relevant, 5))
            accum[pipe]['mrr'].append(mrr(ranked, relevant))
            accum[pipe]['ndcg@5'].append(ndcg_at_k(ranked, relevant, 5))
            accum[pipe]['ndcg@20'].append(ndcg_at_k(ranked, relevant, 20))

        if (q_idx+1) % 100 == 0:
            print(f'  {q_idx+1}/{len(cv_list)} done')

    if missing_cv_emb:
        print(f'WARN: {missing_cv_emb} CV vectors missing from cache')

    # --- Aggregate ---
    summary: dict = {
        'n_queries': len(cv_list),
        'corpus_size': len(jd_list),
        'ground_truth': 'category-based (all JDs with same category as CV)',
        'alpha': ALPHA,
        'pipelines': {}
    }
    for pipe in pipelines:
        summary['pipelines'][pipe] = {m: float(np.mean(accum[pipe][m])) for m in metrics_keys}

    # --- Print table ---
    print(f'\n{"Pipeline":<18} {"R@20":>6} {"R@5":>6} {"P@5":>6} {"MRR":>6} {"nDCG@5":>7} {"nDCG@20":>8}')
    print('-'*60)
    for pipe in pipelines:
        s = summary['pipelines'][pipe]
        print(f'{pipe:<18} {s["recall@20"]:>6.3f} {s["recall@5"]:>6.3f} '
              f'{s["precision@5"]:>6.3f} {s["mrr"]:>6.3f} '
              f'{s["ndcg@5"]:>7.3f} {s["ndcg@20"]:>8.3f}')

    RAG_SUMMARY.write_text(json.dumps(summary, indent=2))
    print(f'\nSummary → {RAG_SUMMARY}')

    # --- Plots ---
    plot_grouped_bar(summary, pipelines, ['recall@20','recall@5'], 'Recall', 'rag_recall.png', 'Recall@20 và Recall@5 theo pipeline (ground truth: category)')
    plot_grouped_bar(summary, pipelines, ['ndcg@5','ndcg@20'],     'nDCG',   'rag_ndcg.png',   'nDCG@5 và nDCG@20 theo pipeline')
    plot_single_bar(summary, pipelines, 'mrr', 'MRR', 'rag_mrr.png', 'Mean Reciprocal Rank theo pipeline')
    print(f'Plots → {FIG_DIR}/')

# =============================================================================
# Plots
# =============================================================================

plt.rcParams.update({'font.family':'DejaVu Sans','axes.titlesize':13,'axes.labelsize':11,'figure.dpi':110})

COLORS = {'tfidf_only':'#5B8BC9','embedding_only':'#6BC78A','hybrid':'#E08E5C'}
LABELS = {'tfidf_only':'TF-IDF','embedding_only':'Embedding','hybrid':'Hybrid (TF-IDF+Emb, α=0.4)'}

def plot_grouped_bar(summary, pipelines, metric_pair, ylabel, fname, title):
    fig, ax = plt.subplots(figsize=(8, 4.5))
    xs = np.arange(len(pipelines))
    w = 0.35
    m1, m2 = metric_pair
    v1 = [summary['pipelines'][p][m1] for p in pipelines]
    v2 = [summary['pipelines'][p][m2] for p in pipelines]
    b1 = ax.bar(xs-w/2, v1, w, label=m1.upper(), color='#5B8BC9', edgecolor='black', lw=0.7)
    b2 = ax.bar(xs+w/2, v2, w, label=m2.upper(), color='#E08E5C', edgecolor='black', lw=0.7)
    ax.set_xticks(xs)
    ax.set_xticklabels([LABELS.get(p,p) for p in pipelines], fontsize=10)
    ax.set_ylabel(ylabel); ax.set_title(title); ax.set_ylim(0,1.1)
    ax.legend(); ax.grid(axis='y', linestyle=':', alpha=0.5)
    for bar in list(b1)+list(b2):
        h = bar.get_height()
        ax.text(bar.get_x()+bar.get_width()/2, h+0.01, f'{h:.3f}', ha='center', fontsize=8.5)
    fig.tight_layout(); fig.savefig(FIG_DIR/fname); plt.close(fig)
    print(f'  Saved {fname}')

def plot_single_bar(summary, pipelines, metric, ylabel, fname, title):
    fig, ax = plt.subplots(figsize=(7, 4.2))
    xs = np.arange(len(pipelines))
    vals = [summary['pipelines'][p][metric] for p in pipelines]
    colors = [COLORS.get(p,'#888') for p in pipelines]
    bars = ax.bar(xs, vals, color=colors, edgecolor='black', lw=0.7)
    ax.set_xticks(xs)
    ax.set_xticklabels([LABELS.get(p,p) for p in pipelines], fontsize=10)
    ax.set_ylabel(ylabel); ax.set_title(title); ax.set_ylim(0,1.1)
    ax.grid(axis='y', linestyle=':', alpha=0.5)
    for bar in bars:
        h = bar.get_height()
        ax.text(bar.get_x()+bar.get_width()/2, h+0.01, f'{h:.3f}', ha='center', fontsize=10)
    fig.tight_layout(); fig.savefig(FIG_DIR/fname); plt.close(fig)
    print(f'  Saved {fname}')

if __name__ == '__main__':
    main()
