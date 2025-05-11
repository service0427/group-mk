#\!/bin/bash

# console.log, console.error, console.warn 호출 제거
# 주석이나 문자열 내부가 아닌 실제 명령문만 제거

echo "console 호출 제거 시작..."

# sed를 사용하여 각 타입별로 제거
find ./src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -print0  < /dev/null |  while IFS= read -r -d $'\0' file; do
  # console.log 제거
  sed -i -E 's/console\.log\s*\(.*\);?//g' "$file"
  # console.error 제거
  sed -i -E 's/console\.error\s*\(.*\);?//g' "$file"
  # console.warn 제거
  sed -i -E 's/console\.warn\s*\(.*\);?//g' "$file"
done

echo "console 호출 제거 완료\!"
