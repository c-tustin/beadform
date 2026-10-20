"""Authored semantic labels for the bundled draft catalog; no geometry targets."""
import hashlib
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE / 'catalog-selector-v1'


def load():
    subjects = [line.split('\t') for line in (DATA/'subjects.tsv').read_text().splitlines() if line]
    if any(len(row) != 5 for row in subjects):
        raise ValueError('Each subject needs a catalog ID, three train prompts and one dev prompt.')
    families = [row[0] for row in subjects]
    approved = [json.loads(line) for line in (HERE/'approved-expanded.jsonl').read_text().splitlines() if line]
    expected = {r['group'] for r in approved if r.get('reviewed') is True
                and r.get('training_consent') is True and r.get('scene_validated') is True
                and r['group'] != 'fish'}
    if len(set(families)) != len(families) or set(families) != expected:
        raise ValueError('Semantic catalog must match the bundled approved draft subjects exactly.')
    train, dev = [], []
    for family, *prompts in subjects:
        for i, prompt in enumerate(prompts):
            row = {'id':f'{family}-{i+1}', 'prompt':prompt, 'family':family,
                   'category':'supported', 'label_source':'authored-synthetic',
                   'user_reviewed':False, 'physical_success':None}
            (train if i < 3 else dev).append(row)
    negative = json.loads((DATA/'rejections.json').read_text())
    for split, rows in [('train', train), ('dev', dev)]:
        for i, (category, prompt) in enumerate(negative[split]):
            rows.append({'id':f'reject-{split}-{i+1}', 'prompt':prompt, 'family':'unknown',
                         'category':category, 'label_source':'authored-synthetic',
                         'user_reviewed':False, 'physical_success':None})
    normalize = lambda s: re.sub(r'\W+', ' ', s.casefold()).strip()
    all_rows = train + dev
    if any(not r['prompt'].strip() for r in all_rows):
        raise ValueError('Empty prompt.')
    if len({normalize(r['prompt']) for r in all_rows}) != len(all_rows):
        raise ValueError('Duplicate or overlapping training/development prompts.')
    system = ('Select one existing Beadform draft subject. Supported IDs: '+', '.join(families)+'. '
              'Return unknown when there is no matching subject, when a request is ambiguous, '
              'or when it combines more than one object or subject. Fish is excluded. '
              'Do not substitute a similar animal or object for an unsupported request. '
              'bird means a generic small songbird; spaceship means a flying saucer; '
              'rocket means a pointed launch vehicle. This selects an existing draft, '
              'not a custom design. Output exactly {"family":"ID"} with a supported ID or unknown. '
              'Never output geometry, counts, thread instructions or physical-success claims.')
    return train, dev, families+['unknown'], system


def fingerprints():
    files = [Path(__file__), DATA/'subjects.tsv', DATA/'rejections.json', HERE/'approved-expanded.jsonl']
    return {str(p.relative_to(HERE)):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}


if __name__ == '__main__':
    train, dev, families, _ = load()
    print(json.dumps({'train':len(train), 'dev':len(dev), 'supported_subjects':len(families)-1,
                      'train_rejections':sum(r['family']=='unknown' for r in train),
                      'dev_rejections':sum(r['family']=='unknown' for r in dev),
                      'source_sha256':fingerprints(),
                      'note':'Synthetic semantic development data, not physical build labels or an independent test.'},indent=2))
