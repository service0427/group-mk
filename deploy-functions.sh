#!/bin/bash

# API 함수 디렉토리 생성
echo "Creating Functions directory structure..."
mkdir -p dist/functions/api

# API 함수 파일 복사
echo "Copying API functions..."
cp -v functions/_middleware.js dist/functions/
cp -v functions/[[path]].js dist/functions/
cp -v functions/api/*.js dist/functions/api/

echo "Functions copied successfully!"