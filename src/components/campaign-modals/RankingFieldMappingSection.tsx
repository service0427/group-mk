import React, { useState, useEffect } from 'react';
import { KeenIcon } from '@/components';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { CampaignServiceType } from './types';

interface RankingFieldMapping {
  keyword_field?: string;
  product_id_field?: string;
  title_field?: string;
  link_field?: string;
  rank_field?: string;
}

interface RankingFieldMappingSectionProps {
  campaignFields: Array<{ fieldName: string; description?: string }>;
  serviceType: string | CampaignServiceType;
  value?: RankingFieldMapping;
  onChange?: (mapping: RankingFieldMapping) => void;
  isReadOnly?: boolean;
}

// 순위 데이터 필드 정의
const RANKING_DATA_FIELDS = [
  { value: 'keyword', label: '키워드', description: '검색 키워드' },
  { value: 'product_id', label: '상품코드', description: '상품 고유 ID' }
];

// 서비스별 기본 매핑 템플릿
const DEFAULT_MAPPING_TEMPLATES: Record<string, Record<string, string[]>> = {
  [CampaignServiceType.NAVER_SHOPPING_TRAFFIC]: {
    keyword: ['검색키워드', '키워드', 'keyword'],
    product_id: ['MID', '상품코드', '상품번호', 'mid'],
    title: ['상품명', '제품명', 'product'],
    link: ['상품URL', 'url', '링크'],
    rank: ['현재순위', '순위', 'rank']
  },
  [CampaignServiceType.NAVER_SHOPPING_RANK]: {
    keyword: ['키워드', '검색어', 'keyword'],
    product_id: ['상품코드', 'MID', 'productId'],
    title: ['상품명', '상품이름', 'title'],
    link: ['URL', '상품링크', 'link'],
    rank: ['순위', '랭크', 'rank']
  },
  [CampaignServiceType.NAVER_PLACE_RANK]: {
    keyword: ['검색키워드', '키워드', 'keyword'],
    product_id: ['업체코드', 'PlaceID', 'placeId'],
    title: ['업체명', '상호명', 'placeName'],
    link: ['업체URL', 'url', '링크'],
    rank: ['순위', '랭킹', 'rank']
  }
};

export const RankingFieldMappingSection: React.FC<RankingFieldMappingSectionProps> = ({
  campaignFields,
  serviceType,
  value = {},
  onChange,
  isReadOnly = false
}) => {
  const [mapping, setMapping] = useState<RankingFieldMapping>(value);
  const [autoMappingResults, setAutoMappingResults] = useState<Record<string, { field: string; confidence: number }>>({});

  // 자동 매핑 시도
  useEffect(() => {
    if (campaignFields.length === 0) return;

    const templates = DEFAULT_MAPPING_TEMPLATES[serviceType] || {};
    const results: Record<string, { field: string; confidence: number }> = {};

    // 각 순위 필드에 대해 가장 적합한 캠페인 필드 찾기
    Object.entries(templates).forEach(([rankingField, patterns]) => {
      let bestMatch = { field: '', confidence: 0 };

      campaignFields.forEach(({ fieldName }) => {
        const normalizedFieldName = fieldName.toLowerCase().replace(/[_\-\s]/g, '');
        
        patterns.forEach(pattern => {
          const normalizedPattern = pattern.toLowerCase().replace(/[_\-\s]/g, '');
          
          // 완전 일치
          if (normalizedFieldName === normalizedPattern) {
            if (bestMatch.confidence < 100) {
              bestMatch = { field: fieldName, confidence: 100 };
            }
          }
          // 부분 일치
          else if (normalizedFieldName.includes(normalizedPattern) || normalizedPattern.includes(normalizedFieldName)) {
            const confidence = Math.round((normalizedPattern.length / Math.max(normalizedFieldName.length, normalizedPattern.length)) * 80);
            if (bestMatch.confidence < confidence) {
              bestMatch = { field: fieldName, confidence };
            }
          }
        });
      });

      if (bestMatch.field) {
        results[rankingField] = bestMatch;
      }
    });

    setAutoMappingResults(results);

    // 자동 매핑 결과를 초기값으로 설정 (value가 비어있을 때만)
    if (Object.keys(value).length === 0 && !isReadOnly) {
      const autoMapping: RankingFieldMapping = {};
      Object.entries(results).forEach(([key, result]) => {
        if (result.confidence >= 70) { // 70% 이상 신뢰도만 자동 적용
          autoMapping[key as keyof RankingFieldMapping] = result.field;
        }
      });
      setMapping(autoMapping);
      onChange?.(autoMapping);
    }
  }, [campaignFields, serviceType]);

  const handleFieldChange = (rankingField: keyof RankingFieldMapping, campaignField: string) => {
    const newMapping = { ...mapping, [rankingField]: campaignField };
    setMapping(newMapping);
    onChange?.(newMapping);
  };

  // 순위 관련 서비스인지 확인
  const isRankingService = [
    CampaignServiceType.NAVER_SHOPPING_RANK,
    CampaignServiceType.NAVER_PLACE_RANK,
    CampaignServiceType.NAVER_SHOPPING_TRAFFIC
  ].includes(serviceType as CampaignServiceType);

  if (!isRankingService) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          순위 데이터 필드 매핑
        </h4>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <KeenIcon icon="information-2" className="size-3 inline-block mr-1" />
          캠페인 필드와 순위 데이터 필드를 매핑해주세요. 이 설정은 광고주가 순위 데이터를 볼 때 사용됩니다.
        </p>
      </div>

      <div className="space-y-3">
        {RANKING_DATA_FIELDS.map(({ value: fieldValue, label, description }) => {
          const autoMapping = autoMappingResults[fieldValue];
          const currentValue = mapping[fieldValue as keyof RankingFieldMapping];
          
          return (
            <div key={fieldValue} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-5 text-sm">
                <div className="font-medium text-gray-700 dark:text-gray-300">{label}</div>
                <div className="text-xs text-gray-500">{description}</div>
              </div>
              
              <div className="col-span-1 text-center text-gray-400">
                <KeenIcon icon="arrow-right" className="size-4" />
              </div>
              
              <div className="col-span-6">
                <Select
                  value={currentValue || 'none'}
                  onValueChange={(value) => handleFieldChange(fieldValue as keyof RankingFieldMapping, value === 'none' ? '' : value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="필드 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">선택 안함</SelectItem>
                    {campaignFields.map(({ fieldName }) => (
                      <SelectItem key={fieldName} value={fieldName}>
                        {fieldName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
      </div>

      {isReadOnly && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <KeenIcon icon="lock" className="size-3 inline-block mr-1" />
            매핑 정보는 운영자만 수정할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
};