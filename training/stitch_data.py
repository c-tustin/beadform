"""Bounded stitch selection + recipe generation; synthetic draft targets only."""
import hashlib,json
from pathlib import Path
HERE=Path(__file__).resolve().parent
MODEL='Qwen/Qwen3-VL-2B-Instruct'
REVISION='89644892e4d85e24eaac8bacfd4f463576704203'
SYSTEM='''Select a stitch and specify ONE flat Beadform draft swatch. Return exactly one JSON object with stitch, shape, width, rows. No prose, counts or invented thread movements. The deterministic compiler makes the actual pattern.
Supported choices: peyote for dense flat staggered fabric (rectangle, even starter width); brick for a flat changing triangular outline worked through thread bridges (triangle), or a brick rectangle when explicitly requested; ladder for one narrow foundation strip of adjacent loops (strip, rows 1); raw for an open grid of connected four-bead right-angle units (rectangle); square for an aligned flat bead grid (rectangle).
Dimensions must be specified. Width is the number of starter beads spanning the first TWO interleaved peyote rows; peyote rows counts all rows including those first two. For RAW width and rows are unit counts. For brick width is foundation bead count and rows includes foundation; a triangle decreases by one bead per row and must stop at two or more beads. Square width and rows are bead-grid counts. Ladder width is strip beads and rows must be one. Width is 2..12 and rows 1..12; all non-ladder recipes require at least two rows.
Shape is rectangle, triangle or strip. If dimensions are missing, contradictory or unsupported, return {"stitch":"unknown","shape":"unknown","width":0,"rows":0}. This pilot cannot make spheres, tubes, multi-part subjects, mixed stitches, CRAW, herringbone or netting; return unknown for them rather than silently substituting. Do not infer dimensions. A named stitch alone does not make an impossible request valid.
Use 11/0 round seed beads and 0.20 mm thread, preferring no more than five bead passages. Geometry, bridge operations, route counts and warnings are computed separately. Finishing and physical beadability are unverified.'''
SCHEMA={'type':'object','properties':{'stitch':{'type':'string','enum':['peyote','brick','ladder','raw','square','unknown']},'shape':{'type':'string','enum':['rectangle','triangle','strip','unknown']},'width':{'type':'integer','minimum':0,'maximum':12},'rows':{'type':'integer','minimum':0,'maximum':12}},'required':['stitch','shape','width','rows'],'additionalProperties':False}
def load():
    rows=[json.loads(l) for l in (HERE/'stitch-program-v1/examples.jsonl').read_text().splitlines() if l]
    if any(r['physical_success'] is not None or r['label_source']!='authored-synthetic' or r['user_reviewed'] is not False for r in rows):raise ValueError('Invalid target provenance.')
    return tuple([r for r in rows if r['split']==split] for split in ['train','dev','challenge'])
def fingerprints():
    paths=[Path(__file__),HERE/'train_stitch_program.py',HERE/'requirements-catalog-v2.txt',HERE/'stitch-program-v1/examples.jsonl',HERE/'stitch-program-v1/provenance.json',HERE.parent/'stitch-programs.mjs',HERE.parent/'engine.js']
    return {str(p.relative_to(HERE.parent)):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
def strict_recipe(raw):
    def pairs(items):
        d={}
        for k,v in items:
            if k in d:raise ValueError('Duplicate key.')
            d[k]=v
        return d
    try:
        d=json.loads(raw,object_pairs_hook=pairs)
        if not isinstance(d,dict) or set(d)!={'stitch','shape','width','rows'}:return None
        if type(d['width']) is not int or type(d['rows']) is not int:return None
        if d['stitch'] not in SCHEMA['properties']['stitch']['enum'] or d['shape'] not in SCHEMA['properties']['shape']['enum']:return None
        if not all(0<=d[k]<=12 for k in ['width','rows']):return None
        return d
    except (ValueError,TypeError):return None
