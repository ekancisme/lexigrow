#!/usr/bin/env bash
set -e

APP_NAME="lexigrow"
DOMAIN="lexigrow.ltcuong24.io.vn"
CONTAINER_PORT=5000
VPS_HOST="root@36.50.54.246"
DOCKERFILE="Dockerfile"
TAR_FILE="lexigrow_source.tar.gz"
REMOTE_BUILD_DIR="/tmp/lexigrow_build"
REMOTE_ENV_FILE="/root/data/apps/lexigrow/.env"

echo "======================================================="
echo "BAT DAU DEPLOY LEN VPS ($VPS_HOST)"
echo "App: $APP_NAME | Domain: $DOMAIN | Port: $CONTAINER_PORT"
echo "======================================================="

# 1. Kiem tra Dockerfile
if [ ! -f "$DOCKERFILE" ]; then
    echo "[ERROR] Khong tim thay file $DOCKERFILE!"
    exit 1
fi

# 2. Dong goi ma nguon
echo "[1/4] Dang dong goi ma nguon..."
rm -f "$TAR_FILE"
tar -czf "$TAR_FILE" \
    --exclude="node_modules" \
    --exclude="server/node_modules" \
    --exclude="dist" \
    --exclude=".git" \
    --exclude="*.tar.gz" \
    --exclude="*.zip" \
    --exclude=".agents" \
    --exclude=".claude" \
    --exclude=".codex" \
    --exclude="graft" \
    --exclude="*.vpp" \
    --exclude="Person1_*" \
    --exclude=".tmp*" \
    --exclude="outputs" \
    .

FILE_SIZE=$(du -h "$TAR_FILE" | cut -f1)
echo "   Da dong goi $TAR_FILE ($FILE_SIZE) thanh cong!"

# 3. Chuyen ma nguon sang VPS
echo "[2/4] Dang chuyen ma nguon sang VPS..."
ssh -o StrictHostKeyChecking=no -o BatchMode=yes "$VPS_HOST" "rm -rf $REMOTE_BUILD_DIR && mkdir -p $REMOTE_BUILD_DIR"
scp -o StrictHostKeyChecking=no -o BatchMode=yes "$TAR_FILE" "$VPS_HOST:$REMOTE_BUILD_DIR/source.tar.gz"
rm -f "$TAR_FILE"

# 4. Build Docker Image tren VPS
echo "[3/4] Dang build Docker Image tren VPS..."
ssh -o StrictHostKeyChecking=no -o BatchMode=yes "$VPS_HOST" "cd $REMOTE_BUILD_DIR && tar -xzf source.tar.gz && rm -f source.tar.gz && docker build --no-cache -t ${APP_NAME}:latest -f $DOCKERFILE . && rm -rf $REMOTE_BUILD_DIR"

# 5. Khoi dong Container va Reload Caddy
echo "[4/4] Khoi dong Container va Reload Caddy..."
RUN_COMMANDS="
docker stop $APP_NAME 2>/dev/null || true
docker rm $APP_NAME 2>/dev/null || true
docker run -d --name $APP_NAME --restart always --network web-net --env-file $REMOTE_ENV_FILE ${APP_NAME}:latest

if ! grep -q '$DOMAIN' /root/caddy/Caddyfile; then
  echo '' >> /root/caddy/Caddyfile
  echo '$DOMAIN {' >> /root/caddy/Caddyfile
  echo '    reverse_proxy ${APP_NAME}:${CONTAINER_PORT}' >> /root/caddy/Caddyfile
  echo '}' >> /root/caddy/Caddyfile
else
  sed -i '/$DOMAIN/,/}/ s/reverse_proxy .*/reverse_proxy ${APP_NAME}:${CONTAINER_PORT}/' /root/caddy/Caddyfile
fi

docker exec -w /etc/caddy caddy caddy reload
"

ssh -o StrictHostKeyChecking=no -o BatchMode=yes "$VPS_HOST" "$RUN_COMMANDS"

echo "======================================================="
echo "DEPLOY THANH CONG!"
echo "Website: https://$DOMAIN"
echo "Health API: https://$DOMAIN/api/health"
echo "======================================================="
