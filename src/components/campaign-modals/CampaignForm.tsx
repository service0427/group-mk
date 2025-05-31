import React, { useState, useRef, ChangeEvent } from 'react';
import { KeenIcon } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toAbsoluteUrl } from '@/utils';
import { CampaignServiceType } from './types';

// 캠페인 폼 데이터 인터페이스
interface CampaignFormInputData {
  campaignName: string;
  description: string;
  detailedDescription: string;
  userInputFields: Array<{ fieldName: string; description: string; isRequired?: boolean; order?: number }>;
  logo: string;
  unitPrice: string;
  bannerImage?: string;
  minQuantity?: string;
}

// 서비스 타입별 필드 정보
interface ServiceTypeInfo {
  name: string;
  additionalFields: { 
    [key: string]: { 
      label: string; 
      type: string; 
      defaultValue: string; 
      placeholder?: string; 
      required?: boolean; 
      options?: Array<{ value: string, label: string }> 
    } 
  };
}

// 서비스 유형별 정보 정의 (추가 필드 제거됨)
const serviceTypeInfoMap: { [key: string]: ServiceTypeInfo } = {
  [CampaignServiceType.NAVER_TRAFFIC]: {
    name: 'N 트래픽',
    additionalFields: {}
  },
  [CampaignServiceType.NAVER_SHOPPING_TRAFFIC]: {
    name: 'NS 트래픽',
    additionalFields: {}
  },
  [CampaignServiceType.NAVER_SHOPPING_FAKESALE]: {
    name: 'NS 가구매',
    additionalFields: {}
  },
  [CampaignServiceType.NAVER_PLACE_TRAFFIC]: {
    name: 'NP 트래픽',
    additionalFields: {}
  },
  [CampaignServiceType.NAVER_PLACE_SAVE]: {
    name: 'NP 저장하기',
    additionalFields: {}
  },
  [CampaignServiceType.NAVER_PLACE_SHARE]: {
    name: 'NP 블로그공유',
    additionalFields: {}
  },
  [CampaignServiceType.NAVER_AUTO]: {
    name: 'N 자동완성',
    additionalFields: {}
  },
  [CampaignServiceType.COUPANG_TRAFFIC]: {
    name: 'CP 트래픽',
    additionalFields: {}
  },
  [CampaignServiceType.COUPANG_FAKESALE]: {
    name: 'CP 가구매',
    additionalFields: {}
  },
};

interface CampaignFormProps {
  formData: CampaignFormInputData;
  onFormDataChange: (formData: CampaignFormInputData) => void;
  additionalFields: { [key: string]: string };
  onAdditionalFieldsChange: (fields: { [key: string]: string }) => void;
  serviceType?: string | CampaignServiceType;
  loading?: boolean;
  error?: string | null;
  onBannerPreview?: () => void;
  // 업로드된 이미지 상태
  previewUrl?: string | null;
  onLogoUpload?: (file: File) => void;
  bannerImagePreviewUrl?: string | null;
  onBannerImageUpload?: (file: File) => void;
  onBannerImageRemove?: () => void;
  // 컴포넌트 타입별 스타일 적용
  isModal?: boolean;
}

