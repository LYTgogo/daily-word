Add-Type -AssemblyName System.Drawing
$root = Join-Path $PSScriptRoot '../public/icons'
foreach ($size in @(180,192,512)) {
  $bitmap = [System.Drawing.Bitmap]::new($size,$size)
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.ScaleTransform($size/512.0,$size/512.0)
  $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#2e5945'))
  $cream = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#eef0d2'))
  $green = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#9fbd84'))
  $light = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#dce6b8'))
  $book = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $book.AddBezier(112,316,184,292,210,305,256,331)
  $book.AddBezier(256,331,328,292,350,303,400,316)
  $book.AddLine(400,316,400,376)
  $book.AddBezier(400,376,326,351,305,363,256,391)
  $book.AddBezier(256,391,184,351,153,363,112,376)
  $book.CloseFigure()
  $g.FillPath($cream,$book)
  $pen = [System.Drawing.Pen]::new($light,13)
  $g.DrawBezier($pen,256,315,244,250,260,199,294,151)
  $leaf = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $leaf.AddBezier(259,270,180,269,156,233,160,179)
  $leaf.AddBezier(160,179,228,174,252,209,259,270)
  $g.FillPath($green,$leaf)
  $leaf2 = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $leaf2.AddBezier(270,224,273,148,310,117,364,119)
  $leaf2.AddBezier(364,119,368,180,331,217,270,224)
  $g.FillPath($light,$leaf2)
  $g.FillEllipse($light,365,264,16,16)
  $line = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml('#2e5945'),7)
  $g.DrawLine($line,256,331,256,386)
  $name = if ($size -eq 180) {'apple-touch-icon.png'} else {"icon-$size.png"}
  $bitmap.Save((Join-Path $root $name),[System.Drawing.Imaging.ImageFormat]::Png)
  if ($size -eq 512) {$bitmap.Save((Join-Path $root 'icon-maskable.png'),[System.Drawing.Imaging.ImageFormat]::Png)}
  $line.Dispose();$pen.Dispose();$book.Dispose();$leaf.Dispose();$leaf2.Dispose();$cream.Dispose();$green.Dispose();$light.Dispose();$g.Dispose();$bitmap.Dispose()
}
