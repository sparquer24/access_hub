#!/bin/sh
set -e

DOMAIN="202-53-72-149.sslip.io"
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"

# nginx needs a cert file to exist to start the HTTPS server block at all.
# If certbot hasn't obtained the real one yet, generate a throwaway
# self-signed cert so nginx can boot; certbot then replaces it in place.
if [ ! -f "$CERT_DIR/fullchain.pem" ]; then
  echo "No certificate found for $DOMAIN yet, generating temporary self-signed cert..."
  mkdir -p "$CERT_DIR"
  openssl req -x509 -nodes -days 1 -newkey rsa:2048 \
    -keyout "$CERT_DIR/privkey.pem" \
    -out "$CERT_DIR/fullchain.pem" \
    -subj "/CN=$DOMAIN"
fi

exec nginx -g "daemon off;"
