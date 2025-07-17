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
import { CampaignServiceType, FieldType, UserInputField } from './types';
import { RefundSettings } from '@/types/refund.types';
import { RefundSettingsForm } from '@/components/refund';

// 숫자를 한글 원 단위로 변환하는 함수
const toKoreanWon = (num: string | number): string => {
  const value = typeof num === 'string' ? parseInt(num.replace(/[^0-9]/g, '')) : num;
  if (isNaN(value) || value === 0) return '';

  const units = ['', '만', '억', '조'];
  let result = '';
  let remainingValue = value;

  // 조 단위
  if (remainingValue >= 1000000000000) {
    const cho = Math.floor(remainingValue / 1000000000000);
    result += cho.toLocaleString() + '조';
    remainingValue = remainingValue % 1000000000000;
  }

  // 억 단위
  if (remainingValue >= 100000000) {
    const eok = Math.floor(remainingValue / 100000000);
    if (result) result += ' ';
    result += eok.toLocaleString() + '억';
    remainingValue = remainingValue % 100000000;
  }

  // 만 단위
  if (remainingValue >= 10000) {
    const man = Math.floor(remainingValue / 10000);
    if (result) result += ' ';
    result += man.toLocaleString() + '만';
    remainingValue = remainingValue % 10000;
  }

  // 남은 금액
  if (remainingValue > 0) {
    if (result) result += ' ';
    result += remainingValue.toLocaleString();
  }

  return result + '원';
};

