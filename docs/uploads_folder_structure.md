# Uploads 버킷 폴더 구조

## 전체 구조
```
uploads/
├── users/                          # 사용자 관련 파일
│   ├── {user_id}/
│   │   ├── profile/                # 프로필 이미지
│   │   ├── documents/              # 개인 문서
│   │   └── temp/                   # 임시 파일
│
├── campaigns/                      # 캠페인 관련 파일
│   ├── {campaign_id}/
│   │   ├── logos/                  # 캠페인 로고
│   │   ├── banners/                # 배너 이미지
│   │   └── documents/              # 캠페인 문서
│
├── negotiations/                   # 협상 관련 파일
│   ├── general/                    # 일반 슬롯 협상
│   │   └── {slot_id}/
│   └── guarantee/                  # 보장형 슬롯 협상
│       └── {request_id}/
│
├── notices/                        # 공지사항 첨부파일
│   └── {notice_id}/
│
├── support/                        # 고객지원 첨부파일
│   └── {ticket_id}/
│
└── system/                         # 시스템 파일
    ├── templates/                  # 템플릿
    └── exports/                    # 내보내기 파일
```

## 현재 구현 경로
- 보장형 협상 파일: `uploads/negotiations/guarantee/{request_id}/{timestamp}.{ext}`

## 향후 확장 가능한 경로들
- 일반 슬롯 협상: `uploads/negotiations/general/{slot_id}/{timestamp}.{ext}`
- 사용자 프로필: `uploads/users/{user_id}/profile/{timestamp}.{ext}`
- 캠페인 이미지: `uploads/campaigns/{campaign_id}/logos/{timestamp}.{ext}`
- 공지사항 첨부: `uploads/notices/{notice_id}/{timestamp}.{ext}`