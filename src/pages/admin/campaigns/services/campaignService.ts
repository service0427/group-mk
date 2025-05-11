import { supabase, supabaseAdmin } from '@/supabase';
import { ICampaign } from '../components/CampaignContent';
import { USER_ROLES } from '@/config/roles.config';

// Base64 이미지를 Supabase Storage에 업로드하는 함수
export const uploadImageToStorage = async (base64Data: string, bucket: string, folder: string, fileName: string, userId?: string): Promise<string | null> => {
  try {
    console.log(`이미지 업로드 시작: ${bucket}/${folder}/${fileName}`);
    
    // Base64 데이터에서 실제 데이터 부분만 추출 (data:image/jpeg;base64, 부분 제거)
    const base64WithoutPrefix = base64Data.split(',')[1];
    
    // 파일 확장자 추출
    const fileType = base64Data.split(';')[0].split('/')[1];
    const fullFileName = `${fileName}.${fileType}`;
    
    // 현재 사용자 ID 가져오기
    const { data } = await supabase.auth.getSession();
    const uid = userId || data.session?.user?.id || 'anonymous';
    
    // 정책에 맞게 user ID를 경로에 포함
    const filePath = `${uid}/${folder}/${fullFileName}`;
    
    console.log(`Storage 경로: ${filePath} (사용자: ${uid})`);
    
    console.log(`파일 경로: ${filePath}, 타입: ${fileType}`);
    
    // Base64 데이터를 Blob 객체로 변환
    const byteCharacters = atob(base64WithoutPrefix);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: `image/${fileType}` });
    
    console.log(`Blob 생성 완료: ${blob.size} 바이트`);
    
    // 먼저 버킷 존재 여부 확인
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('버킷 목록 가져오기 실패:', bucketsError);
    } else {
      const bucketExists = buckets?.some(b => b.name === bucket) || false;
      console.log(`${bucket} 버킷 ${bucketExists ? '존재함' : '존재하지 않음'}`);
      
      if (!bucketExists) {
        console.warn(`${bucket} 버킷이 존재하지 않습니다. 업로드 시 문제가 발생할 수 있습니다.`);
      }
    }
    
    // Supabase Storage에 파일 업로드 시도
    let uploadResult;
    try {
      console.log('Supabase Storage에 파일 업로드 시도 중...');
      
      uploadResult = await supabase
        .storage
        .from(bucket)
        .upload(filePath, blob, {
          contentType: `image/${fileType}`,
          cacheControl: '3600',
          upsert: true
        });
        
      console.log('업로드 응답:', uploadResult);
    } catch (uploadError) {
      console.error('Supabase Storage 업로드 실패 (예외):', uploadError);
      uploadResult = { error: uploadError, data: null };
    }
    
    // 업로드 결과 확인
    if (uploadResult.error) {
      console.error('파일 업로드 중 오류:', uploadResult.error);
      return null;
    }
    
    // 업로드 성공 시 URL 생성
    try {
      // 먼저 영구적인 public URL 시도
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      if (publicUrlData && publicUrlData.publicUrl) {
        console.log('Supabase Storage 영구 Public URL 생성 성공:', publicUrlData.publicUrl);
        return publicUrlData.publicUrl;
      } else {
        // 대체 방법: 만료 기간이 긴 서명된 URL 시도
        console.log('Public URL을 가져올 수 없어 Signed URL을 시도합니다...');
        const expirySeconds = 365 * 24 * 60 * 60; // 1년
        
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, expirySeconds);
        
        if (signedUrlError) {
          console.error('Signed URL 생성 실패:', signedUrlError);
          throw signedUrlError;
        }
        
        if (signedUrlData && signedUrlData.signedUrl) {
          console.log('Supabase Storage Signed URL 생성 성공 (1년 유효):', signedUrlData.signedUrl);
          return signedUrlData.signedUrl;
        } else {
          throw new Error('URL을 생성할 수 없습니다.');
        }
      }
    } catch (urlError) {
      console.error('URL 생성 오류:', urlError);
      
      // 마지막 대안: 직접 URL 형식 구성 시도
      try {
        const directPublicUrl = `/storage/v1/object/public/${bucket}/${filePath}`;
        console.log('직접 URL 구성 시도:', directPublicUrl);
        return directPublicUrl;
      } catch (directUrlError) {
        console.error('직접 URL 구성 실패:', directUrlError);
        return null;
      }
    }
  } catch (error) {
    console.error('이미지 업로드 처리 중 오류:', error);
    return null;
  }
};

