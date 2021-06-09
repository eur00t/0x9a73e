#!/bin/bash

git push origin staging
ssh root@xxlv.party
cd 0x9a73e
git pull origin staging
rm -rf dist
rm -rf .cache
GIT_COMMIT=$(git rev-parse HEAD) npm run build-app
npx pm2 restart 0x9a73e-staging
logout