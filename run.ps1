param([int]$Port = 8080)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$localJdk = Get-ChildItem -Path '../.tools/java21' -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
if ($localJdk) {
    $javaExe = Join-Path $localJdk.FullName 'bin/java.exe'
} else {
    $javaExe = (Get-Command java -ErrorAction Stop).Source
}
if (!(Test-Path 'target/proposal-workflow-1.0.0.jar')) {
    throw 'JAR belum tersedia. Jalankan mvn verify terlebih dahulu sesuai README.'
}
Write-Host "Membuka server demo di http://127.0.0.1:$Port/ (Ctrl+C untuk berhenti)"
$socketDirectory = Join-Path $PSScriptRoot 'data/socket-tmp'
New-Item -ItemType Directory -Force $socketDirectory | Out-Null
& $javaExe "-Djdk.net.unixdomain.tmpdir=$socketDirectory" -jar 'target/proposal-workflow-1.0.0.jar' "--server.port=$Port"
