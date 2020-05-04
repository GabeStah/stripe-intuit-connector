#!/bin/sh

ssh -o StrictHostKeyChecking=no ubuntu@"$DEPLOY_ENDPOINT" << EOF
  yarn run test
EOF
