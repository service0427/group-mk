import { supabase, supabaseAdmin } from '@/supabase';
import { ICampaign } from '../components/CampaignContent';
import { USER_ROLES } from '@/config/roles.config';
import { 
  createCampaignRequestNotification, 
  createCampaignApprovedNotification, 
  createCampaignRejectedNotification,
  createCampaignReapprovalRequestNotification
} from '@/utils/notificationActions';

// Base64 이미지를 Supabase Storage에 업로드하는 함수
export const uploadImageToStorage = async (base64Data: string, bucket: string, folder: string, fileName: string, userId?: string): Promise<string | null> => {
  try {


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




    // Base64 데이터를 Blob 객체로 변환
    const byteCharacters = atob(base64WithoutPrefix);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: `image/${fileType}` });



    // 먼저 버킷 존재 여부 확인
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {

    } else {
      const bucketExists = buckets?.some(b => b.name === bucket) || false;


      if (!bucketExists) {

      }
    }

    // Supabase Storage에 파일 업로드 시도
    let uploadResult;
    try {


      uploadResult = await supabase
        .storage
        .from(bucket)
        .upload(filePath, blob, {
          contentType: `image/${fileType}`,
          cacheControl: '3600',
          upsert: true
        });


    } catch (uploadError) {

      uploadResult = { error: uploadError, data: null };
    }

    // 업로드 결과 확인
    if (uploadResult.error) {

      return null;
    }

    // 업로드 성공 시 URL 생성
    try {
      // 먼저 영구적인 public URL 시도
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (publicUrlData && publicUrlData.publicUrl) {

        return publicUrlData.publicUrl;
      } else {
        // 대체 방법: 만료 기간이 긴 서명된 URL 시도

        const expirySeconds = 365 * 24 * 60 * 60; // 1년

        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, expirySeconds);

        if (signedUrlError) {

          throw signedUrlError;
        }

        if (signedUrlData && signedUrlData.signedUrl) {

          return signedUrlData.signedUrl;
        } else {
          throw new Error('URL을 생성할 수 없습니다.');
        }
      }
    } catch (urlError) {


      // 마지막 대안: 직접 URL 형식 구성 시도
      try {
        const directPublicUrl = `/storage/v1/object/public/${bucket}/${filePath}`;

        return directPublicUrl;
      } catch (directUrlError) {

        return null;
      }
    }
  } catch (error) {

    return null;
  }
};

