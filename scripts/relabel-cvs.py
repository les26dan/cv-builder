#!/usr/bin/env python3
"""
Re-label CVs in noisy categories using GPT-4o-mini.
Input:  data/eval/pairs.json
Output: data/eval/cv_relabeled.json  { resumeId: new_category }
"""
import json, os, time, urllib.request
from pathlib import Path
from collections import Counter

REPO      = Path(__file__).resolve().parent.parent
PAIRS     = REPO / 'data' / 'eval' / 'pairs.json'
OUT       = REPO / 'data' / 'eval' / 'cv_relabeled.json'
API_KEY   = os.environ.get('OPENAI_API_KEY', '')
MODEL     = 'gpt-4o-mini'

NOISY_CATS = {'CONSULTANT', 'BPO', 'AUTOMOBILE', 'ADVOCATE'}

CATEGORIES = [
    'ACCOUNTANT','ADVOCATE','AGRICULTURE','APPAREL','ARTS','AUTOMOBILE',
    'AVIATION','BANKING','BPO','BUSINESS-DEVELOPMENT','CHEF','CONSTRUCTION',
    'CONSULTANT','DESIGNER','DIGITAL-MEDIA','ENGINEERING','FINANCE','FITNESS',
    'HEALTHCARE','HR','INFORMATION-TECHNOLOGY','PUBLIC-RELATIONS','SALES','TEACHER'
]

def classify(resume_text: str, original_cat: str) -> tuple[str, str]:
    cats_str = ', '.join(CATEGORIES)
    prompt = f"""You are a resume classifier. Given the resume below, pick the SINGLE best category from this list:
{cats_str}

Original label (may be wrong): {original_cat}

Resume (first 800 chars):
{resume_text[:800]}

Reply with ONLY the category name, nothing else."""

    payload = json.dumps({
        'model': MODEL,
        'messages': [{'role': 'user', 'content': prompt}],
        'max_tokens': 20,
        'temperature': 0
    }).encode()
    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=payload,
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {API_KEY}'},
        method='POST'
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read())
            new_cat = data['choices'][0]['message']['content'].strip().upper()
            # Validate
            if new_cat not in CATEGORIES:
                # Try partial match
                for c in CATEGORIES:
                    if c in new_cat or new_cat in c:
                        new_cat = c
                        break
                else:
                    new_cat = original_cat  # fallback
            return new_cat, ''
        except Exception as e:
            if attempt < 2: time.sleep(5)
            err = str(e)
    return original_cat, err

def main():
    if not API_KEY:
        print('ERROR: OPENAI_API_KEY not set'); return

    pairs = json.loads(PAIRS.read_text())

    # Collect unique CVs in noisy categories
    cv_map = {}
    for p in pairs:
        rid = p['resumeId']
        if rid not in cv_map:
            cv_map[rid] = {'text': p['resumeText'], 'category': p['resumeCategory']}

    to_relabel = {rid: v for rid, v in cv_map.items() if v['category'] in NOISY_CATS}
    print(f'CVs to re-label: {len(to_relabel)}')

    # Load existing results
    result: dict[str, str] = {}
    if OUT.exists():
        result = json.loads(OUT.read_text())
        print(f'Already done: {len(result)}')

    todo = [(rid, v) for rid, v in to_relabel.items() if rid not in result]
    print(f'Remaining: {len(todo)}')

    changes = Counter()
    for i, (rid, v) in enumerate(todo):
        orig = v['category']
        new, err = classify(v['text'], orig)
        result[rid] = new
        if new != orig:
            changes[f'{orig} → {new}'] += 1
            print(f'  [{i+1}/{len(todo)}] {orig} → {new}')
        else:
            print(f'  [{i+1}/{len(todo)}] {orig} (unchanged)')

        if i % 10 == 9:
            OUT.write_text(json.dumps(result, indent=2))
        time.sleep(0.3)

    OUT.write_text(json.dumps(result, indent=2))

    print(f'\nDone. {len(result)} CVs labeled.')
    print('\nChanges:')
    for k, v in sorted(changes.items(), key=lambda x: -x[1]):
        print(f'  {k}: {v}')

if __name__ == '__main__':
    main()
