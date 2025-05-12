import React, { useState, useRef, ChangeEvent } from 'react';
import { KeenIcon } from '@/components';
import { ICampaign } from '@/pages/admin/campaigns/components/CampaignContent';
import { toAbsoluteUrl } from '@/utils';
import { createCampaign, formatTimeHHMM } from '../../services/campaignService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// 새 캠페인 인터페이스
interface NewCampaign {
  campaignName: string;
  description: string;
  detailedDescription: string;
  logo: string;
  unitPrice: string;
  deadline: string;
  status: string;
  bannerImage: string;
}

interface CampaignAddModalProps {
  open: boolean;
  onClose: () => void;
  serviceType: string;
  onSave?: (newCampaign: ICampaign) => void;
}

const CampaignAddModal: React.FC<CampaignAddModalProps> = ({
  open,
  onClose,
  serviceType,
  onSave
}) => {
  // 기본값으로 채워진 새 캠페인 객체
  const [newCampaign, setNewCampaign] = useState<NewCampaign>({
    campaignName: '',
    description: '',
    detailedDescription: '',
    logo: '', // 기본 로고를 빈 값으로 설정해 기본 제공 로고 선택이 기본값이 되도록 함
    unitPrice: '100',
    deadline: '18:00',
    status: 'pending', // 기본 상태는 '준비중'
    bannerImage: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 로고 업로드 관련 상태
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 배너 이미지 업로드 관련 상태
  const [uploadedBannerImage, setUploadedBannerImage] = useState<string | null>(null);
  const [bannerImagePreviewUrl, setBannerImagePreviewUrl] = useState<string | null>(null);
  const bannerImageFileInputRef = useRef<HTMLInputElement>(null);
  
  // 배너 이미지 미리보기 모달 상태
  const [bannerPreviewModalOpen, setBannerPreviewModalOpen] = useState<boolean>(false);
  
  // 캠페인 전체 미리보기 모달 상태
  const [campaignPreviewModalOpen, setCampaignPreviewModalOpen] = useState<boolean>(false);
  
  const handleChange = (field: keyof NewCampaign, value: string) => {
    setNewCampaign(prev => ({ ...prev, [field]: value }));
  };
  
  // 숫자만 입력받는 핸들러
  const handleNumberChange = (field: keyof NewCampaign, value: string) => {
    // 숫자와 소수점만 허용
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // 소수점이 두 개 이상 있는 경우 첫 번째 소수점만 유지
    const parts = numericValue.split('.');
    const formattedValue = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');
    
    // unitPrice만 처리 (다른 숫자 필드들은 제거됨)
    if (field === 'unitPrice') {
      setNewCampaign(prev => ({ ...prev, [field]: formattedValue }));
    }
  };
  
  // 로고 파일 업로드 처리
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 파일 크기 체크 (5MB 이하로 제한)
    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하만 가능합니다.');
      return;
    }
    
    // 이미지 파일 체크
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    
    // 파일 데이터를 Base64로 변환하여 저장
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // 항상 새 이미지로 업데이트
      setPreviewUrl(result);
      setUploadedLogo(file.name);
      
      // 명시적으로 기본 선택을 지우고 업로드 이미지를 사용하도록 설정
      setNewCampaign(prev => ({
        ...prev,
        logo: '' // 기본 선택을 초기화
      }));
      
      // 서버 업로드를 위한 로직은 여기에 추가 (필요 시)
      // 현재는 미리보기만 구현
    };
    reader.readAsDataURL(file);
  };
  
  // 파일 선택 클릭 핸들러
  const handleFileSelectClick = () => {
    fileInputRef.current?.click();
  };
  
  // 배너 이미지 업로드 처리
  const handleBannerImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 파일 크기 체크 (10MB 이하로 제한)
    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하만 가능합니다.');
      return;
    }
    
    // 이미지 파일 체크
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    
    // 파일 데이터를 Base64로 변환하여 저장
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setBannerImagePreviewUrl(result);
      setUploadedBannerImage(file.name);
      
      // 서버 업로드를 위한 로직은 여기에 추가 (필요 시)
      // 현재는 미리보기만 구현
    };
    reader.readAsDataURL(file);
  };
  
  // 배너 이미지 파일 선택 클릭 핸들러
  const handleBannerImageSelectClick = () => {
    bannerImageFileInputRef.current?.click();
  };
  
  const handleSave = async () => {
    // 필수 필드 검증
    if (!newCampaign.campaignName.trim()) {
      setError('캠페인 이름은 필수입니다.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 로고와 배너 정보는 createCampaign 함수 내에서 자동으로 처리됨

      // 1. DB에 새 캠페인 생성
      const result = await createCampaign({
        campaignName: newCampaign.campaignName,
        description: newCampaign.description,
        detailedDescription: newCampaign.detailedDescription,
        logo: previewUrl ? 'uploaded-logo.png' : newCampaign.logo, // 실제 구현에서는 업로드된 파일 경로로 변경
        uploadedLogo: previewUrl, // base64 데이터를 서버로 전달 (실제 구현 시)
        bannerImage: bannerImagePreviewUrl ? 'banner-image.png' : null, // 실제 구현에서는 업로드된 파일 경로로 변경
        uploadedBannerImage: bannerImagePreviewUrl, // base64 데이터를 서버로 전달 (실제 구현 시)
        unitPrice: newCampaign.unitPrice,
        deadline: newCampaign.deadline,
        status: newCampaign.status,
        serviceType: serviceType,
        // 기본값 설정
        efficiency: '0',
        minQuantity: '10',
        additionalLogic: '0'
      });
      
      if (!result.success) {
        throw new Error(result.error || '캠페인 생성에 실패했습니다.');
      }
      
      // 2. 생성된 캠페인 데이터를 UI 형식으로 변환
      const createdCampaign: ICampaign = {
        id: result?.id?.toString() || '0',
        campaignName: newCampaign.campaignName,
        description: newCampaign.description,
        logo: previewUrl ? 'uploaded-logo.png' : newCampaign.logo, // 실제 구현에서는 업로드된 파일 경로로 변경
        efficiency: '0%', // 기본값
        minQuantity: '10개', // 기본값
        deadline: formatTimeHHMM(newCampaign.deadline || ''),
        status: {
          label: getStatusLabel(newCampaign.status),
          color: getStatusColor(newCampaign.status)
        },
        detailedDescription: newCampaign.detailedDescription,
        additionalLogic: '0', // 기본값
        originalData: {
          // campaign_id 필드 제거
          unit_price: parseFloat(newCampaign.unitPrice || '0'),
          min_quantity: 10, // 기본값
          efficiency: 0, // 기본값
          deadline: formatTimeHHMM(newCampaign.deadline || ''),
          additional_logic: 0, // 기본값
          description: newCampaign.description,
          detailed_description: newCampaign.detailedDescription,
          status: newCampaign.status,
          logo: previewUrl ? 'uploaded-logo.png' : newCampaign.logo,
          uploaded_logo_data: previewUrl, // 실제 구현 시 이 부분은 필요에 따라 수정
          banner_image: bannerImagePreviewUrl ? 'banner-image.png' : null,
          uploaded_banner_image_data: bannerImagePreviewUrl // 실제 구현 시 이 부분은 필요에 따라 수정
        }
      };
      
      // 3. 부모 컴포넌트에 생성된 캠페인 데이터 전달
      if (onSave) {
        onSave(createdCampaign);
      }
      
      onClose();
    } catch (err) {
      
      setError(err instanceof Error ? err.message : '캠페인 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 상태값에 따른 라벨 반환
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'active': return '진행중';
      case 'pending': return '준비중';
      case 'pause': return '표시안함';
      default: return '준비중';
    }
  };
  
  // 상태값에 따른 색상 반환
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'success';
      case 'pause': return 'warning';
      case 'pending': return 'info';
      case 'completed': return 'primary';
      case 'rejected': return 'danger';
      default: return 'info';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="bg-background py-4 px-6 border-b sticky top-0 z-10">
            <DialogTitle className="text-lg font-medium text-foreground">새 캠페인 추가</DialogTitle>
          </DialogHeader>

          <div className="p-4 bg-background overflow-y-auto flex-1">
            <div className="space-y-4">
              {/* 오류 메시지 */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-4 rounded-md flex items-center mb-4">
                  <KeenIcon icon="warning-triangle" className="size-5 mr-2" />
                  {error}
                </div>
              )}
            
              {/* 헤더 정보 */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {previewUrl || newCampaign.logo ? (
                    <img
                      src={previewUrl || toAbsoluteUrl(`/media/${newCampaign.logo}`)}
                      className="rounded-full size-16 shrink-0 object-cover"
                      alt="캠페인 로고"
                      onError={(e) => {
                        // 이미지 로드 실패 시 기본 이미지 사용
                        (e.target as HTMLImageElement).src = toAbsoluteUrl('/media/animal/svg/animal-default.svg');
                      }}
                    />
                  ) : (
                    <div className="rounded-full size-16 shrink-0 bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                      로고
                    </div>
                  )}
                  <button 
                    type="button"
                    onClick={handleFileSelectClick}
                    className="absolute -bottom-1 -right-1 size-6 flex items-center justify-center bg-primary rounded-full text-white shadow-md hover:bg-primary/90"
                    title="로고 업로드"
                  >
                    <KeenIcon icon="camera" className="size-3" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={newCampaign.campaignName}
                    onChange={(e) => handleChange('campaignName', e.target.value)}
                    className="text-xl font-semibold text-foreground w-full px-3 py-2 border border-border bg-background rounded-md"
                    placeholder="캠페인 이름 입력"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* 캠페인 정보 테이블 */}
              <div className="overflow-hidden border border-border rounded-lg mb-4">
                <table className="min-w-full divide-y divide-border">
                  <tbody className="divide-y divide-border">
                    <tr>
                      <th className="px-3 py-2 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider w-1/3">
                        로고 업로드 또는 선택
                      </th>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={handleFileSelectClick}
                              className="btn btn-sm btn-primary"
                              disabled={loading}
                            >
                              <KeenIcon icon="cloud-upload" className="me-1" />
                              로고 이미지 업로드
                            </button>
                            {uploadedLogo && (
                              <span className="text-sm text-success">
                                <KeenIcon icon="check-circle" className="me-1" />
                                {uploadedLogo} 업로드됨
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">또는 기본 제공 로고 중 선택: <span className="text-blue-500">(로고 선택 시 자동으로 "[동물명]-[랜덤숫자]" 형식의 이름이 생성됩니다)</span></p>
                          <select
                            value={previewUrl ? '' : newCampaign.logo}
                            onChange={(e) => {
                              if (e.target.value) {
                                // 업로드된 이미지를 모두 제거하고 드롭다운 선택으로 전환
                                setPreviewUrl(null);
                                setUploadedLogo(null);
                                
                                // 선택된 동물 로고 값
                                const selectedAnimal = e.target.value;
                                
                                // 동물명 추출 및 한글로 변환
                                const animalNameMap: {[key: string]: string} = {
                                  'bear': '곰',
                                  'cat': '고양이',
                                  'cow': '소',
                                  'crocodile': '악어',
                                  'dolphin': '돌고래',
                                  'elephant': '코끼리',
                                  'flamingo': '플라밍고',
                                  'giraffe': '기린',
                                  'horse': '말',
                                  'kangaroo': '캥거루',
                                  'koala': '코알라',
                                  'leopard': '표범',
                                  'lion': '사자',
                                  'llama': '라마',
                                  'owl': '올빼미',
                                  'pelican': '펠리컨',
                                  'penguin': '펭귄',
                                  'sheep': '양',
                                  'teddy-bear': '테디베어',
                                  'turtle': '거북이'
                                };
                                
                                // 동물명 추출 (마지막 / 이후, .svg 이전 텍스트)
                                const animalNameWithPath = selectedAnimal.split('/').pop() || '';
                                const englishAnimalName = animalNameWithPath.replace('.svg', '');
                                
                                // 영어 동물명을 한글로 변환
                                const koreanAnimalName = animalNameMap[englishAnimalName] || englishAnimalName;
                                
                                // 5자리 랜덤 숫자 생성 (10000~99999)
                                const randomNum = Math.floor(10000 + Math.random() * 90000);
                                
                                // "[한글 동물명]-[랜덤숫자]" 형식으로 자동 설정 (기존 이름 덮어쓰기)
                                handleChange('campaignName', `${koreanAnimalName}-${randomNum}`);
                                
                                // logo 필드를 선택된 값으로 설정
                                handleChange('logo', e.target.value);
                              }
                            }}
                            className="w-full h-10 px-3 py-2 border border-border bg-background text-foreground rounded-md text-md"
                            disabled={loading}
                          >
                            <option value="">기본 제공 로고 선택</option>
                            <option value="animal/svg/bear.svg">곰</option>
                            <option value="animal/svg/cat.svg">고양이</option>
                            <option value="animal/svg/cow.svg">소</option>
                            <option value="animal/svg/crocodile.svg">악어</option>
                            <option value="animal/svg/dolphin.svg">돌고래</option>
                            <option value="animal/svg/elephant.svg">코끼리</option>
                            <option value="animal/svg/flamingo.svg">플라밍고</option>
                            <option value="animal/svg/giraffe.svg">기린</option>
                            <option value="animal/svg/horse.svg">말</option>
                            <option value="animal/svg/kangaroo.svg">캥거루</option>
                            <option value="animal/svg/koala.svg">코알라</option>
                            <option value="animal/svg/leopard.svg">표범</option>
                            <option value="animal/svg/lion.svg">사자</option>
                            <option value="animal/svg/llama.svg">라마</option>
                            <option value="animal/svg/owl.svg">올빼미</option>
                            <option value="animal/svg/pelican.svg">펠리컨</option>
                            <option value="animal/svg/penguin.svg">펭귄</option>
                            <option value="animal/svg/sheep.svg">양</option>
                            <option value="animal/svg/teddy-bear.svg">테디베어</option>
                            <option value="animal/svg/turtle.svg">거북이</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th className="px-3 py-2 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                        건당 단가
                      </th>
                      <td className="px-3 py-2">
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={newCampaign.unitPrice}
                            onChange={(e) => handleNumberChange('unitPrice', e.target.value)}
                            className="w-24 h-10 px-3 py-2 border border-border bg-background text-foreground rounded-md text-md"
                            disabled={loading}
                          />
                          <span className="ml-2 text-md font-medium text-foreground">원</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th className="px-3 py-2 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                        접수마감시간
                      </th>
                      <td className="px-3 py-2">
                        <input
                          type="time"
                          value={newCampaign.deadline}
                          onChange={(e) => handleChange('deadline', e.target.value)}
                          className="w-36 h-10 px-3 py-2 border border-border bg-background text-foreground rounded-md text-md"
                          disabled={loading}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th className="px-3 py-2 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                        배너 이미지
                      </th>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start gap-4">
                            <button
                              type="button"
                              onClick={handleBannerImageSelectClick}
                              className="btn btn-sm btn-primary"
                              disabled={loading}
                            >
                              <KeenIcon icon="image" className="me-1" />
                              배너 이미지 업로드
                            </button>
                            {uploadedBannerImage && (
                              <span className="text-sm text-success">
                                <KeenIcon icon="check-circle" className="me-1" />
                                {uploadedBannerImage} 업로드됨
                              </span>
                            )}
                            <input
                              ref={bannerImageFileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleBannerImageUpload}
                              className="hidden"
                            />
                          </div>
                          
                          {bannerImagePreviewUrl && (
                            <div className="mt-2 relative flex items-start gap-2">
                              <div className="relative">
                                <img 
                                  src={bannerImagePreviewUrl} 
                                  alt="배너 이미지 미리보기" 
                                  className="w-40 h-auto rounded-md border border-border object-cover"
                                  style={{ maxHeight: '60px' }}
                                />
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setBannerImagePreviewUrl(null);
                                    setUploadedBannerImage(null);
                                  }}
                                  className="absolute -top-2 -right-2 size-5 flex items-center justify-center bg-red-500 rounded-full text-white shadow-md hover:bg-red-600"
                                  title="이미지 제거"
                                >
                                  <KeenIcon icon="cross" className="size-2.5" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => setBannerPreviewModalOpen(true)}
                                className="btn btn-sm bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                <KeenIcon icon="eye" className="me-1" />
                                크게 보기
                              </button>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground mt-1">캠페인 상세 페이지에 표시될 배너 이미지를 업로드하세요.</p>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th className="px-3 py-2 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                        캠페인 설명
                      </th>
                      <td className="px-3 py-2">
                        <textarea
                          value={newCampaign.description}
                          onChange={(e) => handleChange('description', e.target.value)}
                          className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-md min-h-[60px]"
                          rows={2}
                          placeholder="간단한 캠페인 설명을 입력하세요"
                          disabled={loading}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th className="px-3 py-2 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                        캠페인 상세설명
                      </th>
                      <td className="px-3 py-2">
                        <textarea
                          value={newCampaign.detailedDescription}
                          onChange={(e) => handleChange('detailedDescription', e.target.value)}
                          className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-md min-h-[100px]"
                          rows={4}
                          placeholder="상세한 캠페인 설명을 입력하세요"
                          disabled={loading}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th className="px-3 py-2 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                        캠페인 상태
                      </th>
                      <td className="px-3 py-2">
                        <select
                          value={newCampaign.status}
                          onChange={(e) => handleChange('status', e.target.value)}
                          className="w-full h-10 px-3 py-2 border border-border bg-background text-foreground rounded-md text-md"
                          disabled={loading}
                        >
                          <option value="pending">준비중</option>
                          <option value="active">진행중</option>
                          <option value="pause">표시안함</option>
                        </select>
                        <p className="text-sm text-muted-foreground mt-1">캠페인 등록 후 초기 상태를 지정합니다.</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 버튼 - 푸터 영역 */}
          <div className="flex justify-end items-center gap-3 py-3 px-4 bg-background border-t border-border sticky bottom-0 z-10">
                {/* 미리보기 버튼 (캠페인 추가 버튼 왼쪽에 배치) */}
                <Button 
                  onClick={() => setCampaignPreviewModalOpen(true)} 
                  variant="default" 
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={loading}
                >
                  <KeenIcon icon="eye" className="me-1.5" />
                  미리보기
                </Button>
                
                {/* 캠페인 추가 버튼 */}
                <Button 
                  onClick={handleSave} 
                  className="bg-primary hover:bg-primary/90 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                      저장 중...
                    </span>
                  ) : '캠페인 추가'}
                </Button>
                
                {/* 취소 버튼 */}
                <Button 
                  onClick={onClose} 
                  variant="outline"
                  disabled={loading}
                >
                  취소
                </Button>
              </div>
        </DialogContent>
      </Dialog>

      {/* 배너 이미지 미리보기 모달 */}
      {bannerPreviewModalOpen && (
        <Dialog open={bannerPreviewModalOpen} onOpenChange={setBannerPreviewModalOpen}>
          <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
            <DialogHeader className="bg-background py-3 px-4 border-b">
              <DialogTitle className="text-lg font-medium text-foreground">배너 이미지 미리보기</DialogTitle>
            </DialogHeader>
            
            <div className="p-4 bg-background flex flex-col">
              {bannerImagePreviewUrl ? (
                <div className="flex justify-center items-center">
                  <img 
                    src={bannerImagePreviewUrl} 
                    alt="배너 이미지 미리보기" 
                    className="max-w-full h-auto rounded-md"
                    style={{ maxHeight: '400px' }}
                  />
                </div>
              ) : (
                <div className="flex justify-center items-center h-40 text-muted-foreground">
                  <p>이미지를 찾을 수 없습니다.</p>
                </div>
              )}
              
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={() => setBannerPreviewModalOpen(false)}
                  variant="outline"
                >
                  닫기
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* 캠페인 전체 미리보기 모달 */}
      {campaignPreviewModalOpen && (
        <Dialog open={campaignPreviewModalOpen} onOpenChange={setCampaignPreviewModalOpen}>
          <DialogContent className="sm:max-w-2xl p-0 overflow-hidden flex flex-col max-h-[90vh] border-4 border-primary">
            <DialogHeader className="bg-gray-100 dark:bg-gray-800 py-3 px-4 border-b sticky top-0 z-10 shadow-sm">
              <DialogTitle className="text-lg font-semibold text-foreground flex items-center">
                <KeenIcon icon="eye" className="mr-2 text-primary" />
                캠페인 미리보기
              </DialogTitle>
            </DialogHeader>

            <div className="bg-background overflow-y-auto flex-1">
              {/* 배너 이미지 (있을 경우) */}
              {bannerImagePreviewUrl && (
                <div className="w-full">
                  <img 
                    src={bannerImagePreviewUrl} 
                    alt="캠페인 배너" 
                    className="w-full h-auto object-cover"
                    style={{ maxHeight: '250px' }}
                  />
                </div>
              )}
              
              <div className="p-6">
                {/* 캠페인 헤더 정보 */}
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={previewUrl || toAbsoluteUrl(`/media/${newCampaign.logo}`)}
                    className="rounded-full size-16 shrink-0 object-cover"
                    alt="캠페인 로고"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = toAbsoluteUrl('/media/animal/svg/animal-default.svg');
                    }}
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {newCampaign.campaignName || '(캠페인 이름을 입력해주세요)'}
                    </h2>
                    <div className="mt-1 flex gap-2">
                      <span className={`badge badge-${getStatusColor(newCampaign.status)} badge-outline rounded-[30px]`}>
                        <span className={`size-1.5 rounded-full bg-${getStatusColor(newCampaign.status)} me-1.5`}></span>
                        {getStatusLabel(newCampaign.status)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        마감시간: {newCampaign.deadline || '18:00'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* 캠페인 주요 정보 */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-muted p-4 rounded-md">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">건당 단가</h3>
                    <p className="text-xl font-semibold text-primary">{newCampaign.unitPrice}원</p>
                  </div>
                  <div className="bg-muted p-4 rounded-md">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">최소 수량</h3>
                    <p className="text-xl font-semibold text-primary">10개</p>
                  </div>
                </div>
                
                {/* 캠페인 설명 */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">캠페인 설명</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-foreground whitespace-pre-line">
                      {newCampaign.description || '(캠페인 설명을 입력해주세요)'}
                    </p>
                  </div>
                </div>
                
                {/* 캠페인 상세 설명 */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">캠페인 상세 설명</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-foreground whitespace-pre-line">
                      {newCampaign.detailedDescription || '(캠페인 상세 설명을 입력해주세요)'}
                    </p>
                  </div>
                </div>
                
                {/* 미리보기 알림 */}
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md text-blue-600 dark:text-blue-300 mb-6">
                  <div className="flex items-start">
                    <KeenIcon icon="information-circle" className="size-5 mr-2 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">미리보기 모드</p>
                      <p className="text-sm mt-1">이 화면은 캠페인이 등록된 후 어떻게 보일지를 미리 보여주는 화면입니다. 실제 데이터는 저장 전까지 반영되지 않습니다.</p>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>

            <div className="flex justify-end p-4 border-t bg-gray-100 dark:bg-gray-800 sticky bottom-0 shadow-lg z-10">
                <Button
                  onClick={() => setCampaignPreviewModalOpen(false)}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <KeenIcon icon="cross" className="me-1 size-4" />
                  닫기
                </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export { CampaignAddModal };