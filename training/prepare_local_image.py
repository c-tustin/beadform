"""Match the audited image experiment's EXIF/white-pad preprocessing."""
import sys
from PIL import Image, ImageOps

with Image.open(sys.argv[1]) as source:
    oriented = ImageOps.exif_transpose(source).convert('RGBA')
    image = Image.alpha_composite(Image.new('RGBA', oriented.size, 'white'), oriented).convert('RGB')
    image = ImageOps.pad(image, (224, 224), method=Image.Resampling.LANCZOS, color='white')
    image.info.clear()
    image.save(sys.stdout.buffer, format='PNG')
