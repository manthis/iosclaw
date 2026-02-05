#!/bin/bash
# Setup iOS SSL certificate trust for development
# Run this after expo prebuild

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IOS_DIR="$PROJECT_ROOT/ios/iOSclaw"

echo "🔐 Setting up iOS SSL certificate trust..."

# Copy gateway certificate (get latest from gateway)
CERT_SOURCE="$HOME/.openclaw/gateway/tls/gateway-cert.pem"
if [ -f "$CERT_SOURCE" ]; then
  cp "$CERT_SOURCE" "$IOS_DIR/gateway-cert.pem"
  # Also create DER version
  openssl x509 -in "$CERT_SOURCE" -outform DER -out "$IOS_DIR/gateway-cert.der"
  echo "✅ Copied gateway certificates"
else
  echo "⚠️  Gateway certificate not found at $CERT_SOURCE"
fi

# Copy SecureWebSocket native module
NATIVE_SRC="$PROJECT_ROOT/native-modules/ios"
if [ -d "$NATIVE_SRC" ]; then
  cp "$NATIVE_SRC/SecureWebSocket.swift" "$IOS_DIR/"
  cp "$NATIVE_SRC/SecureWebSocket.m" "$IOS_DIR/"
  echo "✅ Copied SecureWebSocket native module"
fi

echo "🔧 Done! Now run: cd ios && pod install && cd .."
