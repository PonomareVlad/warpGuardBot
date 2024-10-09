npm ci --omit=dev
dnf install -y wireguard-tools
mkdir ./bin/
cp /usr/bin/wg ./bin/
