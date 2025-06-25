// Storage 설정 관리
// 환경별로 다른 버킷을 사용할 수 있도록 구성

export const STORAGE_CONFIG = {
  // 메인 업로드 버킷
  UPLOADS_BUCKET: 'uploads',

  // 폴더 경로 상수
  FOLDERS: {
    NEGOTIATIONS: {
      GUARANTEE: 'negotiations/guarantee',
      GENERAL: 'negotiations/general',
    },
    INQUIRIES: {
      ATTACHMENTS: 'inquiries/attachments',
    },
    USERS: {
      PROFILE: 'users',
      DOCUMENTS: 'users',
    },
    CAMPAIGNS: {
      LOGOS: 'campaigns',
      BANNERS: 'campaigns',
    },
    NOTICES: 'notices',
    SUPPORT: 'support',
    SYSTEM: 'system',
  },

  // 파일 제한 설정
  LIMITS: {
    MAX_FILE_SIZE_MB: 10,
    MAX_FILES_PER_UPLOAD: 5,
    ALLOWED_TYPES: [
      'image/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ],
  },
};

// 경로 생성 헬퍼 함수들
export const getUploadPath = {
  guaranteeNegotiation: (requestId: string) =>
    `${STORAGE_CONFIG.FOLDERS.NEGOTIATIONS.GUARANTEE}/${requestId}`,

  generalNegotiation: (slotId: string) =>
    `${STORAGE_CONFIG.FOLDERS.NEGOTIATIONS.GENERAL}/${slotId}`,

  inquiryAttachments: (inquiryId?: string) =>
    inquiryId ? `${STORAGE_CONFIG.FOLDERS.INQUIRIES.ATTACHMENTS}/${inquiryId}` : STORAGE_CONFIG.FOLDERS.INQUIRIES.ATTACHMENTS,

  userProfile: (userId: string) =>
    `${STORAGE_CONFIG.FOLDERS.USERS.PROFILE}/${userId}/profile`,

  campaignLogo: (campaignId: string) =>
    `${STORAGE_CONFIG.FOLDERS.CAMPAIGNS.LOGOS}/${campaignId}/logos`,

  notice: (noticeId: string) =>
    `${STORAGE_CONFIG.FOLDERS.NOTICES}/${noticeId}`,
};