// Supabase에서 캠페인 데이터 가져오기
export const fetchCampaigns = async (serviceType: string, userId?: string): Promise<ICampaign[]> => {
  // 기본 쿼리 생성
  let query = supabase
    .from('campaigns')
    .select('*')
    .eq('service_type', serviceType);

  // 사용자 ID가 있으면 본인 캠페인만 필터링
  if (userId) {
    query = query.eq('mat_id', userId);
    console.log(`${userId} 사용자의 캠페인만 필터링합니다.`);
  }

  // 정렬 적용
  const { data, error } = await query.order('id', { ascending: true });

  if (error) {
    console.error('캠페인 데이터 조회 중 오류:', error);
    return [];
  }

  // DB 데이터를 프론트엔드에서 사용하는 형태로 변환
  return data.map(item => {
    // add_info가 문자열로 저장되어 있으면 JSON으로 파싱
    let parsedItem = { ...item };
    
    // add_info 필드 처리
    if (typeof parsedItem.add_info === 'string' && parsedItem.add_info) {
      try {
        parsedItem.add_info = JSON.parse(parsedItem.add_info);
        console.log('add_info 파싱 성공:', parsedItem.add_info);
      } catch (error) {
        console.error('add_info JSON 파싱 오류:', error);
        // 파싱에 실패했지만 logo_url이 문자열 안에 있는 경우
        const logoUrlMatch = parsedItem.add_info.match(/"logo_url":\s*"([^"]+)"/);
        if (logoUrlMatch && logoUrlMatch[1]) {
          parsedItem.add_info_logo_url = logoUrlMatch[1];
          console.log('add_info에서 logo_url 추출:', parsedItem.add_info_logo_url);
        }
      }
    }
    
    return {
      id: parsedItem.id.toString(),
      campaignName: parsedItem.campaign_name,
      description: parsedItem.description || '',
      logo: parsedItem.logo,
      efficiency: parsedItem.efficiency ? `${parsedItem.efficiency}%` : '-',
      minQuantity: parsedItem.min_quantity ? `${parsedItem.min_quantity}개` : '-',
      deadline: parsedItem.deadline || '22:00', // 이미 HH:MM 형식으로 저장됨
      status: {
        label: getStatusLabel(parsedItem.status),
        color: getStatusColor(parsedItem.status)
      },
      additionalLogic: parsedItem.additional_logic ? parsedItem.additional_logic.toString() : '',
      detailedDescription: parsedItem.detailed_description || '',
      // 원본 데이터도 포함 (파싱된 add_info 포함)
      originalData: parsedItem
    };
  });
};

// 사용자 ID로 역할 확인
export const hasRole = async (userId?: string): Promise<string | null> => {
  if (!userId) return null;

  try {
    // 사용자 역할 가져오기
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('사용자 역할 조회 중 오류:', error);
      return null;
    }

    return data.role;
  } catch (err) {
    console.error('사용자 역할 조회 중 예외 발생:', err);
    return null;
  }
};

// 상태값에 따른 라벨 반환
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'active': return '진행중';
    case 'pending': return '준비중';
    case 'pause': return '표시안함';
    case 'waiting_approval': return '승인 대기중';
    case 'rejected': return '반려됨';
    default: return '준비중';
  }
};

// 상태값에 따른 색상 반환
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active': return 'success';
    case 'pause': return 'warning';
    case 'pending': return 'info';
    case 'completed': return 'primary';
    case 'rejected': return 'danger';
    default: return 'info';
  }
};

// 캠페인 상태 업데이트
export const updateCampaignStatus = async (campaignId: number, newStatus: string): Promise<boolean> => {
  const { error } = await supabase
    .from('campaigns')
    .update({ status: newStatus })
    .eq('id', campaignId);

  if (error) {
    console.error('캠페인 상태 업데이트 중 오류:', error);
    return false;
  }

  return true;
};

