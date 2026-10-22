"""Draw the saved nominal 15-bead ring comparison without external images."""
import argparse, json, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ap=argparse.ArgumentParser()
ap.add_argument('--input',required=True);ap.add_argument('--output',required=True)
a=ap.parse_args();data=json.loads(Path(a.input).read_text())
im=Image.new('RGB',(1380,780),'#fffdf8');draw=ImageDraw.Draw(im)
def font(size):
    for path in ['/System/Library/Fonts/Supplemental/Arial.ttf','DejaVuSans.ttf']:
        try:return ImageFont.truetype(path,size)
        except OSError:pass
    return ImageFont.load_default(size=size)
draw.text((35,20),data['title'],font=font(30),fill='#23473c')
draw.text((35,64),data['note'],font=font(19),fill='#685b50')
for i,case in enumerate(data['cases']):
    left=25+i*685;cx=left+322;cy=390;scale=35
    draw.rounded_rectangle((left,105,left+655,710),radius=18,fill='#f0f2eb',outline='#c9d4c8')
    draw.text((left+22,122),case['label'],font=font(24),fill='#23473c')
    for node in case['nodes']:
        angle=node['angle'];center=[node['p'][0],node['p'][2]]
        tangent=[-math.sin(angle),math.cos(angle)];radial=[math.cos(angle),math.sin(angle)]
        points=[]
        for k in range(81):
            theta=2*math.pi*k/80
            x=center[0]+tangent[0]*.65*math.cos(theta)+radial[0]*math.sin(theta)
            y=center[1]+tangent[1]*.65*math.cos(theta)+radial[1]*math.sin(theta)
            points.append((cx+x*scale,cy-y*scale))
        draw.polygon(points,fill='#8db58d',outline='#37543d',width=2)
        ends=[(cx+(center[0]+sign*tangent[0]*.65)*scale,cy-(center[1]+sign*tangent[1]*.65)*scale) for sign in [-1,1]]
        draw.line(ends,fill='#fffdf8',width=2)
    draw.text((left+22,655),f"15 beads · minimum center spacing {case['minCenterDistanceMm']:.2f} mm",font=font(20),fill='#23473c')
draw.text((35,735),'Counts and pickup/pass sequence are unchanged. Nominal beads: 2 mm diameter × 1.3 mm along the hole.',font=font(20),fill='#685b50')
im.save(a.output)
