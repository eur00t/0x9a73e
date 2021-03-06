#!/bin/bash

eval "$(/root/.nodenv/bin/nodenv init -)"
echo "$(node --version)"
cd 0x9a73e
git pull origin staging
rm -rf dist
rm -rf .cache
npm i
GIT_COMMIT=$(git rev-parse HEAD) npm run build-app
npx pm2 restart 0x9a73e-staging