// Supabase에서 캠페인 데이터 가져오기
export const fetchCampaigns = async (serviceType: string, userId?: string): Promise<ICampaign[]> => {
  // 서비스 타입 검증
  if (!serviceType) {
    console.warn('fetchCampaigns: 서비스 타입이 비어있습니다. 필터링이 적용되지 않을 수 있습니다.');
  }

  // 기본 쿼리 생성
  let query = supabase.from('campaigns').select('*');

  // 서비스 타입이 'all'이 아닌 경우에만 필터링 추가
  if (serviceType && serviceType.trim() !== '' && serviceType.toLowerCase() !== 'all') {
    query = query.eq('service_type', serviceType);
  }

  // 사용자 ID가 있으면 본인 캠페인만 필터링
  if (userId) {
    query = query.eq('mat_id', userId);
  }

  // 정렬 적용
  const { data, error } = await query.order('id', { ascending: true });

  if (error) {
    console.error('fetchCampaigns 오류:', error);
    return [];
  }
  
  // DB 데이터를 프론트엔드에서 사용하는 형태로 변환
  return data.map(item => {
    // add_info가 문자열로 저장되어 있으면 JSON으로 파싱
    const parsedItem = { ...item };

    // add_info 필드 처리
    if (typeof parsedItem.add_info === 'string' && parsedItem.add_info) {
      try {
        parsedItem.add_info = JSON.parse(parsedItem.add_info);

      } catch (error) {

        // 파싱에 실패했지만 logo_url이 문자열 안에 있는 경우
        const logoUrlMatch = parsedItem.add_info.match(/"logo_url":\s*"([^"]+)"/);
        if (logoUrlMatch && logoUrlMatch[1]) {
          parsedItem.add_info_logo_url = logoUrlMatch[1];

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
        color: getStatusColor(parsedItem.status),
        status: parsedItem.status // 원본 status 값 추가
      },
      additionalLogic: parsedItem.additional_logic ? parsedItem.additional_logic.toString() : '',
      // 상세 설명을 분리해서 명시적으로 가져오기
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

      return null;
    }

    return data.role;
  } catch (err) {

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
    case 'waiting_approval': return 'warning'; // 승인 대기중은 warning 색상으로 변경
    default: return 'info';
  }
};

// 캠페인 상태 업데이트
export const updateCampaignStatus = async (campaignId: number, newStatus: string): Promise<boolean> => {
  try {
    // 현재 캠페인 정보 가져오기 (승인/반려 시 알림을 위해)
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
    
    if (fetchError) {
      console.error('캠페인 정보 조회 오류:', fetchError);
      return false;
    }

    // DB에 상태 업데이트 (RLS 우회를 위해 supabaseAdmin 사용)
    const { data: updateData, error } = await supabaseAdmin
      .from('campaigns')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .select();

    if (error) {
      console.error('캠페인 상태 업데이트 오류:', error);
      return false;
    }

    // 알림 처리
    if (campaign) {
      const campaignName = campaign.campaign_name;
      const matId = campaign.mat_id;
      
      try {
        // 캠페인 승인 시 알림
        if (newStatus === 'pending' && campaign.status === 'waiting_approval') {
          await createCampaignApprovedNotification(
            matId,
            campaignId.toString(),
            campaignName,
            campaign.service_type
          );
        }
        
        // 캠페인 반려 시 알림 (반려 사유가 없는 상태 변경만 있는 경우, 여기서는 기본 메시지만 전달)
        if (newStatus === 'rejected' && campaign.status !== 'rejected') {
          await createCampaignRejectedNotification(
            matId,
            campaignId.toString(),
            campaignName,
            campaign.rejected_reason || '반려 사유가 기록되지 않았습니다.',
            campaign.service_type
          );
        }
        
        // waiting_approval 상태로 변경되면 재승인 요청으로 간주
        if (newStatus === 'waiting_approval' && campaign.status === 'rejected') {
          await createCampaignReapprovalRequestNotification(
            campaignId.toString(),
            campaignName,
            matId
          );
        }
      } catch (notificationError) {
        console.error('캠페인 상태 변경 알림 전송 오류:', notificationError);
        // 알림 실패해도 상태 업데이트는 성공으로 처리
      }
    }

    return true;
  } catch (err) {
    console.error('캠페인 상태 업데이트 중 예외 발생:', err);
    return false;
  }
};

// 캠페인 데이터 업데이트
export const updateCampaign = async (campaignId: number, data: any): Promise<boolean> => {
  try {
    
    // Supabase Storage에 이미지 업로드
    let logoUrl = null;
    let bannerUrl = null;

    // data.add_field를 additionalInfo.add_field로 이동 (키 이동)
    let additionalInfo: any = {
      // 사용자 입력 필드가 있으면 add_field로 저장
      add_field: data.add_field
    };

    // 현재 사용자 ID 가져오기
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user?.id;

    // 기존 캠페인 정보 가져오기 (add_info 필드, mat_id, rejected_reason 확인을 위해)
    const { data: existingCampaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (fetchError) {
      console.error("기존 캠페인 로드 실패:", fetchError);
    } else if (existingCampaign?.add_info) {
      // 기존 add_info 필드가 문자열로 저장되어 있으면 파싱
      if (typeof existingCampaign.add_info === 'string') {
        try {
          const parsedAddInfo = JSON.parse(existingCampaign.add_info);
          // add_field는 덮어쓰지 않고 나머지만 합침
          additionalInfo = {
            ...parsedAddInfo,
            add_field: data.add_field // 항상 새 add_field 사용
          };
        } catch (e) {
          console.error('add_info 파싱 오류:', e);
          // additionalInfo의 add_field는 이미 설정되어 있음
        }
      } else {
        // 기존 데이터 + 새 add_field (덮어쓰기)
        additionalInfo = {
          ...existingCampaign.add_info,
          add_field: data.add_field // 항상 새 add_field 사용
        };
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

    // 사용자 입력 필드는 add_info.add_field에 저장됩니다

    // 업데이트 데이터 타입 정의
    interface IUpdateData {
      campaign_name: string;
      description: string;
      detailed_description?: string;
      unit_price: number;
      deadline: string;
      updated_at: Date;
      add_info: any; // add_info 내부에 add_field 포함
      logo?: string;
      status?: string;
      rejected_reason?: string;
    }

    // 이제 additionalInfo에 이미 add_field가 포함되어 있음
    
    // DB 컬럼명에 맞게 데이터 변환
    let updateData: IUpdateData = {
      campaign_name: data.campaignName,
      description: data.description,
      detailed_description: data.detailedDescription,
      unit_price: data.unitPrice ? parseFloat(data.unitPrice) : 100,
      deadline: formatTimeHHMM(data.deadline), // 시:분 형식만 저장
      updated_at: new Date(),
      add_info: additionalInfo, // 여기에 이미 add_field가 포함됨
      // 로고 이미지 경로 변경 (업로드된 로고가 있거나 로고 값이 있을 경우)
      ...(data.uploadedLogo || data.logo ? { logo: data.logo } : {})
    };

    // 상태 변경 플래그와 이전 상태 저장
    const statusChanged = data.status && existingCampaign?.status !== data.status;
    const previousStatus = existingCampaign?.status;

    // 상태 변경이 있으면 업데이트 (먼저 처리)
    if (data.status) {
      updateData = {
        ...updateData,
        status: data.status
      };
    }

    // 반려 사유 처리 (data.rejectionReason 또는 data.rejected_reason 사용)
    const rejectionReason = data.rejectionReason || data.rejected_reason;

    if (rejectionReason) {
      // 1. 메인 필드 업데이트: rejected_reason
      updateData.rejected_reason = rejectionReason;

      // 2. add_info JSON 내부에도 저장 (하위 호환성)
      if (typeof additionalInfo === 'object') {
        additionalInfo.rejection_reason = rejectionReason;
        updateData.add_info = additionalInfo;
      } else {
        // add_info가 객체가 아닌 경우 새로 생성
        updateData.add_info = {
          ...additionalInfo,
          rejection_reason: rejectionReason
        };
      }
    }

    // 상태는 rejected이지만 사유가 없는 경우 경고
    if (data.status === 'rejected' && !rejectionReason) {
      console.warn('반려 상태로 변경되었지만 반려 사유가 지정되지 않았습니다.');
    }

    // mat_id가 없을 경우에만 추가 (기존 mat_id 유지가 중요)
    if (userId && !existingCampaign?.mat_id) {
      // 타입 안전하게 mat_id 추가 (존재 여부 확인 후)
      const updatedData = {
        ...updateData,
        mat_id: userId
      };
      updateData = updatedData;
    }

    // 반려 상태일 때는 supabaseAdmin(RLS 우회)을 사용하여 저장
    const client = (data.status === 'rejected') ? supabaseAdmin : supabase;
      
    const { error } = await client
      .from('campaigns')
      .update(updateData)
      .eq('id', campaignId);

    if (error) {
      console.error('캠페인 업데이트 오류:', error);
      return false;
    }

    // 캠페인 상태 변경 관련 알림 처리
    try {
      const matId = existingCampaign?.mat_id || '';
      const campaignName = data.campaignName || existingCampaign?.campaign_name || '';
      
      // 승인 대기 -> 준비중/진행중 상태 변경 시 (승인 알림)
      if (statusChanged && previousStatus === 'waiting_approval' && 
          (data.status === 'pending' || data.status === 'active')) {
        await createCampaignApprovedNotification(
          matId,
          campaignId.toString(),
          campaignName,
          existingCampaign?.service_type
        );
      }
      
      // 반려 상태로 변경된 경우 알림
      if (statusChanged && data.status === 'rejected') {
        await createCampaignRejectedNotification(
          matId,
          campaignId.toString(),
          campaignName,
          rejectionReason || '반려 사유가 기록되지 않았습니다.',
          existingCampaign?.service_type
        );
      }
      
      // 반려에서 승인 대기 상태로 변경 (재승인 요청)
      if (statusChanged && previousStatus === 'rejected' && data.status === 'waiting_approval') {
        await createCampaignReapprovalRequestNotification(
          campaignId.toString(),
          campaignName,
          matId
        );
      }
    } catch (notificationError) {
      console.error('캠페인 업데이트 알림 전송 오류:', notificationError);
      // 알림 실패해도 업데이트는 성공으로 처리
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

import { CampaignServiceType } from '@/components/campaign-modals/types';

// 서비스 타입 코드 변환 (UI 코드 -> DB 코드)
export const getServiceTypeCode = (uiCode: string): string => {
  // 빈 값 체크
  if (!uiCode || uiCode.trim() === '') {
    console.warn('getServiceTypeCode: 빈 UI 코드가 전달되었습니다.');
    return '';
  }
  
  // 'all' 타입은 그대로 반환
  if (uiCode.toLowerCase() === 'all') {
    return 'all';
  }

  // CampaignServiceType enum 값인 경우 그대로 사용
  if (Object.values(CampaignServiceType).includes(uiCode as CampaignServiceType)) {
    return uiCode;
  }

  // 소문자로 통일하여 처리 (대소문자 차이로 인한 오류 방지)
  const normalizedCode = uiCode.toLowerCase().trim();

  // UI 코드와 DB 코드 매핑 객체 (CampaignServiceType enum 값으로 통일)
  const codeMap: Record<string, string> = {
    // 네이버 트래픽 (제거됨 - NAVER_SHOPPING_TRAFFIC으로 대체)
    'ntraffic': CampaignServiceType.NAVER_SHOPPING_TRAFFIC,
    'naver-traffic': CampaignServiceType.NAVER_SHOPPING_TRAFFIC,
    'navertraffic': CampaignServiceType.NAVER_SHOPPING_TRAFFIC,

    // 네이버 자동완성
    'naver-auto': CampaignServiceType.NAVER_AUTO,               // → 'NaverAuto'
    'nauto': CampaignServiceType.NAVER_AUTO,
    'naver-fakesale': CampaignServiceType.NAVER_AUTO,
    'naverfakesale': CampaignServiceType.NAVER_AUTO,
    'nfakesale': CampaignServiceType.NAVER_AUTO,

    // 네이버 쇼핑
    'nshopping': CampaignServiceType.NAVER_SHOPPING_TRAFFIC,      // → 'NaverShoppingTraffic'
    'nshop-traffic': CampaignServiceType.NAVER_SHOPPING_TRAFFIC,  // → 'NaverShoppingTraffic'
    'naver-shopping': CampaignServiceType.NAVER_SHOPPING_TRAFFIC,
    'naver-shopping-traffic': CampaignServiceType.NAVER_SHOPPING_TRAFFIC,

    // 네이버 쇼핑 가구매
    'nshop-fakesale': CampaignServiceType.NAVER_SHOPPING_FAKESALE, // → 'NaverShoppingFakeSale'
    'nshoppingfakesale': CampaignServiceType.NAVER_SHOPPING_FAKESALE,
    'naver-shopping-fakesale': CampaignServiceType.NAVER_SHOPPING_FAKESALE,

    // 네이버 쇼핑 순위확인
    'nshop-rank': CampaignServiceType.NAVER_SHOPPING_RANK,
    'nshoppingrank': CampaignServiceType.NAVER_SHOPPING_RANK,
    'naver-shopping-rank': CampaignServiceType.NAVER_SHOPPING_RANK,

    // 네이버 플레이스 트래픽
    'nplace': CampaignServiceType.NAVER_PLACE_TRAFFIC,           // → 'NaverPlaceTraffic'
    'nplace-traffic': CampaignServiceType.NAVER_PLACE_TRAFFIC,
    'naver-place': CampaignServiceType.NAVER_PLACE_TRAFFIC,
    'naverplace': CampaignServiceType.NAVER_PLACE_TRAFFIC,
    'naver-place-traffic': CampaignServiceType.NAVER_PLACE_TRAFFIC,

    // 네이버 플레이스 저장
    'nplace-save': CampaignServiceType.NAVER_PLACE_SAVE,         // → 'NaverPlaceSave'
    'naver-place-save': CampaignServiceType.NAVER_PLACE_SAVE,
    'nplacesave': CampaignServiceType.NAVER_PLACE_SAVE,

    // 네이버 플레이스 공유
    'nplace-share': CampaignServiceType.NAVER_PLACE_SHARE,       // → 'NaverPlaceShare'
    'naver-place-share': CampaignServiceType.NAVER_PLACE_SHARE,
    'nplaceshare': CampaignServiceType.NAVER_PLACE_SHARE,

    // 네이버 플레이스 순위확인
    'nplace-rank': CampaignServiceType.NAVER_PLACE_RANK,
    'nplacerank': CampaignServiceType.NAVER_PLACE_RANK,
    'naver-place-rank': CampaignServiceType.NAVER_PLACE_RANK,

    // 쿠팡 트래픽
    'coupang': CampaignServiceType.COUPANG_TRAFFIC,              // → 'CoupangTraffic'
    'coupang-traffic': CampaignServiceType.COUPANG_TRAFFIC,
    'coupangtraffic': CampaignServiceType.COUPANG_TRAFFIC,

    // 쿠팡 가구매
    'coupang-fakesale': CampaignServiceType.COUPANG_FAKESALE,    // → 'CoupangFakeSale'
    'coupangfakesale': CampaignServiceType.COUPANG_FAKESALE,

    // 기존 레거시 코드 호환성 유지
    'nblog': 'nblog',
    'naver-blog': 'nblog',
    'naverblog': 'nblog',
    'nweb': 'nweb',
    'naver-web': 'nweb',
    'naverweb': 'nweb',
    'ncafe': 'ncafe',
    'naver-cafe': 'ncafe',
    'navercafe': 'ncafe',
  };

  // 매핑된 값 확인
  const dbCode = codeMap[normalizedCode];

  if (dbCode) {
    return dbCode;
  }

  // 매핑되지 않은 코드 로깅 후 원래 코드 반환
  console.warn(`getServiceTypeCode: 알 수 없는 서비스 타입 코드 '${uiCode}'`);
  return normalizedCode; // 기본값은 원래 입력한 값 그대로 반환
};

// 캠페인 생성
export const createCampaign = async (data: any): Promise<{ success: boolean, id?: number, error?: string }> => {
  try {
    // 이제 campaign_id가 필요 없으므로 관련 코드 제거

    // Supabase Storage에 이미지 업로드
    let logoUrl = null;
    let bannerUrl = null;
    const additionalInfo: any = {};

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
    // additionalInfo에 add_field 추가
    if (data.add_field && Array.isArray(data.add_field)) {
      additionalInfo.add_field = data.add_field;
    }
    
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
      logo: data.logo || '',  // 로고가 없으면 빈 문자열로 설정
      status: data.status || 'waiting_approval', // 기본적으로 승인 대기 상태로 설정
      created_at: new Date(),
      updated_at: new Date(),
      // 추가 정보 (업로드된 이미지 URL + add_field)
      add_info: additionalInfo,
      // 현재 사용자의 ID를 mat_id로 설정 (슬롯 등록 시 필요)
      mat_id: userId
    };

    // 관리자 클라이언트를 사용하여 RLS 정책을 우회
    const { data: result, error } = await supabaseAdmin
      .from('campaigns')
      .insert(insertData)
      .select('id')
      .single();

    if (error) {
      console.error('캠페인 생성 오류:', error);
      return { success: false, error: error.message };
    }

    // 캠페인 생성 성공 시 운영자에게 알림
    if (result?.id) {
      try {
        await createCampaignRequestNotification(
          result.id.toString(),
          data.campaignName,
          userId || '',
          getServiceTypeCode(data.serviceType)
        );
      } catch (notificationError) {
        console.error('캠페인 신청 알림 전송 실패:', notificationError);
        // 알림 전송 실패해도 캠페인 생성은 성공으로 처리
      }
    }

    return { success: true, id: result?.id };
  } catch (err) {
    console.error('캠페인 생성 중 예외 발생:', err);
    return { success: false, error: '캠페인 생성 중 오류가 발생했습니다.' };
  }
};