#!/bin/sh

# Add curl
apk add curl

# Perform basic up health check
if curl -s --head --request GET "${APP_URL}"/v1/healthcheck | grep "200 OK" > /dev/null; then
  echo "Health check passed."
  exit 0
else
  echo "Health check failed."
  exit 1
fi
