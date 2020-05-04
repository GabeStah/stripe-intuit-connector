#!/bin/sh

ssh -o StrictHostKeyChecking=no ubuntu@"$DEPLOY_ENDPOINT" << EOF
  cd connector
  yarn run test
EOF
