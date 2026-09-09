param (
    [Parameter(Mandatory=$true)]
    [string]$AppName,

    [Parameter(Mandatory=$true)]
    [string]$Domain,

    [Parameter(Mandatory=$false)]
    [int]$ContainerPort = 5000,

    [string]$VpsHost = "root@36.50.54.246",
    [string]$Dockerfile = "Dockerfile",
    [string]$EnvFile = "server/.env"
)

$ErrorActionPreference = "Stop"

$AppNameLower = $AppName.ToLower()
$ImageName = "${AppNameLower}:latest"
$TarFile = "${AppNameLower}_source.tar.gz"
$RemoteSourceDir = "/tmp/${AppNameLower}_build"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "BAT DAU DEPLOY LEN VPS ($VpsHost)" -ForegroundColor Cyan
Write-Host "App: $AppName | Domain: $Domain | Port: $ContainerPort" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

# 1. Kiem tra Dockerfile
if (-not (Test-Path $Dockerfile)) {
    Write-Host "[ERROR] Khong tim thay file $Dockerfile trong thu muc hien tai!" -ForegroundColor Red
    exit 1
}

# 2. Dong goi ma nguon bang tar
Write-Host "[1/4] Dang dong goi ma nguon..." -ForegroundColor Yellow
if (Test-Path $TarFile) { 
    Remove-Item $TarFile -Force 
}

tar.exe -czf $TarFile --exclude="node_modules" --exclude="server/node_modules" --exclude="dist" --exclude=".git" --exclude="*.tar.gz" --exclude="*.zip" --exclude=".agents" --exclude=".claude" --exclude=".codex" --exclude="graft" .

if (-not (Test-Path $TarFile)) {
    Write-Host "[ERROR] Loi khi tao file $TarFile!" -ForegroundColor Red
    exit 1
}

$fileSize = (Get-Item $TarFile).Length
$fileSizeMB = [math]::Round($fileSize / 1MB, 2)
Write-Host "   Da dong goi $TarFile ($fileSizeMB MB) thanh cong!" -ForegroundColor Green

# 3. Day file nen len VPS
Write-Host "[2/4] Dang chuyen ma nguon sang VPS..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no -o BatchMode=yes $VpsHost "rm -rf $RemoteSourceDir && mkdir -p $RemoteSourceDir"
scp -o StrictHostKeyChecking=no -o BatchMode=yes $TarFile "$($VpsHost):$RemoteSourceDir/source.tar.gz"
if (Test-Path $TarFile) { 
    Remove-Item $TarFile -Force 
}

# 4. Xu ly file .env neu co
$RemoteEnvFlag = ""
if ($EnvFile -and (Test-Path $EnvFile)) {
    Write-Host "   Dang dong bo file $EnvFile sang VPS..." -ForegroundColor Yellow
    $RemoteEnvPath = "/root/data/apps/$AppName/.env"
    ssh -o StrictHostKeyChecking=no -o BatchMode=yes $VpsHost "mkdir -p /root/data/apps/$AppName"
    scp -o StrictHostKeyChecking=no -o BatchMode=yes $EnvFile "$($VpsHost):$RemoteEnvPath"
    if ($Domain) {
        ssh -o StrictHostKeyChecking=no -o BatchMode=yes $VpsHost "sed -i 's|CLIENT_URL=.*|CLIENT_URL=https://$Domain|g' $RemoteEnvPath"
    }
    $RemoteEnvFlag = "--env-file $RemoteEnvPath"
}

# 5. Build Docker Image tren VPS
Write-Host "[3/4] Dang build Docker Image tren VPS..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no -o BatchMode=yes $VpsHost "cd $RemoteSourceDir && tar -xzf source.tar.gz && rm -f source.tar.gz && docker build --no-cache -t $ImageName -f $Dockerfile . && rm -rf $RemoteSourceDir"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Loi build Docker tren VPS!" -ForegroundColor Red
    exit 1
}

# 6. Chay Container va Cap nhat Caddyfile
Write-Host "[4/4] Khoi dong Container va Cap nhat Caddy..." -ForegroundColor Yellow
$RunCommands = @"
docker stop $AppName 2>/dev/null || true
docker rm $AppName 2>/dev/null || true
docker run -d --name $AppName --restart always --network web-net $RemoteEnvFlag $ImageName

if ! grep -q '$Domain' /root/caddy/Caddyfile; then
  echo "" >> /root/caddy/Caddyfile
  echo "$Domain {" >> /root/caddy/Caddyfile
  echo "    reverse_proxy ${AppName}:${ContainerPort}" >> /root/caddy/Caddyfile
  echo "}" >> /root/caddy/Caddyfile
else
  sed -i '/$Domain/,/}/ s/reverse_proxy .*/reverse_proxy ${AppName}:${ContainerPort}/' /root/caddy/Caddyfile
fi

docker exec -w /etc/caddy caddy caddy reload
"@

ssh -o StrictHostKeyChecking=no -o BatchMode=yes $VpsHost "$RunCommands"

Write-Host "=======================================================" -ForegroundColor Green
Write-Host "DEPLOY THANH CONG RUC RO!" -ForegroundColor Green
Write-Host "Website: https://$Domain" -ForegroundColor Green
Write-Host "Health API: https://$Domain/api/health" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