const CampaignForm: React.FC<CampaignFormProps> = ({
  formData,
  onFormDataChange,
  additionalFields,
  onAdditionalFieldsChange,
  serviceType = CampaignServiceType.NAVER_TRAFFIC,
  loading = false,
  error = null,
  onBannerPreview,
  previewUrl,
  onLogoUpload,
  bannerImagePreviewUrl,
  onBannerImageUpload,
  onBannerImageRemove,
  isModal = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerImageFileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof CampaignFormInputData, value: string | Array<{ fieldName: string; description: string }>) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  // 숫자만 입력받는 핸들러
  const handleNumberChange = (field: keyof CampaignFormInputData, value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    const formattedValue = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');

    if (field === 'unitPrice') {
      onFormDataChange({ ...formData, [field]: formattedValue });
    }
  };

  // 로고 파일 업로드 처리
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onLogoUpload) return;

    // 파일 크기 체크 (5MB 이하로 제한)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    // 이미지 파일 체크
    if (!file.type.startsWith('image/')) {
      return;
    }

    onLogoUpload(file);
  };

  // 배너 이미지 업로드 처리
  const handleBannerImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onBannerImageUpload) return;

    // 파일 크기 체크 (10MB 이하로 제한)
    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    // 이미지 파일 체크
    if (!file.type.startsWith('image/')) {
      return;
    }

    onBannerImageUpload(file);
  };

  // 서비스 유형에 따른 필드 정보 가져오기
  const getServiceFieldInfo = (serviceType: string | CampaignServiceType): ServiceTypeInfo => {
    if (Object.values(CampaignServiceType).includes(serviceType as CampaignServiceType)) {
      return serviceTypeInfoMap[serviceType as CampaignServiceType];
    }
    
    if (typeof serviceType === 'string' && serviceTypeInfoMap[serviceType as any]) {
      return serviceTypeInfoMap[serviceType as any];
    }
    
    return serviceTypeInfoMap[CampaignServiceType.NAVER_TRAFFIC];
  };

  // 추가 필드 값 변경 핸들러
  const handleAdditionalFieldChange = (field: string, value: string) => {
    onAdditionalFieldsChange({
      ...additionalFields,
      [field]: value
    });
  };

  // 스타일 클래스 정의
  const containerClass = isModal ? "" : "overflow-hidden border border-border rounded-lg mb-6 shadow-sm";
  const headerClass = isModal ? "bg-background py-4 px-5 border-b sticky top-0 z-10 shadow-sm" : "flex items-center p-6";
  const tableClass = isModal ? "min-w-full divide-y divide-border" : "min-w-full divide-y divide-border";

  return (
    <div>
      {/* 오류 메시지 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-4 mb-5 rounded-md flex items-center shadow-sm border border-red-200 dark:border-red-800/50">
          <KeenIcon icon="warning-triangle" className="size-5 mr-3 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* 헤더 정보 - 표 스타일로 통일 */}
      <div className={`${containerClass} bg-white dark:bg-gray-800/20`}>
        <div className={headerClass}>
          <div className="relative flex-shrink-0 mr-4">
            {previewUrl || formData.logo ? (
              <img
                src={previewUrl || toAbsoluteUrl(`/media/${formData.logo}`)}
                className="rounded-full size-16 object-cover border border-gray-200 shadow-sm"
                alt="캠페인 로고"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = toAbsoluteUrl('/media/animal/svg/animal-default.svg');
                }}
              />
            ) : (
              <div className="rounded-full size-16 bg-gray-100 flex items-center justify-center text-gray-400 font-medium border border-gray-200 shadow-sm">
                로고
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
                disabled={loading}
              >
                <KeenIcon icon="picture" className="me-1.5 size-4" />
                로고 이미지 업로드
              </Button>

              <span className="text-sm font-medium text-gray-500 mx-2">또는</span>

              <div className="w-64">
                {isModal ? (
                  <select
                    value={previewUrl ? 'none' : (formData.logo || 'none')}
                    onChange={(e) => {
                      if (e.target.value === 'none') {
                        handleChange('logo', '');
                        return;
                      }

                      if (e.target.value) {
                        const selectedAnimal = e.target.value;
                        const animalNameMap: { [key: string]: string } = {
                          'bear': '곰', 'cat': '고양이', 'cow': '소', 'crocodile': '악어',
                          'dolphin': '돌고래', 'elephant': '코끼리', 'flamingo': '플라밍고',
                          'giraffe': '기린', 'horse': '말', 'kangaroo': '캥거루', 'koala': '코알라',
                          'leopard': '표범', 'lion': '사자', 'llama': '라마', 'owl': '올빼미',
                          'pelican': '펠리컨', 'penguin': '펭귄', 'sheep': '양',
                          'teddy-bear': '테디베어', 'turtle': '거북이'
                        };

                        const animalNameWithPath = selectedAnimal.split('/').pop() || '';
                        const englishAnimalName = animalNameWithPath.replace('.svg', '');
                        const koreanAnimalName = animalNameMap[englishAnimalName] || englishAnimalName;
                        const randomNum = Math.floor(10000 + Math.random() * 90000);

                        // 두 필드를 한 번에 업데이트
                        onFormDataChange({ 
                          ...formData, 
                          campaignName: `${koreanAnimalName}-${randomNum}`,
                          logo: e.target.value 
                        });
                      }
                    }}
                    className="select w-full h-10 px-3 py-2 border border-gray-200 bg-white focus:border-blue-500 rounded-md text-foreground"
                    disabled={loading}
                  >
                    <option value="none">기본 제공 로고 선택</option>
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
                ) : (
                  <Select
                    value={previewUrl ? 'none' : (formData.logo || 'none')}
                    onValueChange={(value) => {
                      if (value === 'none') {
                        handleChange('logo', '');
                        return;
                      }

                      if (value) {
                        const selectedAnimal = value;
                        const animalNameMap: { [key: string]: string } = {
                          'bear': '곰', 'cat': '고양이', 'cow': '소', 'crocodile': '악어',
                          'dolphin': '돌고래', 'elephant': '코끼리', 'flamingo': '플라밍고',
                          'giraffe': '기린', 'horse': '말', 'kangaroo': '캥거루', 'koala': '코알라',
                          'leopard': '표범', 'lion': '사자', 'llama': '라마', 'owl': '올빼미',
                          'pelican': '펠리컨', 'penguin': '펭귄', 'sheep': '양',
                          'teddy-bear': '테디베어', 'turtle': '거북이'
                        };

                        const animalNameWithPath = selectedAnimal.split('/').pop() || '';
                        const englishAnimalName = animalNameWithPath.replace('.svg', '').replace('animal/svg/', '');
                        const koreanAnimalName = animalNameMap[englishAnimalName] || englishAnimalName;
                        const randomNum = Math.floor(10000 + Math.random() * 90000);

                        // 두 필드를 한 번에 업데이트
                        onFormDataChange({ 
                          ...formData, 
                          campaignName: `${koreanAnimalName}-${randomNum}`,
                          logo: value 
                        });
                      }
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full bg-white border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="기본 제공 로고 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">기본 제공 로고 선택</SelectItem>
                      <SelectItem value="animal/svg/bear.svg">곰</SelectItem>
                      <SelectItem value="animal/svg/cat.svg">고양이</SelectItem>
                      <SelectItem value="animal/svg/cow.svg">소</SelectItem>
                      <SelectItem value="animal/svg/crocodile.svg">악어</SelectItem>
                      <SelectItem value="animal/svg/dolphin.svg">돌고래</SelectItem>
                      <SelectItem value="animal/svg/elephant.svg">코끼리</SelectItem>
                      <SelectItem value="animal/svg/flamingo.svg">플라밍고</SelectItem>
                      <SelectItem value="animal/svg/giraffe.svg">기린</SelectItem>
                      <SelectItem value="animal/svg/horse.svg">말</SelectItem>
                      <SelectItem value="animal/svg/kangaroo.svg">캥거루</SelectItem>
                      <SelectItem value="animal/svg/koala.svg">코알라</SelectItem>
                      <SelectItem value="animal/svg/leopard.svg">표범</SelectItem>
                      <SelectItem value="animal/svg/lion.svg">사자</SelectItem>
                      <SelectItem value="animal/svg/llama.svg">라마</SelectItem>
                      <SelectItem value="animal/svg/owl.svg">올빼미</SelectItem>
                      <SelectItem value="animal/svg/pelican.svg">펠리컨</SelectItem>
                      <SelectItem value="animal/svg/penguin.svg">펭귄</SelectItem>
                      <SelectItem value="animal/svg/sheep.svg">양</SelectItem>
                      <SelectItem value="animal/svg/teddy-bear.svg">테디베어</SelectItem>
                      <SelectItem value="animal/svg/turtle.svg">거북이</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            
            {isModal ? (
              <input
                type="text"
                value={formData.campaignName}
                onChange={(e) => handleChange('campaignName', e.target.value)}
                className="text-xl font-semibold text-foreground px-3 py-2 border border-gray-200 bg-white rounded-md w-full"
                placeholder="캠페인 이름 입력"
                disabled={loading}
              />
            ) : (
              <Input
                type="text"
                value={formData.campaignName}
                onChange={(e) => handleChange('campaignName', e.target.value)}
                className="text-xl font-semibold"
                placeholder="캠페인 이름 입력"
                disabled={loading}
              />
            )}
            
            <p className="text-sm text-muted-foreground mt-1">
              로고 이미지를 업로드 하거나 기본 제공 로고 중 선택하세요. 
              <span className="text-blue-500">(로고 선택 시 자동으로 "[동물명]-[랜덤숫자]" 형식의 이름이 생성됩니다)</span>
            </p>
          </div>
        </div>
      </div>

      {/* 캠페인 정보 테이블 */}
      <div className={containerClass}>
        <table className={tableClass}>
          <tbody className="divide-y divide-border">
            <tr>
              <th className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                건당 단가
              </th>
              <td className="px-6 py-4 bg-white dark:bg-gray-800/20">
                <div className="flex items-center">
                  {isModal ? (
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={formData.unitPrice}
                      onChange={(e) => handleNumberChange('unitPrice', e.target.value)}
                      className="w-24 h-10 px-3 py-2 border border-gray-200 bg-white text-foreground rounded-md"
                      disabled={loading}
                    />
                  ) : (
                    <Input
                      type="number"
                      min="0"
                      step="10"
                      value={formData.unitPrice}
                      onChange={(e) => handleNumberChange('unitPrice', e.target.value)}
                      className="w-24"
                      disabled={loading}
                    />
                  )}
                  <span className="ml-2 text-md font-medium text-foreground">원</span>
                </div>
              </td>
            </tr>
            
            <tr>
              <th className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                배너 이미지
              </th>
              <td className="px-6 py-4 bg-white dark:bg-gray-800/20">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-4">
                    <Button
                      type="button"
                      onClick={() => bannerImageFileInputRef.current?.click()}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                      size="sm"
                      disabled={loading}
                    >
                      <KeenIcon icon="picture" className="me-1.5 size-4" />
                      배너 이미지 업로드
                    </Button>
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
                          onClick={onBannerImageRemove}
                          className="absolute -top-2 -right-2 size-5 flex items-center justify-center bg-red-500 rounded-full text-white shadow-md hover:bg-red-600"
                          title="이미지 제거"
                        >
                          <KeenIcon icon="cross" className="size-2.5" />
                        </button>
                      </div>
                      {onBannerPreview && (
                        <Button
                          type="button"
                          onClick={onBannerPreview}
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                          size="sm"
                        >
                          <KeenIcon icon="eye" className="me-1.5 size-4" />
                          크게 보기
                        </Button>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">캠페인 상세 페이지에 표시될 배너 이미지를 업로드하세요.</p>
                </div>
              </td>
            </tr>
            
            <tr>
              <th className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                최소수량
              </th>
              <td className="px-6 py-4 bg-white dark:bg-gray-800/20">
                <div className="flex items-center gap-2">
                  {isModal ? (
                    <input
                      type="text"
                      value={formData.minQuantity || '10'}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        handleChange('minQuantity', value);
                      }}
                      className="w-32 px-3 py-2 border border-gray-200 bg-white text-foreground rounded-md"
                      placeholder="10"
                      disabled={loading}
                    />
                  ) : (
                    <Input
                      type="text"
                      value={formData.minQuantity || '10'}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        handleChange('minQuantity', value);
                      }}
                      className="w-32"
                      placeholder="10"
                      disabled={loading}
                    />
                  )}
                  <span className="text-sm text-muted-foreground">개</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">캠페인 진행을 위한 최소 구매 수량을 설정하세요. (기본값: 10개)</p>
              </td>
            </tr>
            
            <tr>
              <th className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                캠페인 소개
              </th>
              <td className="px-6 py-4 bg-white dark:bg-gray-800/20">
                {isModal ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="w-full h-[60px] px-3 py-2 border border-gray-200 bg-white text-foreground rounded-md"
                    rows={2}
                    placeholder="간단한 캠페인 소개를 입력하세요"
                    disabled={loading}
                  />
                ) : (
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="min-h-[60px]"
                    rows={2}
                    placeholder="간단한 캠페인 소개를 입력하세요"
                    disabled={loading}
                  />
                )}
              </td>
            </tr>
            
            <tr>
              <th className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                캠페인 상세설명
              </th>
              <td className="px-6 py-4 bg-white dark:bg-gray-800/20">
                {isModal ? (
                  <textarea
                    value={formData.detailedDescription}
                    onChange={(e) => handleChange('detailedDescription', e.target.value)}
                    className="w-full h-[100px] px-3 py-2 border border-gray-200 bg-white text-foreground rounded-md"
                    rows={4}
                    placeholder="상세한 캠페인 설명을 입력하세요"
                    disabled={loading}
                  />
                ) : (
                  <Textarea
                    value={formData.detailedDescription}
                    onChange={(e) => handleChange('detailedDescription', e.target.value)}
                    className="min-h-[100px]"
                    rows={4}
                    placeholder="상세한 캠페인 설명을 입력하세요"
                    disabled={loading}
                  />
                )}
              </td>
            </tr>
            
            <tr>
              <th className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                사용자 입력 필드
              </th>
              <td className="px-6 py-4 bg-white dark:bg-gray-800/20">
                <div className="space-y-3">
                  {(formData.userInputFields || []).map((field, index) => (
                    <div key={index} className="flex items-center gap-2 border border-gray-200 rounded-md p-2 bg-gray-50 hover:bg-gray-100">
                      {/* 순서 변경 버튼 */}
                      <div className="flex flex-col gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            if (index === 0) return;
                            const updatedFields = [...(formData.userInputFields || [])];
                            [updatedFields[index - 1], updatedFields[index]] = [updatedFields[index], updatedFields[index - 1]];
                            handleChange('userInputFields', updatedFields);
                          }}
                          disabled={loading || index === 0}
                        >
                          <KeenIcon icon="arrow-up" className="size-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            if (index === (formData.userInputFields || []).length - 1) return;
                            const updatedFields = [...(formData.userInputFields || [])];
                            [updatedFields[index], updatedFields[index + 1]] = [updatedFields[index + 1], updatedFields[index]];
                            handleChange('userInputFields', updatedFields);
                          }}
                          disabled={loading || index === (formData.userInputFields || []).length - 1}
                        >
                          <KeenIcon icon="arrow-down" className="size-3" />
                        </Button>
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-shrink-0 w-1/3">
                          {isModal ? (
                            <input
                              type="text"
                              value={field.fieldName}
                              onChange={(e) => {
                                const updatedFields = [...(formData.userInputFields || [])];
                                updatedFields[index] = { ...updatedFields[index], fieldName: e.target.value };
                                handleChange('userInputFields', updatedFields);
                              }}
                              className="w-full px-3 py-2 border border-gray-200 bg-white text-foreground rounded-md"
                              placeholder="필드명 (한글/영문)"
                              disabled={loading}
                            />
                          ) : (
                            <Input
                              type="text"
                              value={field.fieldName}
                              onChange={(e) => {
                                const updatedFields = [...(formData.userInputFields || [])];
                                updatedFields[index] = { ...updatedFields[index], fieldName: e.target.value };
                                handleChange('userInputFields', updatedFields);
                              }}
                              placeholder="필드명 (한글/영문)"
                              disabled={loading}
                            />
                          )}
                        </div>
                        <div className="text-gray-400">→</div>
                        <div className="flex-1">
                          {isModal ? (
                            <input
                              type="text"
                              value={field.description}
                              onChange={(e) => {
                                const updatedFields = [...(formData.userInputFields || [])];
                                updatedFields[index] = { ...updatedFields[index], description: e.target.value };
                                handleChange('userInputFields', updatedFields);
                              }}
                              className="w-full px-3 py-2 border border-gray-200 bg-white text-foreground rounded-md"
                              placeholder="필드 설명 (사용자에게 안내할 내용)"
                              disabled={loading}
                            />
                          ) : (
                            <Input
                              type="text"
                              value={field.description}
                              onChange={(e) => {
                                const updatedFields = [...(formData.userInputFields || [])];
                                updatedFields[index] = { ...updatedFields[index], description: e.target.value };
                                handleChange('userInputFields', updatedFields);
                              }}
                              placeholder="필드 설명 (사용자에게 안내할 내용)"
                              disabled={loading}
                            />
                          )}
                        </div>
                      </div>
                      {/* 필수값 체크박스 */}
                      <div className="flex items-center gap-1">
                        <Checkbox
                          id={`required-${index}`}
                          checked={field.isRequired || false}
                          onCheckedChange={(checked) => {
                            const updatedFields = [...(formData.userInputFields || [])];
                            updatedFields[index] = { ...updatedFields[index], isRequired: !!checked };
                            handleChange('userInputFields', updatedFields);
                          }}
                          disabled={loading}
                        />
                        <label 
                          htmlFor={`required-${index}`} 
                          className="text-sm text-gray-600 whitespace-nowrap cursor-pointer select-none"
                        >
                          필수
                        </label>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0 border-red-200 hover:border-red-400 hover:bg-red-50 text-red-500 hover:text-red-600"
                        onClick={() => {
                          const updatedFields = [...(formData.userInputFields || [])];
                          updatedFields.splice(index, 1);
                          handleChange('userInputFields', updatedFields);
                        }}
                        disabled={loading}
                      >
                        <KeenIcon icon="trash" className="size-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300"
                    onClick={() => {
                      const updatedFields = [...(formData.userInputFields || [])];
                      updatedFields.push({ fieldName: '', description: '', isRequired: false });
                      handleChange('userInputFields', updatedFields);
                    }}
                    disabled={loading}
                  >
                    <KeenIcon icon="plus" className="size-4 me-1.5" />
                    입력 필드 추가
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground mt-3">
                  <p>사용자가 슬롯 구매 시 입력해야 하는 필드를 정의하세요. 필드명은 한글이나 영문으로, 설명은 사용자에게 안내되는 내용입니다.</p>
                  <p className="mt-1">예시: 방문URL(필드명), '방문할 URL을 입력하세요'(설명)</p>
                  <p className="mt-1">• 화살표 버튼으로 필드 순서를 변경할 수 있습니다.</p>
                  <p className="mt-1">• '필수' 체크 시 사용자가 반드시 입력해야 하는 필드가 됩니다.</p>
                </div>
              </td>
            </tr>

            {/* 서비스 유형별 추가 필드 */}
            {serviceType && serviceTypeInfoMap[serviceType] &&
              Object.entries(serviceTypeInfoMap[serviceType].additionalFields).map(([fieldKey, fieldInfo]) => (
                <tr key={fieldKey}>
                  <th className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                    {fieldInfo.label}
                    {fieldInfo.required && <span className="text-red-500 ml-1">*</span>}
                  </th>
                  <td className="px-6 py-4 bg-white dark:bg-gray-800/20">
                    {fieldInfo.type === 'select' ? (
                      isModal ? (
                        <select
                          value={additionalFields[fieldKey] || fieldInfo.defaultValue || 'none'}
                          onChange={(e) => handleAdditionalFieldChange(fieldKey, e.target.value)}
                          className="w-full h-10 px-3 py-2 border border-gray-200 bg-white text-foreground rounded-md"
                          disabled={loading}
                        >
                          <option value="none">선택하세요</option>
                          {fieldInfo.options?.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Select
                          value={additionalFields[fieldKey] || fieldInfo.defaultValue || 'none'}
                          onValueChange={(value) => handleAdditionalFieldChange(fieldKey, value)}
                          disabled={loading}
                        >
                          <SelectTrigger className="w-full bg-white border-gray-200 focus:border-blue-500">
                            <SelectValue placeholder="선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">선택하세요</SelectItem>
                            {fieldInfo.options?.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )
                    ) : fieldInfo.type === 'textarea' ? (
                      isModal ? (
                        <textarea
                          value={additionalFields[fieldKey] || ''}
                          onChange={(e) => handleAdditionalFieldChange(fieldKey, e.target.value)}
                          className="w-full h-[60px] px-3 py-2 border border-gray-200 bg-white text-foreground rounded-md"
                          placeholder={fieldInfo.placeholder}
                          disabled={loading}
                          required={fieldInfo.required}
                        />
                      ) : (
                        <Textarea
                          value={additionalFields[fieldKey] || ''}
                          onChange={(e) => handleAdditionalFieldChange(fieldKey, e.target.value)}
                          className="min-h-[60px]"
                          placeholder={fieldInfo.placeholder}
                          disabled={loading}
                          required={fieldInfo.required}
                        />
                      )
                    ) : (
                      isModal ? (
                        <input
                          type={fieldInfo.type}
                          value={additionalFields[fieldKey] || ''}
                          onChange={(e) => handleAdditionalFieldChange(fieldKey, e.target.value)}
                          className="w-full h-10 px-3 py-2 border border-gray-200 bg-white text-foreground rounded-md"
                          placeholder={fieldInfo.placeholder}
                          disabled={loading}
                          required={fieldInfo.required}
                        />
                      ) : (
                        <Input
                          type={fieldInfo.type}
                          value={additionalFields[fieldKey] || ''}
                          onChange={(e) => handleAdditionalFieldChange(fieldKey, e.target.value)}
                          className="w-full"
                          placeholder={fieldInfo.placeholder}
                          disabled={loading}
                          required={fieldInfo.required}
                        />
                      )
                    )}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { CampaignForm };
export type { CampaignFormInputData as CampaignFormData };