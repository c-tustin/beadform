from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,math
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'training/results/2026-10-19-spacing-preview-data.json').read_text())
W,H=1280,1510
im=Image.new('RGB',(W,H),'#fffdf8');d=ImageDraw.Draw(im)
font='/System/Library/Fonts/Supplemental/Arial.ttf'
def f(n):
 try:return ImageFont.truetype(font,n)
 except:return ImageFont.load_default(size=n)
d.text((40,26),'Bead spacing: original compiler vs revised placement',font=f(29),fill='#23473c')
d.text((40,69),'Same source scenes. Same scale per row. Nominal bead envelopes, not physical samples.',font=f(18),fill='#5d7069')
d.text((40,105),'Red outlines mark measured 3D overlaps; projected beads may still cover each other.',font=f(17),fill='#7e4c56')
d.text((260,147),'Original',font=f(24),fill='#23473c');d.text((870,147),'Revised',font=f(24),fill='#23473c')
yaw=math.radians(-12);pitch=math.radians(8)
def project(p):
 x,y,z=p;xx=x*math.cos(yaw)+z*math.sin(yaw);zz=z*math.cos(yaw)-x*math.sin(yaw)
 return xx,-y*math.cos(pitch)+zz*math.sin(pitch),zz
for row,group in enumerate(['frog','cactus','sailboat']):
 pair=[next(x for x in data[k] if x['group']==group) for k in ['before','after']]
 pts=[project(n['p']) for x in pair for n in x['nodes']]
 lo=[min(p[i] for p in pts) for i in (0,1)];hi=[max(p[i] for p in pts) for i in (0,1)]
 scale=min(500/(hi[0]-lo[0]+5),290/(hi[1]-lo[1]+5))
 y0=190+row*405
 for col,x in enumerate(pair):
  x0=32+col*620;d.rounded_rectangle((x0,y0,x0+596,y0+388),radius=15,fill='#f4f5ef',outline='#d4ddd4',width=2)
  d.text((x0+18,y0+15),group.title(),font=f(22),fill='#23473c')
  d.text((x0+18,y0+47),f"{x['beads']} beads · {x['overlap_pairs']} overlap pairs",font=f(17),fill='#5d7069')
  def point(p):
   a,b,z=project(p);return x0+298+(a-(lo[0]+hi[0])/2)*scale,y0+224+(b-(lo[1]+hi[1])/2)*scale,z
  by={n['id']:n for n in x['nodes']}
  for j in x['joins']:
   a=point(by[j['a']]['p']);b=point(by[j['b']]['p']);d.line((a[0],a[1],b[0],b[1]),fill='#9b8b91',width=2)
  for n in sorted(x['nodes'],key=lambda n:project(n['p'])[2]):
   px,py,_=point(n['p']);r=n['diameter']/2*scale
   d.ellipse((px-r,py-r,px+r,py+r),fill=n['color'],outline='#c43b52' if n['overlap'] else '#46614d',width=3 if n['overlap'] else 1)
   d.ellipse((px-r*.33,py-r*.23,px+r*.33,py+r*.23),fill='#567160')
d.text((40,1432),'The revised sailboat uses a supported tube mast and a smaller four-bead sail panel.',font=f(18),fill='#23473c')
d.text((40,1467),'Clearance is only one check. Shape recognition, thread access and tension still need review.',font=f(17),fill='#5d7069')
out=root/'training/results/2026-10-19-spacing-preview.png';im.save(out);print(out)
