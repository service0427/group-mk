import { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

interface FieldConfig {
  label: string;
  placeholder: string;
  order: number;
  required?: boolean;
  hidden?: boolean;
  tooltip?: string;
}

interface ServiceKeywordConfig {
  field_mapping: Record<string, FieldConfig>;
  ui_config: {
    listHeaders: string[];
    listFieldOrder: string[];
    hiddenFields: string[];
    requiredFields: string[];
    description: string;
  };
}

export const useKeywordFieldConfig = (campaignType: string | null | undefined) => {
  const [config, setConfig] = useState<ServiceKeywordConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!campaignType) {
        setConfig(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('service_keyword_field_mappings')
          .select('*')
          .eq('service_type', campaignType)
          .single();

        if (fetchError) {
          console.error('키워드 설정 로드 실패:', fetchError);
          // 기본값 사용
          setConfig(null);
        } else {
          setConfig(data);
        }
      } catch (err) {
        console.error('키워드 설정 로드 중 오류:', err);
        setError('키워드 설정을 불러올 수 없습니다.');
        setConfig(null);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [campaignType]);

  // 필드명에 대한 설정 가져오기
  const getFieldConfig = (fieldName: string): FieldConfig | null => {
    if (!config?.field_mapping) return null;
    return config.field_mapping[fieldName] || null;
  };

  // 순서대로 정렬된 필드 목록
  const orderedFields = config ? 
    Object.entries(config.field_mapping)
      .filter(([, fieldConfig]) => !fieldConfig.hidden)
      .sort((a, b) => (a[1].order || 999) - (b[1].order || 999))
      .map(([fieldName, fieldConfig]) => ({
        fieldName,
        ...fieldConfig
      })) : [];

  // 필수 필드인지 확인
  const isRequired = (fieldName: string): boolean => {
    return config?.ui_config?.requiredFields?.includes(fieldName) || false;
  };

  // 숨김 필드인지 확인
  const isHidden = (fieldName: string): boolean => {
    // 설정이 없는 경우
    if (!config) {
      // field_mapping이 없으면 해당 필드는 숨김 처리
      // 즉, field_mapping에 정의된 필드만 표시
      console.log(`No config for field ${fieldName}, hiding by default`);
      
      // 기본 필드는 항상 표시 (main_keyword, status, created_at, actions)
      const defaultFields = ['main_keyword', 'status', 'created_at', 'actions'];
      if (defaultFields.includes(fieldName)) {
        return false;
      }
      
      // 나머지 필드는 숨김
      return true;
    }
    
    // field_mapping에 없는 필드는 숨김 처리
    const fieldConfig = getFieldConfig(fieldName);
    if (!fieldConfig) {
      // field_mapping에 정의되지 않은 필드는 숨김
      console.log(`Field ${fieldName} not in field_mapping, hiding`);
      return true;
    }
    
    const isHiddenInFieldConfig = fieldConfig?.hidden || false;
    const isHiddenInUIConfig = config?.ui_config?.hiddenFields?.includes(fieldName) || false;
    
    // 디버그 로그
    if (fieldName === 'keyword3') {
      console.log('=== keyword3 hidden check ===');
      console.log('campaignType:', campaignType);
      console.log('config:', config);
      console.log('fieldName:', fieldName);
      console.log('fieldConfig:', fieldConfig);
      console.log('ui_config.hiddenFields:', config?.ui_config?.hiddenFields);
      console.log('isHiddenInFieldConfig:', isHiddenInFieldConfig);
      console.log('isHiddenInUIConfig:', isHiddenInUIConfig);
      console.log('최종 결과 (hidden?):', isHiddenInFieldConfig || isHiddenInUIConfig);
    }
    
    return isHiddenInFieldConfig || isHiddenInUIConfig;
  };

  return { 
    config, 
    loading, 
    error,
    getFieldConfig,
    orderedFields,
    isRequired,
    isHidden
  };
};