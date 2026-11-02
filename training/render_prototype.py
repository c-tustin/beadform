"""Render nominal bead geometry in three orthographic views (requires Pillow)."""
import argparse, json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--input', required=True)
    ap.add_argument('--output', required=True)
    args = ap.parse_args()
    data = json.loads(Path(args.input).read_text())
    im = Image.new('RGB', (1500, 830), '#fffdf8')
    draw = ImageDraw.Draw(im)
    def font(size):
        for name in ('/System/Library/Fonts/Supplemental/Arial.ttf', 'DejaVuSans.ttf'):
            try:
                return ImageFont.truetype(name, size)
            except OSError:
                pass
        return ImageFont.load_default(size=size)
    draw.text((30, 25), data['title'], font=font(28), fill='#23473c')
    draw.text((30, 65), 'Unreviewed deterministic prototype. Nominal bead geometry; no physical sample.', font=font(20), fill='#685b50')
    views = [('Front (+z)', 0, 1, 2), ('Side (+x)', 2, 1, 0), ('Top (+y)', 0, 2, 1)]
    nodes = data['nodes']
    ranges = [max(n['p'][i]+n['diameter']/2 for n in nodes)-min(n['p'][i]-n['diameter']/2 for n in nodes) for i in range(3)]
    scale = min(410/max(ranges), 400/max(ranges))
    for panel, (label, x, y, depth) in enumerate(views):
        left = 25 + panel*495
        draw.rounded_rectangle((left, 120, left+475, 640), radius=16, fill='#f0f2eb', outline='#c9d4c8')
        draw.text((left+18, 138), label, font=font(22), fill='#23473c')
        centers = [(min(n['p'][i] for n in nodes)+max(n['p'][i] for n in nodes))/2 for i in range(3)]
        def pos(n):
            return left+237+(n['p'][x]-centers[x])*scale, 405-(n['p'][y]-centers[y])*scale
        by_id = {n['id']: n for n in nodes}
        for join in data['joins']:
            draw.line((*pos(by_id[join['a']]), *pos(by_id[join['b']])), fill='#8f8580', width=2)
        for n in sorted(nodes, key=lambda n: n['p'][depth]):
            px, py = pos(n)
            radius = n['diameter']/2*scale
            draw.ellipse((px-radius, py-radius, px+radius, py+radius), fill=n['color'], outline='#423a32', width=1)
        draw.text((left+18, 606), f"{len(nodes)} beads · same scale in all views", font=font(17), fill='#685b50')
    draw.text((30, 680), 'Review silhouette, proportions and attachments in all views before approving a target.', font=font(21), fill='#23473c')
    draw.text((30, 718), 'Drawn circles show nominal envelopes, not verified bead-hole axes or tension.', font=font(19), fill='#685b50')
    draw.text((30, 756), 'Zero detected overlaps does not establish a usable thread finish or a recognizable subject.', font=font(19), fill='#685b50')
    im.save(args.output)

if __name__ == '__main__':
    main()
