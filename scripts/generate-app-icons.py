"""Generate app icon assets from the source brand artwork."""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "icon.png.jpeg"
OUT_FOREGROUND = ROOT / "assets" / "images" / "adaptive-icon-foreground.png"
OUT_BACKGROUND = ROOT / "assets" / "images" / "adaptive-icon-background.png"
OUT_ICON = ROOT / "assets" / "images" / "icon.png"
CANVAS = 1024
# App theme (login / home gradients)
THEME_TOP = (26, 10, 46)       # #1a0a2e
THEME_BOTTOM = (45, 27, 78)    # #2d1b4e
THEME_SOLID = (26, 10, 46, 255)


def make_theme_background(canvas_size: int) -> Image.Image:
    """Diagonal purple gradient matching the app login/home screens."""
    canvas = Image.new("RGBA", (canvas_size, canvas_size), THEME_SOLID)
    draw = ImageDraw.Draw(canvas)
    for y in range(canvas_size):
        t = y / max(canvas_size - 1, 1)
        r = int(THEME_TOP[0] + (THEME_BOTTOM[0] - THEME_TOP[0]) * t)
        g = int(THEME_TOP[1] + (THEME_BOTTOM[1] - THEME_TOP[1]) * t)
        b = int(THEME_TOP[2] + (THEME_BOTTOM[2] - THEME_TOP[2]) * t)
        draw.line([(0, y), (canvas_size, y)], fill=(r, g, b, 255))
    return canvas


def main() -> None:
    src = Image.open(SRC).convert("RGBA")
    icon = src.resize((CANVAS, CANVAS), Image.Resampling.LANCZOS)
    theme_bg = make_theme_background(CANVAS)

    icon.save(OUT_FOREGROUND, optimize=True)
    theme_bg.save(OUT_BACKGROUND, optimize=True)
    icon.save(OUT_ICON, optimize=True)

    print(f"Wrote {OUT_FOREGROUND}")
    print(f"Wrote {OUT_BACKGROUND}")
    print(f"Wrote {OUT_ICON}")


if __name__ == "__main__":
    main()
