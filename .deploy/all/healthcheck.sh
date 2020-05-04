#!/bin/sh

# Add curl
apk add curl

# Perform basic up health check
if curl -k --request GET "${CI_ENVIRONMENT_URL}/v1/healthcheck" | grep "Success" > /dev/null; then
  echo "Health check passed."
  exit 0
else
  echo "Health check failed."
  exit 1
fi