// 캠페인 폼 데이터 인터페이스
interface CampaignFormInputData {
  campaignName: string;
  description: string;
  detailedDescription: string;
  userInputFields: UserInputField[];
  logo: string;
  unitPrice: string;
  bannerImage?: string;
  minQuantity?: string;
  slotType?: 'standard' | 'guarantee' | 'per-unit';
  isNegotiable?: boolean;
  guaranteeCount?: string;
  guaranteeUnit?: '일' | '회';
  guaranteePeriod?: string;
  targetRank?: string;
  minGuaranteePrice?: string;
  maxGuaranteePrice?: string;
  // 단건형 전용 필드
  maxQuantity?: string;
  workPeriod?: string;
  refundSettings?: RefundSettings;
  deadline?: string;
  workCompletionMode?: 'manual' | 'auto';
  autoCompletionHour?: number;
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
  [CampaignServiceType.NAVER_SHOPPING_TRAFFIC]: {
    name: 'NS 트래픽',
    additionalFields: {}
  },
  [CampaignServiceType.NAVER_SHOPPING_FAKESALE]: {
    name: 'NS 가구매',
    additionalFields: {}
  },
  [CampaignServiceType.NAVER_SHOPPING_RANK]: {
    name: 'NS 순위확인',
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
  [CampaignServiceType.NAVER_PLACE_RANK]: {
    name: 'NP 순위확인',
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
  [CampaignServiceType.INSTAGRAM]: {
    name: '인스타그램',
    additionalFields: {}
  },
  [CampaignServiceType.PHOTO_VIDEO_PRODUCTION]: {
    name: '포토&영상 제작',
    additionalFields: {}
  },
  [CampaignServiceType.LIVE_BROADCASTING]: {
    name: '라이브방송',
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
  onLogoRemove?: () => void;
  bannerImagePreviewUrl?: string | null;
  onBannerImageUpload?: (file: File) => void;
  onBannerImageRemove?: () => void;
  isModal?: boolean;
  isEditMode?: boolean; // 편집 모드 여부
}

const CampaignForm: React.FC<CampaignFormProps> = ({
  formData,
  onFormDataChange,
  additionalFields,
  onAdditionalFieldsChange,
  serviceType = CampaignServiceType.NAVER_SHOPPING_RANK,
  loading = false,
  error = null,
  onBannerPreview,
  previewUrl,
  onLogoUpload,
  onLogoRemove,
  bannerImagePreviewUrl,
  onBannerImageUpload,
  onBannerImageRemove,
  isModal = true,
  isEditMode = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerImageFileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof CampaignFormInputData, value: string | number | Array<{ fieldName: string; description: string }> | boolean) => {
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

    return serviceTypeInfoMap[CampaignServiceType.NAVER_SHOPPING_RANK];
  };

  // 추가 필드 값 변경 핸들러
  const handleAdditionalFieldChange = (field: string, value: string) => {
    onAdditionalFieldsChange({
      ...additionalFields,
      [field]: value
    });
  };

  // 스타일 클래스 정의
  const containerClass = "overflow-hidden border border-border rounded-lg mb-6 shadow-sm";
  const headerClass = "flex flex-col sm:flex-row items-start sm:items-center p-4 sm:p-6 gap-4";
  const tableClass = "min-w-full divide-y divide-border";

  return (
    <div>
      {/* 오류 메시지 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-4 mb-5 rounded-md flex items-center shadow-sm border border-red-200 dark:border-red-800/50">
          <KeenIcon icon="warning-triangle" className="size-5 mr-3 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* 배너 및 로고 영역 */}
      <div className={`${containerClass} bg-background`}>
        {/* 배너 영역 */}
        <div className={headerClass}>
          <div className="relative flex-shrink-0 mx-auto sm:mx-0 sm:mr-4">
            {bannerImagePreviewUrl ? (
              <div className="relative">
                <img
                  src={bannerImagePreviewUrl}
                  alt="배너 이미지"
                  className="h-16 w-auto rounded-md border border-gray-200 shadow-sm object-cover"
                  style={{ maxWidth: '200px' }}
                />
                <button
                  type="button"
                  onClick={onBannerImageRemove}
                  className="absolute -top-2 -right-2 size-5 flex items-center justify-center bg-red-500 rounded-full text-white shadow-md hover:bg-red-600"
                  title="이미지 제거"
                >
                  <span className="text-xs font-bold leading-none">×</span>
                </button>
              </div>
            ) : (
              <div className="h-16 w-32 bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-medium border border-gray-200 shadow-sm rounded-md">
                배너
              </div>
            )}
            <input
              ref={bannerImageFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerImageUpload}
              className="hidden"
            />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Button
                type="button"
                onClick={() => bannerImageFileInputRef.current?.click()}
                className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto"
                size="sm"
                disabled={loading}
              >
                <KeenIcon icon="picture" className="me-1.5 size-4" />
                배너 이미지 업로드
              </Button>

              {bannerImagePreviewUrl && onBannerPreview && (
                <Button
                  type="button"
                  onClick={onBannerPreview}
                  className="bg-gray-500 hover:bg-gray-600 text-white w-full sm:w-auto"
                  size="sm"
                >
                  <KeenIcon icon="eye" className="me-1.5 size-4" />
                  배너 크게 보기
                </Button>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              캠페인 상세 페이지에 표시될 배너 이미지를 업로드하세요. 업로드되지 않을 경우 기본 배너 이미지를 사용합니다.
            </p>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-gray-200 dark:border-gray-700"></div>

        {/* 로고 영역 */}
        <div className={headerClass}>
          <div className="relative flex-shrink-0 mx-auto sm:mx-0 sm:mr-4">
            {previewUrl || formData.logo ? (
              <div className="relative">
                <img
                  src={previewUrl || (formData.logo.startsWith('/media/') ? toAbsoluteUrl(formData.logo) : toAbsoluteUrl(`/media/${formData.logo}`))}
                  className="rounded-full size-16 object-cover border border-gray-200 shadow-sm"
                  alt="캠페인 로고"
                />
                {previewUrl && onLogoRemove && (
                  <button
                    type="button"
                    onClick={onLogoRemove}
                    className="absolute -top-2 -right-2 size-5 flex items-center justify-center bg-red-500 rounded-full text-white shadow-md hover:bg-red-600"
                    title="이미지 제거"
                  >
                    <span className="text-xs font-bold leading-none">×</span>
                  </button>
                )}
              </div>
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto"
                size="sm"
                disabled={loading}
              >
                <KeenIcon icon="picture" className="me-1.5 size-4" />
                로고 이미지 업로드
              </Button>

              <span className="text-sm font-medium text-gray-500 hidden sm:inline mx-2">또는</span>

              <div className="w-full sm:w-64">
                {false ? (
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

                        // Extract animal name from path like "/media/animal/svg/bear.svg"
                        const pathParts = selectedAnimal.split('/');
                        const fileName = pathParts[pathParts.length - 1] || '';
                        const englishAnimalName = fileName.replace('.svg', '');
                        const koreanAnimalName = animalNameMap[englishAnimalName] || englishAnimalName;
                        const randomNum = Math.floor(10000 + Math.random() * 90000);

                        // 캠페인명이 비어있을 때만 자동 생성
                        const updatedData = {
                          ...formData,
                          logo: e.target.value
                        };

                        if (!formData.campaignName || formData.campaignName.trim() === '') {
                          updatedData.campaignName = `${koreanAnimalName}-${randomNum}`;
                        }

                        onFormDataChange(updatedData);
                      }
                    }}
                    className="select w-full h-10 px-3 py-2 border border-gray-200 bg-white focus:border-blue-500 rounded-md text-foreground"
                    disabled={loading}
                  >
                    <option value="none">기본 제공 로고 선택</option>
                    <option value="/media/animal/svg/bear.svg">곰</option>
                    <option value="/media/animal/svg/cat.svg">고양이</option>
                    <option value="/media/animal/svg/cow.svg">소</option>
                    <option value="/media/animal/svg/crocodile.svg">악어</option>
                    <option value="/media/animal/svg/dolphin.svg">돌고래</option>
                    <option value="/media/animal/svg/elephant.svg">코끼리</option>
                    <option value="/media/animal/svg/flamingo.svg">플라밍고</option>
                    <option value="/media/animal/svg/giraffe.svg">기린</option>
                    <option value="/media/animal/svg/horse.svg">말</option>
                    <option value="/media/animal/svg/kangaroo.svg">캥거루</option>
                    <option value="/media/animal/svg/koala.svg">코알라</option>
                    <option value="/media/animal/svg/leopard.svg">표범</option>
                    <option value="/media/animal/svg/lion.svg">사자</option>
                    <option value="/media/animal/svg/llama.svg">라마</option>
                    <option value="/media/animal/svg/owl.svg">올빼미</option>
                    <option value="/media/animal/svg/pelican.svg">펠리컸</option>
                    <option value="/media/animal/svg/penguin.svg">펭귄</option>
                    <option value="/media/animal/svg/sheep.svg">양</option>
                    <option value="/media/animal/svg/teddy-bear.svg">테디베어</option>
                    <option value="/media/animal/svg/turtle.svg">거북이</option>
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

                        // Extract animal name from path like "/media/animal/svg/bear.svg"
                        const pathParts = selectedAnimal.split('/');
                        const fileName = pathParts[pathParts.length - 1] || '';
                        const englishAnimalName = fileName.replace('.svg', '');
                        const koreanAnimalName = animalNameMap[englishAnimalName] || englishAnimalName;
                        const randomNum = Math.floor(10000 + Math.random() * 90000);

                        // 캠페인명이 비어있을 때만 자동 생성
                        const updatedData = {
                          ...formData,
                          logo: value
                        };

                        if (!formData.campaignName || formData.campaignName.trim() === '') {
                          updatedData.campaignName = `${koreanAnimalName}-${randomNum}`;
                        }

                        onFormDataChange(updatedData);
                      }
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full bg-white border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="기본 제공 로고 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">기본 제공 로고 선택</SelectItem>
                      <SelectItem value="/media/animal/svg/bear.svg">곰</SelectItem>
                      <SelectItem value="/media/animal/svg/cat.svg">고양이</SelectItem>
                      <SelectItem value="/media/animal/svg/cow.svg">소</SelectItem>
                      <SelectItem value="/media/animal/svg/crocodile.svg">악어</SelectItem>
                      <SelectItem value="/media/animal/svg/dolphin.svg">돌고래</SelectItem>
                      <SelectItem value="/media/animal/svg/elephant.svg">코끼리</SelectItem>
                      <SelectItem value="/media/animal/svg/flamingo.svg">플라밍고</SelectItem>
                      <SelectItem value="/media/animal/svg/giraffe.svg">기린</SelectItem>
                      <SelectItem value="/media/animal/svg/horse.svg">말</SelectItem>
                      <SelectItem value="/media/animal/svg/kangaroo.svg">캥거루</SelectItem>
                      <SelectItem value="/media/animal/svg/koala.svg">코알라</SelectItem>
                      <SelectItem value="/media/animal/svg/leopard.svg">표범</SelectItem>
                      <SelectItem value="/media/animal/svg/lion.svg">사자</SelectItem>
                      <SelectItem value="/media/animal/svg/llama.svg">라마</SelectItem>
                      <SelectItem value="/media/animal/svg/owl.svg">올빼미</SelectItem>
                      <SelectItem value="/media/animal/svg/pelican.svg">펠리컨</SelectItem>
                      <SelectItem value="/media/animal/svg/penguin.svg">펭귄</SelectItem>
                      <SelectItem value="/media/animal/svg/sheep.svg">양</SelectItem>
                      <SelectItem value="/media/animal/svg/teddy-bear.svg">테디베어</SelectItem>
                      <SelectItem value="/media/animal/svg/turtle.svg">거북이</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <Input
              type="text"
              value={formData.campaignName}
              onChange={(e) => handleChange('campaignName', e.target.value)}
              className="text-xl font-semibold"
              placeholder="캠페인 이름 입력 *"
              disabled={loading}
            />

            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              로고 이미지를 업로드 하거나 기본 제공 로고 중 선택하세요.
              <span className="text-blue-500 block sm:inline">(로고 선택 시 자동으로 "[동물명]-[랜덤숫자]" 형식의 이름이 생성됩니다)</span>
              <span className="text-red-500 block text-xs mt-1">* 표시된 항목은 필수 입력 사항입니다.</span>
            </p>
          </div>
        </div>
      </div>

      {/* 캠페인 정보 테이블 */}
      <div className={containerClass}>
        <table className={tableClass}>
          <tbody className="divide-y divide-border">
            {/* 서비스타입 선택 */}
            <tr>
              <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[200px]">
                서비스타입 <span className="text-red-500">*</span>
              </th>
              <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <label className={`flex items-center gap-2 ${isEditMode ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                      <input
                        type="radio"
                        name="slotType"
                        value="standard"
                        checked={formData.slotType === 'standard'}
                        onChange={(e) => handleChange('slotType', e.target.value)}
                        className="size-4"
                        disabled={loading || isEditMode}
                      />
                      <span className="text-xs sm:text-sm font-medium">일반형(슬롯기반) 서비스</span>
                    </label>
                    <label className={`flex items-center gap-2 ${isEditMode ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                      <input
                        type="radio"
                        name="slotType"
                        value="guarantee"
                        checked={formData.slotType === 'guarantee'}
                        onChange={(e) => handleChange('slotType', e.target.value)}
                        className="size-4"
                        disabled={loading || isEditMode}
                      />
                      <span className="text-xs sm:text-sm font-medium">보장형 서비스</span>
                    </label>
                    <label className={`flex items-center gap-2 ${isEditMode ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                      <input
                        type="radio"
                        name="slotType"
                        value="per-unit"
                        checked={formData.slotType === 'per-unit'}
                        onChange={(e) => handleChange('slotType', e.target.value)}
                        className="size-4"
                        disabled={loading || isEditMode}
                      />
                      <span className="text-xs sm:text-sm font-medium">단건형 서비스</span>
                    </label>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                    일반형은 작업 기반, 보장형은 기간 내 보장, 단건형은 건별 단가 기반 서비스입니다.
                    {isEditMode && <span className="text-red-500 block mt-1">※ 서비스타입은 수정할 수 없습니다.</span>}
                  </p>
                </div>
              </td>
            </tr>

            {/* 건당 단가 - 일반형/단건형일 때 표시 */}
            {formData.slotType !== 'guarantee' && (
              <tr>
                <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[160px]">
                  건당 단가 <span className="text-red-500">*</span>
                </th>
                <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
                  <div className="flex items-center">
                    <Input
                      type="number"
                      min="0"
                      step="10"
                      value={formData.unitPrice}
                      onChange={(e) => handleNumberChange('unitPrice', e.target.value)}
                      className="w-24"
                      disabled={loading}
                    />
                    <span className="ml-2 text-md font-medium text-foreground">원</span>
                  </div>
                </td>
              </tr>
            )}


            {/* 최소수량 - 일반형/단건형일 때 표시 */}
            {formData.slotType !== 'guarantee' && (
              <tr>
                <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[160px]">
                  최소수량 <span className="text-red-500">*</span>
                </th>
                <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={formData.minQuantity || '10'}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        handleChange('minQuantity', value);
                      }}
                      className="w-24 sm:w-32"
                      placeholder="10"
                      disabled={loading}
                    />
                    <span className="text-xs sm:text-sm text-muted-foreground">개</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                    {formData.slotType === 'per-unit' 
                      ? '최소 구매 가능한 수량을 설정하세요. (예: 300개)'
                      : '캠페인 진행을 위한 최소 구매 수량을 설정하세요. (기본값: 10개)'}
                  </p>
                </td>
              </tr>
            )}

            {/* 최대수량 - 단건형일 때만 표시 */}
            {formData.slotType === 'per-unit' && (
              <tr>
                <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[160px]">
                  최대수량
                </th>
                <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={formData.maxQuantity || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        handleChange('maxQuantity', value);
                      }}
                      className="w-24 sm:w-32"
                      placeholder="10000"
                      disabled={loading}
                    />
                    <span className="text-xs sm:text-sm text-muted-foreground">개</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">최대 구매 가능한 수량을 설정하세요. (선택사항)</p>
                </td>
              </tr>
            )}

            {/* 작업 기간 - 단건형일 때만 표시 */}
            {formData.slotType === 'per-unit' && (
              <tr>
                <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[160px]">
                  작업 기간 <span className="text-red-500">*</span>
                </th>
                <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={formData.workPeriod || '30'}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        handleChange('workPeriod', value);
                      }}
                      className="w-24 sm:w-32"
                      placeholder="30"
                      disabled={loading}
                    />
                    <span className="text-xs sm:text-sm text-muted-foreground">일</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">전체 작업을 완료하기 위한 기간을 입력하세요. (기본값: 30일)</p>
                </td>
              </tr>
            )}

            {/* 가격 협상 - 단건형일 때만 표시 */}
            {formData.slotType === 'per-unit' && (
              <tr>
                <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[160px]">
                  가격 협상
                </th>
                <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.isNegotiable || false}
                        onCheckedChange={(checked) => handleChange('isNegotiable', checked as boolean)}
                        disabled={loading}
                      />
                      <span className="text-xs sm:text-sm">가격 협상 가능</span>
                    </label>
                    {formData.isNegotiable && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="10"
                            value={formData.minGuaranteePrice || ''}
                            onChange={(e) => handleChange('minGuaranteePrice', e.target.value)}
                            className="w-24 sm:w-32"
                            placeholder="최소"
                            disabled={loading}
                          />
                          <span className="text-xs sm:text-sm text-muted-foreground">원</span>
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground">~</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="10"
                            value={formData.maxGuaranteePrice || ''}
                            onChange={(e) => handleChange('maxGuaranteePrice', e.target.value)}
                            className="w-24 sm:w-32"
                            placeholder="최대"
                            disabled={loading}
                          />
                          <span className="text-xs sm:text-sm text-muted-foreground">원</span>
                        </div>
                      </div>
                    )}
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      가격 협상을 허용하면 광고주가 원하는 단가를 제안할 수 있습니다.
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {/* 마감시간 */}
            <tr>
              <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[200px]">
                마감시간 <span className="text-red-500">*</span>
              </th>
              <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
                <div className="flex items-center gap-2">
                  <Select
                    value={formData.deadline?.split(':')[0] || '18'}
                    onValueChange={(value) => handleChange('deadline', `${value}:00`)}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i).padStart(2, '0')}>
                          {String(i).padStart(2, '0')}시
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.deadline === '00:00' && (
                    <span className="text-xs text-muted-foreground">당일 자정 접수를 마감으로 처리합니다</span>
                  )}
                </div>
              </td>
            </tr>

            {/* 보장성 슬롯 관련 필드들 - 보장성 슬롯 선택 시에만 표시 */}
            {formData.slotType === 'guarantee' && (
              <>
                {/* 작업 기간 */}
                <tr>
                  <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[160px]">
                    작업 기간 <span className="text-red-500">*</span>
                  </th>
                  <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={formData.guaranteePeriod || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            handleChange('guaranteePeriod', value);
                            
                            // 작업기간이 변경되면 보장일수도 조정
                            if (value !== '' && formData.guaranteeCount && formData.guaranteeUnit === '일') {
                              const workPeriod = parseInt(value);
                              const currentGuaranteeCount = parseInt(formData.guaranteeCount);
                              const maxDays = Math.min(workPeriod, 90);
                              
                              if (currentGuaranteeCount > maxDays) {
                                handleChange('guaranteeCount', maxDays.toString());
                              }
                            }
                          }}
                          className="w-24 sm:w-32"
                          placeholder="30"
                          disabled={loading}
                        />
                        <span className="text-xs sm:text-sm text-muted-foreground">일</span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        목표를 달성하기 위한 전체 작업 기간을 입력하세요.
                        {formData.guaranteeUnit === '일' && (
                          <span className="text-orange-500 block">※ 보장일수는 작업기간을 초과할 수 없습니다.</span>
                        )}
                      </p>
                    </div>
                  </td>
                </tr>

                {/* 보장 일수(횟수) */}
                <tr>
                  <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[160px]">
                    보장 일수(횟수) <span className="text-red-500">*</span>
                  </th>
                  <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={formData.guaranteeCount || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            const numValue = parseInt(value);
                            
                            if (value !== '') {
                              if (formData.guaranteeUnit === '일') {
                                // 일 단위: 작업기간과 90일 중 작은 값으로 제한
                                const workPeriod = parseInt(formData.guaranteePeriod || '0');
                                const maxDays = workPeriod > 0 ? Math.min(workPeriod, 90) : 90;
                                if (numValue > maxDays) {
                                  handleChange('guaranteeCount', maxDays.toString());
                                } else {
                                  handleChange('guaranteeCount', value);
                                }
                              } else {
                                // 회 단위: 90회로 제한 (작업기간 제한 없음)
                                if (numValue > 90) {
                                  handleChange('guaranteeCount', '90');
                                } else {
                                  handleChange('guaranteeCount', value);
                                }
                              }
                            } else {
                              handleChange('guaranteeCount', value);
                            }
                          }}
                          className="w-24 sm:w-32"
                          placeholder="10"
                          disabled={loading}
                        />
                        <Select
                          value={formData.guaranteeUnit || '일'}
                          onValueChange={(value) => handleChange('guaranteeUnit', value)}
                          disabled={loading}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="일">일</SelectItem>
                            <SelectItem value="회">회</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        작업 기간 내에 실제로 보장할 일수 또는 횟수를 입력하세요.
                        {formData.guaranteeUnit === '일' && (
                          <span className="text-red-500">
                            {formData.guaranteePeriod && parseInt(formData.guaranteePeriod) > 0
                              ? ` (최대 ${Math.min(parseInt(formData.guaranteePeriod), 90)}일)`
                              : ' (최대 90일)'}
                          </span>
                        )}
                        {formData.guaranteeUnit === '회' && <span className="text-red-500"> (최대 90회)</span>}
                      </p>
                    </div>
                  </td>
                </tr>


                {/* 보장 순위 */}
                <tr>
                  <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[160px]">
                    보장 순위 {formData.guaranteeUnit === '일' && <span className="text-red-500">*</span>}
                  </th>
                  <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max="30"
                          value={formData.targetRank || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 30)) {
                              handleChange('targetRank', value);
                            }
                          }}
                          className={`w-24 sm:w-32 ${formData.guaranteeUnit === '회' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                          placeholder="1"
                          disabled={loading || formData.guaranteeUnit === '회'}
                        />
                        <span className="text-xs sm:text-sm text-muted-foreground">위</span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {formData.guaranteeUnit === '회'
                          ? '횟수 보장 시 순위는 입력하지 않습니다.'
                          : '보장할 목표 순위를 입력하세요. (1-30위)'}
                      </p>
                    </div>
                  </td>
                </tr>

                {/* 보장 요약 정보 */}
                <tr>
                  <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[160px]">
                    보장 요약 정보
                  </th>
                  <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <KeenIcon icon="check" className="size-4 text-blue-500 flex-shrink-0" />
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {formData.guaranteeUnit === '일'
                            ? `작업 시작 후 ${formData.guaranteePeriod || '___'}일 안에 순위 ${formData.targetRank || '__'}위권을 ${formData.guaranteeCount || '___'}일 이상 유지하도록 보장합니다.`
                            : `작업 시작 후 ${formData.guaranteePeriod || '___'}일 안에 ${formData.guaranteeCount || '___'}회 이상 작업을 보장합니다.`
                          }
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* 최소/최대 보장 가격 */}
                <tr>
                  <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[160px]">
                    가격 <span className="text-red-500">*</span>
                  </th>
                  <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="1000"
                            value={formData.minGuaranteePrice || ''}
                            onChange={(e) => handleChange('minGuaranteePrice', e.target.value)}
                            className="w-24 sm:w-32"
                            placeholder="최소"
                            disabled={loading}
                          />
                          <span className="text-xs sm:text-sm text-muted-foreground">원</span>
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground">~</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="1000"
                            value={formData.maxGuaranteePrice || ''}
                            onChange={(e) => handleChange('maxGuaranteePrice', e.target.value)}
                            className="w-24 sm:w-32"
                            placeholder="최대"
                            disabled={loading}
                          />
                          <span className="text-xs sm:text-sm text-muted-foreground">원</span>
                        </div>
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        최소 가격과 최대 가격 범위를 입력하세요.
                        {(formData.minGuaranteePrice || formData.maxGuaranteePrice) && (
                          <span className="text-blue-600 dark:text-blue-400 font-medium ml-2">
                            (현재: {toKoreanWon(formData.minGuaranteePrice || '0') || '0원'} ~ {toKoreanWon(formData.maxGuaranteePrice || '0') || '0원'})
                          </span>
                        )}
                      </p>
                    </div>
                  </td>
                </tr>

                {/* 캐시 지급 안내 - 보장형 서비스일 때만 표시 */}
                <tr>
                  <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[160px]">
                    캐시 지급 안내
                  </th>
                  <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                      <div className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-300">
                        <p className="flex items-center gap-1.5 font-medium mb-1 text-xs sm:text-sm">
                          <KeenIcon icon="check-circle" className="size-4 text-amber-600 dark:text-amber-400" />
                          캐시 지급 안내
                        </p>
                        <p>• 보장 일수를 모두 채운 경우, +48시간 후 자동 지급됩니다. (고객이 완료 승인 시 즉시 지급)</p>
                        <p>• 보장 일수를 채우지 못한 경우, 마감일 기준으로 달성한 일 수만큼 지급됩니다. (총 금액 ÷ 성공 일 수 기준)</p>
                      </div>
                    </div>
                  </td>
                </tr>
              </>
            )}

            <tr>
              <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[200px]">
                작업 완료 방식 <span className="text-red-500">*</span>
              </th>
              <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
                <div className="space-y-3">
                  <Select 
                    value={formData.workCompletionMode || 'manual'} 
                    onValueChange={(value: string) => handleChange('workCompletionMode', value)}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-[250px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">수동완료 (매일 작업입력)</SelectItem>
                      <SelectItem value="auto">자동완료 (종료일에 일괄처리)</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {formData.workCompletionMode === 'auto' && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        자동완료 시간:
                      </span>
                      <Select 
                        value={String(formData.autoCompletionHour || 18)} 
                        onValueChange={(value: string) => handleChange('autoCompletionHour', parseInt(value))}
                        disabled={loading}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(24)].map((_, i) => (
                            <SelectItem key={i} value={String(i)}>
                              {i}시
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        매일 지정된 시간에 자동으로 작업이 완료됩니다
                      </span>
                    </div>
                  )}
                </div>
              </td>
            </tr>

            <tr>
              <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[200px]">
                캠페인 소개 <span className="text-red-500">*</span>
              </th>
              <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="min-h-[50px]"
                  rows={2}
                  placeholder="간단한 캠페인 소개를 입력하세요"
                  disabled={loading}
                />
              </td>
            </tr>

            <tr>
              <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[200px]">
                캠페인 상세설명 <span className="text-red-500">*</span>
              </th>
              <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
                <Textarea
                  value={formData.detailedDescription}
                  onChange={(e) => handleChange('detailedDescription', e.target.value)}
                  className="min-h-[80px]"
                  rows={4}
                  placeholder="상세한 캠페인 설명을 입력하세요"
                  disabled={loading}
                />
              </td>
            </tr>

            <tr>
              <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[160px] align-top">
                사용자 입력 필드 <span className="text-red-500">*</span>
              </th>
              <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
                <div className="space-y-2">
                  {(formData.userInputFields || []).map((field, index) => (
                    <div key={index} className="border border-gray-200 rounded-md p-3 bg-gray-50 hover:bg-gray-100 space-y-2">
                      {/* 모바일: 세로 레이아웃, 데스크톱: 가로 레이아웃 */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        {/* 순서 변경 버튼 */}
                        <div className="flex gap-1 order-last sm:order-first">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
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
                            className="h-8 w-8 p-0"
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

                        {/* 필드 입력 영역 */}
                        <div className="flex-1 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
                          {/* 타입 선택 (필드명 앞에 위치) */}
                          <div className="w-full sm:w-32">
                            <label className="block text-xs text-gray-600 mb-1 sm:hidden">타입</label>
                            {false ? (
                              <select
                                value={field.fieldType || FieldType.TEXT}
                                onChange={(e) => {
                                  const updatedFields = [...(formData.userInputFields || [])];
                                  updatedFields[index] = {
                                    ...updatedFields[index],
                                    fieldType: e.target.value as FieldType,
                                    // enum에서 다른 타입으로 변경시 enumOptions 제거
                                    enumOptions: e.target.value === FieldType.ENUM ? updatedFields[index].enumOptions : undefined
                                  };
                                  handleChange('userInputFields', updatedFields);
                                }}
                                className="w-full h-10 px-3 py-2 border border-gray-200 bg-white text-foreground rounded-md text-sm"
                                disabled={loading}
                              >
                                <option value={FieldType.TEXT}>텍스트</option>
                                <option value={FieldType.INTEGER}>숫자</option>
                                <option value={FieldType.ENUM}>선택목록</option>
                                <option value={FieldType.FILE}>파일</option>
                              </select>
                            ) : (
                              <Select
                                value={field.fieldType || FieldType.TEXT}
                                onValueChange={(value) => {
                                  const updatedFields = [...(formData.userInputFields || [])];
                                  updatedFields[index] = {
                                    ...updatedFields[index],
                                    fieldType: value as FieldType,
                                    // enum에서 다른 타입으로 변경시 enumOptions 제거
                                    enumOptions: value === FieldType.ENUM ? updatedFields[index].enumOptions : undefined
                                  };
                                  handleChange('userInputFields', updatedFields);
                                }}
                                disabled={loading}
                              >
                                <SelectTrigger className="w-full bg-white border-gray-200 focus:border-blue-500">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={5} className="z-[9999] bg-background border shadow-lg">
                                  <SelectItem value={FieldType.TEXT}>텍스트</SelectItem>
                                  <SelectItem value={FieldType.INTEGER}>숫자</SelectItem>
                                  <SelectItem value={FieldType.ENUM}>선택목록</SelectItem>
                                  <SelectItem value={FieldType.FILE}>파일</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>

                          {/* 필드명 입력 */}
                          <div className="w-full sm:w-1/3">
                            <label className="block text-xs text-gray-600 mb-1 sm:hidden">필드명</label>
                            <div className="relative">
                              <Input
                                type="text"
                                value={field.fieldName}
                                onChange={(e) => {
                                  // 특수문자 제거 (영문, 한글, 숫자, 공백만 허용)
                                  const filteredValue = e.target.value.replace(/[^a-zA-Z0-9ㄱ-ㅎ가-힣\s]/g, '');
                                  const updatedFields = [...(formData.userInputFields || [])];
                                  updatedFields[index] = { ...updatedFields[index], fieldName: filteredValue };
                                  handleChange('userInputFields', updatedFields);
                                }}
                                placeholder="필드명"
                                disabled={loading}
                                className={`text-sm pr-8 ${field.fieldName &&
                                    (formData.userInputFields || []).filter((f, i) => i !== index && f.fieldName === field.fieldName).length > 0
                                    ? 'border-red-500 focus:border-red-500'
                                    : ''
                                  }`}
                              />
                              {field.fieldName &&
                                (formData.userInputFields || []).filter((f, i) => i !== index && f.fieldName === field.fieldName).length > 0 && (
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 group">
                                    <KeenIcon icon="information" className="size-4 text-red-500 cursor-help" />
                                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10">
                                      <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                        중복된 필드명입니다
                                        <div className="absolute top-full right-2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>

                          {/* 화살표 (데스크톱에서만 표시) */}
                          <div className="text-gray-400 hidden sm:block">→</div>

                          {/* 설명 입력 */}
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1 sm:hidden">설명</label>
                            <Input
                              type="text"
                              value={field.description}
                              onChange={(e) => {
                                // 특수문자 제거 (영문, 한글, 숫자, 공백만 허용)
                                const filteredValue = e.target.value.replace(/[^a-zA-Z0-9ㄱ-ㅎ가-힣\s]/g, '');
                                const updatedFields = [...(formData.userInputFields || [])];
                                updatedFields[index] = { ...updatedFields[index], description: filteredValue };
                                handleChange('userInputFields', updatedFields);
                              }}
                              placeholder="필드 설명"
                              disabled={loading}
                              className="text-sm"
                            />
                          </div>
                        </div>

                        {/* 필수값 체크박스와 삭제 버튼 */}
                        <div className="flex items-center justify-between sm:justify-start gap-2">
                          <div className="flex items-center gap-2">
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
                              className="text-sm text-muted-foreground cursor-pointer select-none"
                            >
                              필수
                            </label>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-red-200 hover:border-red-400 hover:bg-red-50 text-red-500 hover:text-red-600"
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
                      </div>

                      {/* enum 타입일 때 옵션 입력 */}
                      {field.fieldType === FieldType.ENUM && (
                        <div className="mt-2 px-3">
                          <label className="block text-xs text-gray-600 mb-1">선택 옵션 (콤마로 구분)</label>
                          <Input
                            type="text"
                            defaultValue={field.enumOptions?.join(', ') || ''}
                            onBlur={(e) => {
                              const updatedFields = [...(formData.userInputFields || [])];
                              const options = e.target.value
                                .split(',')
                                .map(opt => opt.trim())
                                .filter(opt => opt.length > 0);
                              updatedFields[index] = {
                                ...updatedFields[index],
                                enumOptions: options.length > 0 ? options : undefined
                              };
                              handleChange('userInputFields', updatedFields);
                            }}
                            placeholder="옵션1, 옵션2, 옵션3"
                            disabled={loading}
                            className="text-sm"
                          />
                        </div>
                      )}

                      {/* file 타입일 때 안내 메시지 */}
                      {field.fieldType === FieldType.FILE && (
                        <div className="mt-2 px-3">
                          <div className="text-xs text-gray-500 space-y-1">
                            <p>• 최대 파일 크기: 10MB</p>
                            <p>• 허용 파일 타입: 이미지 파일 (JPG, PNG, GIF 등)</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <Button
                    type="button"
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300"
                    onClick={() => {
                      const updatedFields = [...(formData.userInputFields || [])];
                      updatedFields.push({
                        fieldName: '',
                        description: '',
                        isRequired: false,
                        fieldType: FieldType.TEXT // 기본값으로 TEXT 타입 설정
                      });
                      handleChange('userInputFields', updatedFields);
                    }}
                    disabled={loading}
                  >
                    <KeenIcon icon="plus" className="size-4 me-1.5" />
                    입력 필드 추가
                  </Button>
                </div>

                <div className="text-xs sm:text-sm text-muted-foreground mt-3">
                  <p className="text-red-500 font-medium">※ 최소 1개 이상의 필수 입력필드를 추가해야 합니다.</p>
                  <p className="mt-1">사용자가 슬롯 구매 시 입력해야 하는 필드를 정의하세요. 필드명은 한글이나 영문으로, 설명은 사용자에게 안내되는 내용입니다.</p>
                  <p className="mt-1">예시: 방문URL(필드명), '방문할 URL을 입력하세요'(설명)</p>
                  <p className="mt-1">• 화살표 버튼으로 필드 순서를 변경할 수 있습니다.</p>
                  <p className="mt-1">• '필수' 체크 시 사용자가 반드시 입력해야 하는 필드가 됩니다.</p>
                  <p className="mt-1">• 타입 선택: 텍스트(일반 텍스트), 숫자(숫자만 입력 가능), 선택목록(드롭다운 선택), 파일(파일 업로드)</p>
                </div>
              </td>
            </tr>

            {/* 서비스 유형별 추가 필드 */}
            {serviceType && serviceTypeInfoMap[serviceType] &&
              Object.entries(serviceTypeInfoMap[serviceType].additionalFields).map(([fieldKey, fieldInfo]) => (
                <tr key={fieldKey}>
                  <th className="px-3 py-1.5 sm:px-4 sm:py-2 bg-muted/50 text-left text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide w-[96px] sm:w-[128px] md:w-[160px]">
                    {fieldInfo.label}
                    {fieldInfo.required && <span className="text-red-500 ml-1">*</span>}
                  </th>
                  <td className="px-3 py-1.5 sm:px-4 sm:py-2 bg-background">
                    {fieldInfo.type === 'select' ? (
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
                    ) : fieldInfo.type === 'textarea' ? (
                      <Textarea
                        value={additionalFields[fieldKey] || ''}
                        onChange={(e) => handleAdditionalFieldChange(fieldKey, e.target.value)}
                        className="min-h-[50px]"
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
                    )}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* 환불 설정 섹션 */}
      <div className={containerClass}>
        <RefundSettingsForm
          settings={formData.refundSettings || {
            enabled: true,
            type: 'immediate',
            refund_rules: {
              min_usage_days: 0,
              max_refund_days: 7,
              partial_refund: true
            }
          }}
          onChange={(settings) => handleChange('refundSettings', settings as any)}
          disabled={loading}
          isModal={isModal}
        />
      </div>
    </div>
  );
};

export { CampaignForm };
export type { CampaignFormInputData as CampaignFormData };