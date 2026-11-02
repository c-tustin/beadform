"""Expanded synthetic catalog requests; original development set stays unchanged."""
import hashlib
import json
import re
from pathlib import Path
from catalog_data import load as load_v1, fingerprints as fingerprints_v1, HERE
DATA = HERE/'catalog-selector-v2'
def challenge_rows():
    return [json.loads(line) for line in (DATA/'challenge.jsonl').read_text().splitlines() if line]
def load():
    train, dev, families, system = load_v1()
    extra = [json.loads(line) for line in (DATA/'extra-train.jsonl').read_text().splitlines() if line]
    train = train + extra
    challenge = challenge_rows()
    all_rows = train + dev + challenge
    normalized = [re.sub(r'\W+', ' ', r['prompt'].casefold()).strip() for r in all_rows]
    if len(set(normalized)) != len(normalized) or len({r['id'] for r in all_rows}) != len(all_rows):
        raise ValueError('Duplicate IDs or normalized prompts across train, development or challenge.')
    for r in all_rows:
        if r['family'] not in families or not r['prompt'].strip():
            raise ValueError('Invalid catalog label or empty prompt.')
        if r['label_source'] != 'authored-synthetic' or r['user_reviewed'] is not False or r['physical_success'] is not None:
            raise ValueError('Synthetic prompts must not acquire human-review or physical-success labels.')
        if (r['category']=='supported') != (r['family']!='unknown'):
            raise ValueError('Category/label mismatch.')
    if (len(train),len(dev),len(challenge)) != (320,48,80):
        raise ValueError('Unexpected frozen dataset sizes.')
    return train, dev, families, system
def fingerprints():
    files=[Path(__file__),DATA/'extra-train.jsonl',DATA/'challenge.jsonl']
    return {**fingerprints_v1(),**{str(p.relative_to(HERE)):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}}