// 캠페인 데이터 업데이트
export const updateCampaign = async (campaignId: number, data: any): Promise<boolean> => {
  try {
    // Supabase Storage에 이미지 업로드
    let logoUrl = null;
    let bannerUrl = null;
    let additionalInfo: any = {};

    // 현재 사용자 ID 가져오기
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user?.id;

    // 기존 캠페인 정보 가져오기 (add_info 필드, mat_id, rejected_reason 확인을 위해)
    const { data: existingCampaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('add_info, mat_id, rejected_reason')
      .eq('id', campaignId)
      .single();

    if (fetchError) {
      console.error('기존 캠페인 정보 가져오기 실패:', fetchError);
    } else if (existingCampaign?.add_info) {
      // 기존 add_info 필드가 문자열로 저장되어 있으면 파싱
      if (typeof existingCampaign.add_info === 'string') {
        try {
          additionalInfo = JSON.parse(existingCampaign.add_info);
        } catch (e) {
          console.error('add_info JSON 파싱 오류:', e);
          additionalInfo = {};
        }
      } else {
        additionalInfo = existingCampaign.add_info;
      }
    }

    // 1. 업로드된 로고 이미지가 있으면 저장
    if (data.uploadedLogo) {
      logoUrl = await uploadImageToStorage(
        data.uploadedLogo,
        'campaigns-image',  // 버킷 이름
        'logos',            // 폴더 이름
        `logo-${campaignId}-${Date.now()}`, // 캠페인 ID와 타임스탬프로 고유한 파일명 생성
        userId              // 사용자 ID 전달
      );

      if (logoUrl) {
        additionalInfo.logo_url = logoUrl;
      }
    }

    // 2. 업로드된 배너 이미지가 있으면 저장
    if (data.uploadedBannerImage) {
      bannerUrl = await uploadImageToStorage(
        data.uploadedBannerImage,
        'campaigns-image',     // 버킷 이름
        'banners',             // 폴더 이름
        `banner-${campaignId}-${Date.now()}`, // 캠페인 ID와 타임스탬프로 고유한 파일명 생성
        userId                 // 사용자 ID 전달
      );

      if (bannerUrl) {
        additionalInfo.banner_url = bannerUrl;
      }
    }

    // 3. 반려 사유는 더 이상 add_info에 저장하지 않음
    // (rejected_reason 필드에 직접 저장)

    // 업데이트 데이터 타입 정의
    interface IUpdateData {
      campaign_name: string;
      description: string;
      detailed_description?: string;
      unit_price: number;
      deadline: string;
      updated_at: Date;
      add_info: any;
      logo?: string;
      status?: string;
      rejected_reason?: string;
    }

    // DB 컬럼명에 맞게 데이터 변환
    let updateData: IUpdateData = {
      campaign_name: data.campaignName,
      description: data.description,
      detailed_description: data.detailedDescription,
      unit_price: data.unitPrice ? parseFloat(data.unitPrice) : 100,
      deadline: formatTimeHHMM(data.deadline), // 시:분 형식만 저장
      updated_at: new Date(),
      add_info: additionalInfo, // 추가 정보 업데이트
      // 로고 이미지 경로 변경 (업로드된 로고가 있을 경우만)
      ...(data.uploadedLogo ? { logo: data.logo } : {})
    };

    // 상태 변경이 있으면 업데이트 (먼저 처리)
    if (data.status) {
      updateData = {
        ...updateData,
        status: data.status
      };
      console.log(`캠페인 상태를 '${data.status}'로 업데이트합니다.`);
    }

    // 반려 사유가 있으면 rejected_reason 필드에 저장 (상태 설정 후 처리)
    if (data.status === 'rejected' && data.rejectionReason) {
      updateData = {
        ...updateData,
        rejected_reason: data.rejectionReason
      };
      console.log('rejected_reason 필드에 반려 사유 저장:', data.rejectionReason);
    } else if (data.status === 'rejected') {
      // 반려 상태인데 사유가 없는 경우 경고
      console.warn('반려 상태이지만 사유가 제공되지 않았습니다. 데이터:', data);
    }

    // 디버깅: 업데이트에 사용되는 최종 데이터 로깅
    console.log('캠페인 업데이트 최종 데이터:', JSON.stringify(updateData, null, 2));

    // mat_id가 없을 경우에만 추가 (기존 mat_id 유지가 중요)
    if (userId && !existingCampaign?.mat_id) {
      // 타입 안전하게 mat_id 추가 (존재 여부 확인 후)
      const updatedData = {
        ...updateData,
        mat_id: userId
      };
      updateData = updatedData;
    }

    const { error } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', campaignId);

    if (error) {
      console.error('캠페인 데이터 업데이트 중 오류:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('캠페인 업데이트 중 예외 발생:', err);
    return false;
  }
};

// 시간을 HH:MM 형식으로 변환하는 헬퍼 함수
export const formatTimeHHMM = (timeStr: string): string => {
  if (!timeStr) return '';
  // 형식이 이미 HH:MM이면 그대로 반환
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
  // HH:MM:SS 형식이면 초 부분 제거
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr.substring(0, 5);
  return timeStr;
};

// 서비스 타입 코드 변환 (UI 코드 -> DB 코드)
export const getServiceTypeCode = (uiCode: string): string => {
  switch (uiCode) {
    case 'ntraffic': return 'ntraffic'; // 변경: naver-traffic -> ntraffic
    case 'naver-fakesale': return 'nfakesale';
    case 'naver-blog': return 'nblog';
    case 'naver-web': return 'nweb';
    case 'naver-place': return 'nplace';
    case 'naver-cafe': return 'ncafe';
    case 'coupang': return 'CoupangTraffic';
    case 'ohouse': return 'OhouseTraffic';
    default: return 'ntraffic'; // 기본값도 ntraffic으로 설정
  }
};

// 캠페인 생성
export const createCampaign = async (data: any): Promise<{success: boolean, id?: number, error?: string}> => {
  try {
    // 이제 campaign_id가 필요 없으므로 관련 코드 제거
    
    // Supabase Storage에 이미지 업로드
    let logoUrl = null;
    let bannerUrl = null;
    let additionalInfo: any = {};
    
    // 현재 사용자 ID 가져오기
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user?.id;
    
    // 1. 업로드된 로고 이미지가 있으면 저장
    if (data.uploadedLogo) {
      logoUrl = await uploadImageToStorage(
        data.uploadedLogo, 
        'campaigns-image',  // 버킷 이름을 campaigns-image로 변경
        'logos',            // 폴더 이름
        `logo-${Date.now()}`, // 캠페인 ID 대신 타임스탬프 사용
        userId              // 사용자 ID 전달
      );
      
      if (logoUrl) {
        additionalInfo.logo_url = logoUrl;
      }
    }
    
    // 2. 업로드된 배너 이미지가 있으면 저장
    if (data.uploadedBannerImage) {
      bannerUrl = await uploadImageToStorage(
        data.uploadedBannerImage, 
        'campaigns-image',     // 버킷 이름을 campaigns-image로 변경
        'banners',             // 폴더 이름
        `banner-${Date.now()}`, // 캠페인 ID 대신 타임스탬프 사용
        userId                 // 사용자 ID 전달
      );
      
      if (bannerUrl) {
        additionalInfo.banner_url = bannerUrl;
      }
    }
    
    // DB 컬럼명에 맞게 데이터 변환
    const insertData = {
      group_id: 'default', // NULL이 허용되지 않을 수 있으므로 기본값 설정
      campaign_name: data.campaignName,
      service_type: getServiceTypeCode(data.serviceType), // getServiceTypeCode 함수로 변환
      description: data.description || '',
      detailed_description: data.detailedDescription || '',
      efficiency: data.efficiency ? parseFloat(data.efficiency.replace('%', '')) : null,
      min_quantity: data.minQuantity ? parseInt(data.minQuantity.replace('개', '')) : 0, // 기본값 0으로 설정
      unit_price: data.unitPrice || 100,
      deadline: formatTimeHHMM(data.deadline || '22:00'), // 시:분 형식으로 저장
      additional_logic: data.additionalLogic ? parseInt(data.additionalLogic) : 0,
      logo: data.logo || 'animal-default.svg',
      status: data.status || 'waiting_approval', // 기본적으로 승인 대기 상태로 설정
      created_at: new Date(),
      updated_at: new Date(),
      // 추가 정보 (업로드된 이미지 URL)
      add_info: Object.keys(additionalInfo).length > 0 ? additionalInfo : null,
      // 현재 사용자의 ID를 mat_id로 설정 (슬롯 등록 시 필요)
      mat_id: userId
    };

    console.log('INSERT 시도 중인 데이터:', insertData);
    
    // 관리자 클라이언트를 사용하여 RLS 정책을 우회
    const { data: result, error } = await supabaseAdmin
      .from('campaigns')
      .insert(insertData)
      .select('id')
      .single();

    if (error) {
      console.error('캠페인 생성 중 오류:', error);
      console.error('오류 상세 정보:', JSON.stringify(error, null, 2));
      return { success: false, error: error.message };
    }

    return { success: true, id: result?.id };
  } catch (err) {
    console.error('캠페인 생성 중 예외 발생:', err);
    return { success: false, error: '캠페인 생성 중 오류가 발생했습니다.' };
  }
};