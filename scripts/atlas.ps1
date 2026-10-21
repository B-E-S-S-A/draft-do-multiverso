# Monta um atlas de capas pequenas (96x144) a partir de uma lista de imagens.
# Capas largas de séries (logos) viram uma "tela de TV" com scanlines quando -Tv é usado.
param(
  [Parameter(Mandatory)] [string] $Manifest,
  [Parameter(Mandatory)] [string] $Out,
  [int] $Cols = 16,
  [int] $W = 96,
  [int] $H = 144,
  [switch] $Tv,
  [int] $Levels = 6
)

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class CoverAtlas {
  static readonly int[,] Bayer = { { 0, 8, 2, 10 }, { 12, 4, 14, 6 }, { 3, 11, 1, 9 }, { 15, 7, 13, 5 } };

  // Paleta reduzida com pontilhado ordenado (Bayer 4x4): o visual de cartucho de 16 bits.
  public static void Dither(Bitmap bmp, int levels) {
    var d = bmp.LockBits(new Rectangle(0, 0, bmp.Width, bmp.Height), ImageLockMode.ReadWrite, PixelFormat.Format24bppRgb);
    var buf = new byte[d.Stride * d.Height];
    Marshal.Copy(d.Scan0, buf, 0, buf.Length);
    double step = 255.0 / (levels - 1);
    for (int y = 0; y < d.Height; y++)
      for (int x = 0; x < d.Width; x++) {
        double t = ((Bayer[y & 3, x & 3] + 0.5) / 16.0 - 0.5) * step;
        for (int c = 0; c < 3; c++) {
          int i = y * d.Stride + x * 3 + c;
          int q = (int)Math.Round((buf[i] + t) / step);
          buf[i] = (byte)Math.Round(Math.Max(0, Math.Min(levels - 1, q)) * step);
        }
      }
    Marshal.Copy(buf, 0, d.Scan0, buf.Length);
    bmp.UnlockBits(d);
  }

  static Color BorderAverage(Bitmap b) {
    long r = 0, g = 0, bl = 0, n = 0;
    for (int x = 0; x < b.Width; x += 2) {
      foreach (int y in new[] { 0, b.Height - 1 }) {
        var c = b.GetPixel(x, y);
        if (c.A < 128) continue;
        r += c.R; g += c.G; bl += c.B; n++;
      }
    }
    if (n < 4) return Color.FromArgb(27, 26, 46);
    return Color.FromArgb((int)(r / n), (int)(g / n), (int)(bl / n));
  }

  // Recorta a margem lisa em volta do logo para ele ocupar a tela da TV.
  static Rectangle Content(Bitmap b, Color bg) {
    int x0 = b.Width, y0 = b.Height, x1 = -1, y1 = -1;
    for (int y = 0; y < b.Height; y++)
      for (int x = 0; x < b.Width; x++) {
        var c = b.GetPixel(x, y);
        if (c.A < 40) continue;
        int diff = Math.Abs(c.R - bg.R) + Math.Abs(c.G - bg.G) + Math.Abs(c.B - bg.B);
        if (diff < 60) continue;
        if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y;
      }
    if (x1 < 0) return new Rectangle(0, 0, b.Width, b.Height);
    int pad = Math.Max(2, (x1 - x0) / 20);
    x0 = Math.Max(0, x0 - pad); y0 = Math.Max(0, y0 - pad);
    x1 = Math.Min(b.Width - 1, x1 + pad); y1 = Math.Min(b.Height - 1, y1 + pad);
    return new Rectangle(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
  }

  static void Scanlines(Bitmap cell) {
    for (int y = 1; y < cell.Height; y += 2)
      for (int x = 0; x < cell.Width; x++) {
        var c = cell.GetPixel(x, y);
        cell.SetPixel(x, y, Color.FromArgb((int)(c.R * 0.8), (int)(c.G * 0.8), (int)(c.B * 0.8)));
      }
  }

  public static string Cell(Graphics atlas, string path, Rectangle dest, bool tvIfWide) {
    using (var src = new Bitmap(path))
    using (var cell = new Bitmap(dest.Width, dest.Height, PixelFormat.Format24bppRgb))
    using (var g = Graphics.FromImage(cell))
    using (var ia = new ImageAttributes()) {
      g.InterpolationMode = InterpolationMode.HighQualityBicubic;
      g.PixelOffsetMode = PixelOffsetMode.HighQuality;
      ia.SetWrapMode(WrapMode.TileFlipXY);
      double ar = (double)src.Width / src.Height;
      double target = (double)dest.Width / dest.Height;
      string kind = "cover";
      if (tvIfWide && ar > 1.05) {
        kind = "tv";
        var bg = BorderAverage(src);
        g.Clear(bg);
        var box = Content(src, bg);
        double scale = Math.Min((dest.Width - 8.0) / box.Width, (dest.Height * 0.62) / box.Height);
        int w = (int)(box.Width * scale), h = (int)(box.Height * scale);
        g.DrawImage(src, new Rectangle((dest.Width - w) / 2, (dest.Height - h) / 2, w, h), box.X, box.Y, box.Width, box.Height, GraphicsUnit.Pixel, ia);
        Scanlines(cell);
      } else {
        int sw, sh, sx, sy;
        if (ar > target) { sh = src.Height; sw = (int)Math.Round(sh * target); sx = (src.Width - sw) / 2; sy = 0; }
        else { sw = src.Width; sh = (int)Math.Round(sw / target); sx = 0; sy = (int)((src.Height - sh) * 0.2); }
        g.Clear(Color.White);
        g.DrawImage(src, new Rectangle(0, 0, dest.Width, dest.Height), sx, sy, sw, sh, GraphicsUnit.Pixel, ia);
      }
      atlas.DrawImageUnscaled(cell, dest.X, dest.Y);
      return kind;
    }
  }
}
'@

Add-Type -AssemblyName PresentationCore
# System.Drawing não lê WebP; o decodificador do Windows (WIC) lê.
function Readable([string] $p) {
  $head = [byte[]](Get-Content -LiteralPath $p -Encoding Byte -TotalCount 12)
  if ([Text.Encoding]::ASCII.GetString($head, 8, 4) -ne 'WEBP') { return $p }
  $out = [IO.Path]::ChangeExtension($p, '.conv.png')
  if (-not (Test-Path -LiteralPath $out)) {
    $fs = [IO.File]::OpenRead($p)
    try {
      $dec = [System.Windows.Media.Imaging.BitmapDecoder]::Create($fs, 'None', 'OnLoad')
      $enc = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
      $enc.Frames.Add($dec.Frames[0])
      $o = [IO.File]::Create($out); $enc.Save($o); $o.Close()
    } finally { $fs.Close() }
  }
  return $out
}

$lines = Get-Content -LiteralPath $Manifest | Where-Object { $_.Trim() -ne '' }
$rows = [math]::Ceiling($lines.Count / $Cols)
$atlas = New-Object System.Drawing.Bitmap ($Cols * $W), ($rows * $H), ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($atlas)
$g.Clear([System.Drawing.Color]::White)
$kinds = @()
for ($i = 0; $i -lt $lines.Count; $i++) {
  $rect = New-Object System.Drawing.Rectangle (($i % $Cols) * $W), ([math]::Floor($i / $Cols) * $H), $W, $H
  try { $kinds += [CoverAtlas]::Cell($g, (Readable $lines[$i]), $rect, $Tv.IsPresent) }
  catch { $kinds += 'fail'; [Console]::Error.WriteLine("falhou: " + $lines[$i]) }
}
$g.Dispose()
if ($Levels -gt 1) { [CoverAtlas]::Dither($atlas, $Levels) }
$atlas.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$atlas.Dispose()
# Uma linha por célula: cover ou tv
$kinds -join "`n"
