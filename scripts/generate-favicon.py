"""Optional asset-authoring step: pip install Pillow, then run this script.

Normal builds copy the checked-in ICO and need no image library. Resize the
existing high-resolution brand icon without changing its artwork or colors.
"""
from pathlib import Path
import struct
from PIL import Image

brand = Path(__file__).resolve().parent.parent / "src" / "brand"
with Image.open(brand / "apple-touch-icon.png") as source:
    source = source.convert("RGBA")
    sizes = (16, 32, 48)
    frames = []
    for size in sizes:
        icon = source.resize((size, size), Image.Resampling.LANCZOS)
        pixels = icon.tobytes("raw", "BGRA", 0, -1)
        # ICO DIB height includes the color bitmap and the 1-bit AND mask.
        stride = ((size + 31) // 32) * 4
        mask = bytearray(stride * size)
        for y in range(size):
            for x in range(size):
                if icon.getpixel((x, size - 1 - y))[3] == 0:
                    mask[y * stride + x // 8] |= 1 << (7 - x % 8)
        header = struct.pack("<IiiHHIIiiII", 40, size, size * 2,
                             1, 32, 0, len(pixels), 0, 0, 0, 0)
        frames.append(header + pixels + mask)
    directory = struct.pack("<HHH", 0, 1, len(sizes))
    offset = 6 + 16 * len(sizes)
    for size, frame in zip(sizes, frames):
        directory += struct.pack("<BBBBHHII", size, size, 0, 0,
                                 1, 32, len(frame), offset)
        offset += len(frame)
    (brand / "favicon.ico").write_bytes(directory + b"".join(frames))
print("Generated src/brand/favicon.ico: 16, 32 and 48 pixels")
