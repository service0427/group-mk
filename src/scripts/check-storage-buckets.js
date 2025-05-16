// Storage 버킷 확인 및 생성 스크립트
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 생성
const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL 또는 서비스 키가 설정되지 않았습니다.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 필요한 버킷 목록
const requiredBuckets = [
  {
    name: 'notice-images',
    public: true,
    fileSizeLimit: 30 * 1024 * 1024, // 30MB
    allowedMimeTypes: ['image/*']
  },
  {
    name: 'notice-files',
    public: true,
    fileSizeLimit: 30 * 1024 * 1024, // 30MB
    allowedMimeTypes: null // 모든 파일 타입 허용
  }
];

async function main() {
  console.log('Storage 버킷 확인 및 생성을 시작합니다...');

  try {
    // 기존 버킷 목록 조회
    const { data: existingBuckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      throw new Error(`버킷 목록 조회 오류: ${listError.message}`);
    }

    // 기존 버킷 이름 목록
    const existingBucketNames = existingBuckets.map(bucket => bucket.name);
    console.log('현재 존재하는 버킷:', existingBucketNames.join(', ') || '없음');

    // 필요한 버킷 생성
    for (const bucket of requiredBuckets) {
      if (!existingBucketNames.includes(bucket.name)) {
        console.log(`${bucket.name} 버킷을 생성합니다...`);
        
        const { data, error } = await supabaseAdmin.storage.createBucket(bucket.name, {
          public: bucket.public,
          fileSizeLimit: bucket.fileSizeLimit,
          allowedMimeTypes: bucket.allowedMimeTypes
        });
        
        if (error) {
          console.error(`${bucket.name} 버킷 생성 오류:`, error.message);
        } else {
          console.log(`${bucket.name} 버킷이 성공적으로 생성되었습니다.`);
        }
      } else {
        console.log(`${bucket.name} 버킷이 이미 존재합니다.`);
        
        // 기존 버킷 설정 업데이트
        const { error } = await supabaseAdmin.storage.updateBucket(bucket.name, {
          public: bucket.public,
          fileSizeLimit: bucket.fileSizeLimit,
          allowedMimeTypes: bucket.allowedMimeTypes
        });
        
        if (error) {
          console.error(`${bucket.name} 버킷 설정 업데이트 오류:`, error.message);
        } else {
          console.log(`${bucket.name} 버킷 설정이 업데이트되었습니다.`);
        }
      }
    }
    
    console.log('Storage 버킷 확인 및 생성이 완료되었습니다.');
  } catch (error) {
    console.error('실행 중 오류가 발생했습니다:', error);
    process.exit(1);
  }
}

main();