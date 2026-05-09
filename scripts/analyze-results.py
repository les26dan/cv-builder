#!/usr/bin/env python3
"""
Thesis evaluation analysis — D6.

Reads:  data/eval/results.csv  (output of scripts/evaluate-matching.ts)
Writes: data/eval/metrics_summary.json
        thesis/Hinh_ve/*.png

Computes per method (tfidf, embedding, llm):
  - Ranking:    Precision@5/10, Recall@10, nDCG@10, MRR (treating all 400
                pairs as one ranked list per method)
  - Classification: ROC-AUC, F1 at score-median threshold
  - Latency:    p50, p95 (ms)
  - Cost:       USD per 1000 pairs

Statistical tests:
  - Paired Wilcoxon signed-rank between method pairs (test statistic on
    per-pair squared error |label - score/100|^2)
  - Bootstrap 95% CI (10k resamples, seed=42) on nDCG@10

Run:
  .venv/bin/python scripts/analyze-results.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # no display needed
import matplotlib.pyplot as plt
from scipy.stats import wilcoxon
from sklearn.metrics import roc_auc_score, roc_curve, f1_score

# =============================================================================
# Paths
# =============================================================================

REPO = Path(__file__).resolve().parent.parent
RESULTS_CSV = REPO / 'data' / 'eval' / 'results.csv'
SUMMARY_JSON = REPO / 'data' / 'eval' / 'metrics_summary.json'
FIG_DIR = REPO / 'thesis' / 'Hinh_ve'
FIG_DIR.mkdir(parents=True, exist_ok=True)

SEED = 42
N_BOOTSTRAP = 10_000

# =============================================================================
# Metrics
# =============================================================================

def precision_at_k(scores: np.ndarray, labels: np.ndarray, k: int) -> float:
    """Treat the entire set as one ranked list. P@k = positives in top-k / k."""
    order = np.argsort(-scores)            # descending
    top_k = labels[order[:k]]
    return float(top_k.sum() / k)

def recall_at_k(scores: np.ndarray, labels: np.ndarray, k: int) -> float:
    order = np.argsort(-scores)
    top_k = labels[order[:k]]
    total_pos = labels.sum()
    return float(top_k.sum() / total_pos) if total_pos > 0 else 0.0

def ndcg_at_k(scores: np.ndarray, labels: np.ndarray, k: int) -> float:
    """Binary-relevance nDCG@k. Ideal DCG = sum of 1/log2(i+1) over first
    min(k, #positives) positions."""
    order = np.argsort(-scores)
    gains = labels[order[:k]]
    discounts = 1.0 / np.log2(np.arange(2, k + 2))
    dcg = float(np.sum(gains * discounts))
    n_pos = int(labels.sum())
    ideal_gains = np.zeros(k)
    ideal_gains[: min(k, n_pos)] = 1
    idcg = float(np.sum(ideal_gains * discounts))
    return dcg / idcg if idcg > 0 else 0.0

def mrr(scores: np.ndarray, labels: np.ndarray) -> float:
    """Mean reciprocal rank of the first positive. With one big list this
    collapses to 1 / (rank of top-scoring positive)."""
    order = np.argsort(-scores)
    ranked_labels = labels[order]
    pos_positions = np.where(ranked_labels == 1)[0]
    if len(pos_positions) == 0:
        return 0.0
    return float(1.0 / (pos_positions[0] + 1))

def bootstrap_ci(
    scores: np.ndarray,
    labels: np.ndarray,
    metric_fn,
    n: int = N_BOOTSTRAP,
    alpha: float = 0.05,
    seed: int = SEED,
):
    """Bootstrap CI by resampling pair indices with replacement."""
    rng = np.random.default_rng(seed)
    N = len(scores)
    boots = np.empty(n)
    for i in range(n):
        idx = rng.integers(0, N, N)
        boots[i] = metric_fn(scores[idx], labels[idx])
    lo, hi = np.quantile(boots, [alpha / 2, 1 - alpha / 2])
    return float(boots.mean()), float(lo), float(hi)

# =============================================================================
# Pipeline
# =============================================================================

def main() -> None:
    if not RESULTS_CSV.exists():
        print(f'ERROR: {RESULTS_CSV} missing. Run evaluate-matching.ts first.', file=sys.stderr)
        sys.exit(1)

    df = pd.read_csv(RESULTS_CSV)
    print(f'Loaded {len(df)} rows from {RESULTS_CSV.name}')

    # Drop error rows (score = -1)
    err_count = (df['score'] < 0).sum()
    if err_count:
        print(f'WARN: dropping {err_count} error rows')
        df = df[df['score'] >= 0].copy()

    methods = sorted(df['method'].unique())
    print(f'Methods present: {methods}\n')

    summary: dict = {
        'pairs_total': int(df['pairId'].nunique()),
        'positives':   int(df[df['method'] == methods[0]]['label'].sum()),
        'methods': {},
        'pairwise_wilcoxon': {},
    }

    # ------------------------------------------------------------------
    # Per-method metrics
    # ------------------------------------------------------------------
    method_data: dict[str, dict] = {}
    for m in methods:
        sub = df[df['method'] == m].sort_values('pairId').reset_index(drop=True)
        scores = sub['score'].to_numpy()
        labels = sub['label'].to_numpy()
        latencies = sub['latencyMs'].to_numpy()
        costs = sub['costUsd'].to_numpy()

        # Threshold = median of THIS method's scores (TREC convention for
        # comparing methods whose absolute scales differ).
        thresh = float(np.median(scores))
        preds = (scores >= thresh).astype(int)

        try:
            auc = float(roc_auc_score(labels, scores))
        except ValueError:
            auc = float('nan')

        ndcg_mean, ndcg_lo, ndcg_hi = bootstrap_ci(scores, labels, lambda s, l: ndcg_at_k(s, l, 10))
        p10_mean, p10_lo, p10_hi = bootstrap_ci(scores, labels, lambda s, l: precision_at_k(s, l, 10))

        method_data[m] = {
            'scores': scores,
            'labels': labels,
            'latencies': latencies,
            'costs': costs,
        }

        summary['methods'][m] = {
            'precision_at_5':  precision_at_k(scores, labels, 5),
            'precision_at_10': precision_at_k(scores, labels, 10),
            'precision_at_10_ci95': [p10_lo, p10_hi],
            'recall_at_10':    recall_at_k(scores, labels, 10),
            'ndcg_at_10':      ndcg_at_k(scores, labels, 10),
            'ndcg_at_10_ci95': [ndcg_lo, ndcg_hi],
            'mrr':             mrr(scores, labels),
            'roc_auc':         auc,
            'f1_at_median':    float(f1_score(labels, preds)),
            'threshold':       thresh,
            'latency_p50_ms':  float(np.percentile(latencies, 50)),
            'latency_p95_ms':  float(np.percentile(latencies, 95)),
            'cost_per_1000_pairs_usd': float(costs.sum() * 1000 / len(scores)) if len(scores) else 0.0,
            'n_pairs':         int(len(scores)),
        }

        s = summary['methods'][m]
        print(f'{m:>10s}  P@10={s["precision_at_10"]:.3f}  '
              f'nDCG@10={s["ndcg_at_10"]:.3f} [{ndcg_lo:.3f},{ndcg_hi:.3f}]  '
              f'AUC={auc:.3f}  F1={s["f1_at_median"]:.3f}  '
              f'p50={s["latency_p50_ms"]:.0f}ms  '
              f'cost/1k=${s["cost_per_1000_pairs_usd"]:.4f}')

    # ------------------------------------------------------------------
    # Pairwise Wilcoxon — paired per-pair squared error |label - score/100|^2
    # ------------------------------------------------------------------
    print('\nPairwise paired Wilcoxon (on per-pair squared error):')
    for i, m1 in enumerate(methods):
        for m2 in methods[i + 1:]:
            err1 = (method_data[m1]['labels'] - method_data[m1]['scores'] / 100.0) ** 2
            err2 = (method_data[m2]['labels'] - method_data[m2]['scores'] / 100.0) ** 2
            try:
                stat, p = wilcoxon(err1, err2, zero_method='wilcox', alternative='two-sided')
                better = m1 if err1.mean() < err2.mean() else m2
                key = f'{m1}_vs_{m2}'
                summary['pairwise_wilcoxon'][key] = {
                    'statistic': float(stat),
                    'p_value':   float(p),
                    'mean_err_m1': float(err1.mean()),
                    'mean_err_m2': float(err2.mean()),
                    'lower_error_method': better,
                }
                sig = '***' if p < 0.001 else '**' if p < 0.01 else '*' if p < 0.05 else 'ns'
                print(f'  {m1:>10s} vs {m2:<10s}  W={stat:>10.1f}  p={p:.4g}  {sig}  (lower err: {better})')
            except ValueError as e:
                print(f'  {m1} vs {m2}: skipped — {e}')

    # ------------------------------------------------------------------
    # Save summary
    # ------------------------------------------------------------------
    SUMMARY_JSON.write_text(json.dumps(summary, indent=2))
    print(f'\nSummary written to {SUMMARY_JSON}')

    # ------------------------------------------------------------------
    # Plots
    # ------------------------------------------------------------------
    plot_bar_ndcg(summary, methods)
    plot_pareto(summary, methods)
    plot_roc(method_data, methods)
    plot_score_dist(method_data, methods)
    print(f'Plots written to {FIG_DIR}/')


# =============================================================================
# Plots
# =============================================================================

# Vietnamese-safe font (DejaVu Sans handles Vietnamese diacritics natively)
plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['axes.titlesize'] = 13
plt.rcParams['axes.labelsize'] = 11
plt.rcParams['figure.dpi'] = 110

METHOD_COLORS = {
    'tfidf': '#5B8BC9',
    'embedding': '#6BC78A',
    'llm': '#E08E5C',
}
METHOD_LABELS_VI = {
    'tfidf': 'TF-IDF',
    'embedding': 'Embedding (text-embedding-3-small)',
    'llm': 'LLM (gpt-4o-mini)',
}

def _label(m: str) -> str:
    return METHOD_LABELS_VI.get(m, m)

def plot_bar_ndcg(summary, methods) -> None:
    fig, ax = plt.subplots(figsize=(7, 4.2))
    xs = np.arange(len(methods))
    means = [summary['methods'][m]['ndcg_at_10'] for m in methods]
    lows = [summary['methods'][m]['ndcg_at_10_ci95'][0] for m in methods]
    highs = [summary['methods'][m]['ndcg_at_10_ci95'][1] for m in methods]
    errs = [[mu - lo for mu, lo in zip(means, lows)], [hi - mu for mu, hi in zip(means, highs)]]
    colors = [METHOD_COLORS.get(m, '#888888') for m in methods]
    ax.bar(xs, means, yerr=errs, capsize=6, color=colors, edgecolor='black', linewidth=0.8)
    ax.set_xticks(xs)
    ax.set_xticklabels([_label(m) for m in methods])
    ax.set_ylabel('nDCG@10')
    ax.set_title('nDCG@10 với bootstrap 95% CI (n=10,000)')
    ax.set_ylim(0, 1.05)
    ax.grid(axis='y', linestyle=':', alpha=0.5)
    for x, mu in zip(xs, means):
        ax.text(x, mu + 0.02, f'{mu:.3f}', ha='center', fontsize=10)
    fig.tight_layout()
    fig.savefig(FIG_DIR / 'bar_ndcg10_ci.png')
    plt.close(fig)

def plot_pareto(summary, methods) -> None:
    fig, ax = plt.subplots(figsize=(7, 4.5))
    for m in methods:
        x = summary['methods'][m]['cost_per_1000_pairs_usd']
        y = summary['methods'][m]['ndcg_at_10']
        ax.scatter(x, y, s=140, color=METHOD_COLORS.get(m, '#888'), edgecolor='black', zorder=3, label=_label(m))
        ax.annotate(_label(m), (x, y), textcoords='offset points', xytext=(8, 8), fontsize=10)
    ax.set_xscale('symlog', linthresh=0.01)
    ax.set_xlabel('Chi phí (USD / 1.000 cặp)')
    ax.set_ylabel('nDCG@10')
    ax.set_title('Cost–quality trade-off (Pareto)')
    ax.grid(linestyle=':', alpha=0.5)
    ax.set_ylim(0, 1.05)
    fig.tight_layout()
    fig.savefig(FIG_DIR / 'pareto_cost_quality.png')
    plt.close(fig)

def plot_roc(method_data, methods) -> None:
    fig, ax = plt.subplots(figsize=(6, 6))
    for m in methods:
        labels = method_data[m]['labels']
        scores = method_data[m]['scores']
        try:
            fpr, tpr, _ = roc_curve(labels, scores)
            auc = roc_auc_score(labels, scores)
            ax.plot(fpr, tpr, lw=2.0, color=METHOD_COLORS.get(m, '#888'), label=f'{_label(m)} (AUC={auc:.3f})')
        except ValueError:
            pass
    ax.plot([0, 1], [0, 1], 'k--', lw=1, alpha=0.5)
    ax.set_xlabel('False Positive Rate')
    ax.set_ylabel('True Positive Rate')
    ax.set_title('ROC — phân biệt cặp liên quan / không liên quan')
    ax.legend(loc='lower right')
    ax.grid(linestyle=':', alpha=0.5)
    fig.tight_layout()
    fig.savefig(FIG_DIR / 'roc_curves.png')
    plt.close(fig)

def plot_score_dist(method_data, methods) -> None:
    fig, axes = plt.subplots(1, len(methods), figsize=(4 * len(methods), 4), sharey=False)
    if len(methods) == 1:
        axes = [axes]
    for ax, m in zip(axes, methods):
        labels = method_data[m]['labels']
        scores = method_data[m]['scores']
        neg = scores[labels == 0]
        pos = scores[labels == 1]
        bp = ax.boxplot([neg, pos], tick_labels=['Không liên quan', 'Liên quan'], patch_artist=True, widths=0.55)
        for patch, color in zip(bp['boxes'], ['#D9D9D9', METHOD_COLORS.get(m, '#888')]):
            patch.set_facecolor(color)
        ax.set_title(_label(m))
        ax.set_ylabel('Score')
        ax.grid(axis='y', linestyle=':', alpha=0.5)
    fig.suptitle('Phân phối điểm theo nhãn ground-truth')
    fig.tight_layout()
    fig.savefig(FIG_DIR / 'score_distribution.png')
    plt.close(fig)


if __name__ == '__main__':
    main()
