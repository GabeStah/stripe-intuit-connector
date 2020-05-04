#!/bin/sh

# Restart app
ssh -o StrictHostKeyChecking=no ubuntu@"$DEPLOY_ENDPOINT" << EOF
  pm2 restart "cd connector && yarn run start:${CI_ENVIRONMENT_NAME}"
EOF
