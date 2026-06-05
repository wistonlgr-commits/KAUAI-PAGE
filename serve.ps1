param([int]$port = 3000)
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://192.168.0.7:$port/")
$listener.Start()

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  KAUAI PAGE - Servidor Local en red" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  En este PC:        http://localhost:$port" -ForegroundColor Green
Write-Host "  En tu telefono:    http://192.168.0.7:$port" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Presiona CTRL+C para detener" -ForegroundColor Gray
Write-Host ""

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".mp4"  = "video/mp4"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".json" = "application/json"
}

while ($listener.IsListening) {
    try {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        $res = $ctx.Response
        # Decode URL so spaces (%20) and special chars work correctly
        $urlPath = [System.Uri]::UnescapeDataString($req.Url.LocalPath)
        if ($urlPath -eq "/") { $urlPath = "/index.html" }
        $filePath = Join-Path $root ($urlPath.TrimStart("/").Replace("/", "\"))
        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $ct = $mimeTypes[$ext]
            if (-not $ct) { $ct = "application/octet-stream" }
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $res.ContentType = $ct
            $res.ContentLength64 = $content.Length
            $res.StatusCode = 200
            # Allow video range requests
            $res.Headers.Add("Accept-Ranges", "bytes")
            $res.OutputStream.Write($content, 0, $content.Length)
        } else {
            $body = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath")
            $res.StatusCode = 404
            $res.ContentType = "text/plain"
            $res.OutputStream.Write($body, 0, $body.Length)
            Write-Host "  404 $urlPath" -ForegroundColor Red
        }
        $res.Close()
    } catch { }
}
