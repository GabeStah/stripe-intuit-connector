#!/bin/sh

# Flush Redis cache
ssh -o StrictHostKeyChecking=no ubuntu@"${DEPLOY_ENDPOINT}" << EOF
  pm2 stop "cd ${TARGET_DIRECTORY} && yarn run start:${CI_ENVIRONMENT_NAME}"
  echo "Flushing Redis"
  redis-cli -h widget-wcasg-${CI_ENVIRONMENT_NAME}-redis.btdm1a.0001.usw2.cache.amazonaws.com && FLUSHALL && exit
  pm2 restart "cd ${TARGET_DIRECTORY} && yarn run start:${CI_ENVIRONMENT_NAME}"
EOF
