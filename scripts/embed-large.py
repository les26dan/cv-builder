#!/usr/bin/env python3
"""
Re-embed all unique texts từ pairs.json dùng text-embedding-3-large (3072-dim).
Output: data/eval/embeddings_cache_large.json  { sha256: [3072 floats] }
Cost: ~$0.02
"""
import hashlib, json, os, time, urllib.request
from pathlib import Path

REPO       = Path(__file__).resolve().parent.parent
PAIRS_JSON = REPO / 'data' / 'eval' / 'pairs.json'
OUT_CACHE  = REPO / 'data' / 'eval' / 'embeddings_cache_large.json'
API_KEY    = os.environ.get('OPENAI_API_KEY', '')
MODEL      = 'text-embedding-3-large'
BATCH      = 16

def sha256(t): return hashlib.sha256(t.encode()).hexdigest()

def embed_batch(texts: list[str]) -> list[list[float]]:
    payload = json.dumps({'model': MODEL, 'input': texts}).encode()
    req = urllib.request.Request(
        'https://api.openai.com/v1/embeddings',
        data=payload,
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {API_KEY}'},
        method='POST'
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read())
            return [item['embedding'] for item in sorted(data['data'], key=lambda x: x['index'])]
        except Exception as e:
            print(f'  attempt {attempt+1} error: {e}')
            if attempt < 2: time.sleep(5*(attempt+1))
    raise RuntimeError('embed_batch failed after 3 attempts')

def main():
    if not API_KEY:
        print('ERROR: OPENAI_API_KEY not set'); return

    pairs = json.loads(PAIRS_JSON.read_text())

    # Collect all unique texts
    texts = set()
    for p in pairs:
        texts.add(p['resumeText'])
        texts.add(p['jdText'])
    texts = list(texts)
    print(f'Unique texts: {len(texts)}')

    # Load existing cache
    cache: dict[str, list[float]] = {}
    if OUT_CACHE.exists():
        cache = json.loads(OUT_CACHE.read_text())
        print(f'Existing cache: {len(cache)} vectors')

    # Filter uncached
    todo = [t for t in texts if sha256(t) not in cache]
    print(f'To embed: {len(todo)}')
    if not todo:
        print('All cached. Done.'); return

    # Embed in batches
    total = len(todo)
    for i in range(0, total, BATCH):
        batch = todo[i:i+BATCH]
        vecs = embed_batch(batch)
        for text, vec in zip(batch, vecs):
            cache[sha256(text)] = vec
        print(f'  {min(i+BATCH, total)}/{total} embedded')
        # Save incrementally
        if (i // BATCH) % 5 == 0:
            OUT_CACHE.write_text(json.dumps(cache))
        time.sleep(0.2)

    OUT_CACHE.write_text(json.dumps(cache))
    print(f'Done. Cache size: {len(cache)} vectors → {OUT_CACHE}')

if __name__ == '__main__':
    main()
