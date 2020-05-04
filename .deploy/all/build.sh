#!/bin/sh

# Update repo to build-flag, pull, install, and build app
ssh -o StrictHostKeyChecking=no ubuntu@"${DEPLOY_ENDPOINT}" << EOF
  cd ${TARGET_DIRECTORY}
  echo "Setting remote origin to '${REPOSITORY_URL}'."
  git remote set-url origin ${REPOSITORY_URL}
  echo "Pulling origin '${CI_COMMIT_REF_NAME}'."
  git pull origin ${CI_COMMIT_REF_NAME}
  echo "Checking out '${CI_COMMIT_REF_NAME}'."
  git checkout ${CI_COMMIT_REF_NAME}
  yarn install
  yarn run build
EOF
