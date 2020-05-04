#!/bin/sh

# Setup SSH
apk add openssh
mkdir -p ~/.ssh
echo -e "${SSH_PRIVATE_KEY}" > ~/.ssh/id_ed25519
chmod 600 ~/.ssh/id_ed25519
[[ -f /.dockerenv ]] && echo -e "Host *\n\tStrictHostKeyChecking no\n\n" > ~/.ssh/config
