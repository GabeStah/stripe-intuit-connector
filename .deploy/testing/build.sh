#!/bin/sh

# Update repo to build-flag, pull, install, and build app
ssh -o StrictHostKeyChecking=no ubuntu@"$DEPLOY_ENDPOINT" << EOF
  cd connector
  git remote set-url origin $REPOSITORY_URL
  git pull origin master
  yarn install
  yarn run build
EOF
