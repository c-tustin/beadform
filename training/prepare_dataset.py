"""Convert feedback into a review queue, or split explicitly reviewed targets. No network."""
import argparse, json, hashlib
from pathlib import Path

def read(path):
    return [json.loads(x) for x in Path(path).read_text().splitlines() if x.strip()]

def queue(rows):
    out=[]
    for r in rows:
        if r.get('format')!='beadform-build-feedback' or r.get('consent',{}).get('trainingExport') is not True:
            raise ValueError('expected an explicitly opted-in beadform feedback export')
        snap=r.get('projectAtUpload') or {}
        scene=snap.get('design')
        if isinstance(scene,dict): scene={**scene,'notes':scene.get('notes','')}
        out.append(dict(id=hashlib.sha256(json.dumps(r,sort_keys=True).encode()).hexdigest()[:16],
            group='',prompt=snap.get('description',''),scene=scene,image=None,
            training_consent=True,reviewed=False,physically_tested=False,
            outcome=r.get('outcome'),issues=r.get('issues',[]),review_notes=r.get('feedback',''),
            source={'kind':'user-build-feedback','consent':r['consent']},
            finished_photo=r.get('photo'),
            todo='set the design family; correct the scene after building; record review and physical testing; attach the original input image separately'))
    return out

def split(rows,source,heldout):
    if not heldout: raise ValueError('choose at least one held-out family')
    from jsonschema import validate
    schema=json.loads((Path(__file__).resolve().parent.parent/'schemas'/'scene-schema.json').read_text())
    train=[];evaluation=[];seen=set()
    for r in rows:
        if any(r.get(k) is not True for k in ['training_consent','reviewed','physically_tested']):
            raise ValueError('unapproved row: review, consent and physical testing must be established')
        if not str(r.get('group','')).strip() or not str(r.get('prompt','')).strip():
            raise ValueError('each row needs a family and original input prompt')
        validate(r.get('scene'),schema)
        digest=hashlib.sha256(json.dumps(r['scene'],sort_keys=True).encode()).hexdigest()
        if digest in seen: raise ValueError('duplicate target scene; remove duplicates before splitting')
        seen.add(digest)
        r=dict(r)
        if r.get('image'):
            image=(source.parent/r['image']).resolve()
            if not image.is_file(): raise ValueError('missing input image: '+str(image))
            r['image']=str(image)
        # Finished photos remain in the review queue, never substituted for reference inputs.
        r.pop('finished_photo',None)
        (evaluation if r['group'].strip().lower() in heldout else train).append(r)
    if not train or not evaluation: raise ValueError('both train and held-out sets need examples')
    return train,evaluation

def write(path,rows):
    path.write_text(''.join(json.dumps(r)+'\n' for r in rows))

def main():
    p=argparse.ArgumentParser();p.add_argument('mode',choices=['queue','split']);p.add_argument('input');p.add_argument('--output',required=True);p.add_argument('--holdout',nargs='+',default=[])
    a=p.parse_args();src=Path(a.input).resolve();rows=read(src);dest=Path(a.output)
    if dest.exists(): raise ValueError('choose a new output path; refusing to overwrite reviewed data')
    if a.mode=='queue':
        result=queue(rows);dest.parent.mkdir(parents=True,exist_ok=True);write(dest,result)
        print(f'{len(result)} records queued; none approved automatically')
    else:
        train,evaluation=split(rows,src,{x.strip().lower() for x in a.holdout})
        dest.mkdir(parents=True);write(dest/'train.jsonl',train);write(dest/'eval.jsonl',evaluation)
        print(f'{len(train)} training / {len(evaluation)} held-out records; image paths are local absolute paths')
if __name__=='__main__': main()
