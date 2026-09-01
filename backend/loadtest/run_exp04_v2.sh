#!/bin/sh

printf '%s\n' 'EXP-04 v2는 2026-08-09 중단된 역사 자료이며 원본 runner가 보존되지 않았습니다.' >&2
printf '%s\n' '기존 결과를 덮어쓰지 말고 새 EXP 번호로 재설계하세요. 자세한 내용: loadtest/README_EXP04V2.md' >&2
exit 2
