import { supabase } from '@/supabase';

export interface FieldConfig {
  label: string;
  placeholder: string;
  order: number;
  required?: boolean;
  hidden?: boolean;
}

export type FieldName = 'main_keyword' | 'mid' | 'url' | 'keyword1' | 'keyword2' | 'keyword3' | 'description' | 'status' | 'created_at';

export interface ServiceFieldMapping {
  main_keyword: FieldConfig;
  mid?: FieldConfig;
  url?: FieldConfig;
  keyword1?: FieldConfig;
  keyword2?: FieldConfig;
  keyword3?: FieldConfig;
  description?: FieldConfig;
  status?: FieldConfig;
  created_at?: FieldConfig;
  [key: string]: FieldConfig | undefined; // 추가 필드를 위한 인덱스 시그니처
}

export interface UIConfig {
  listHeaders: string[];
  listFieldOrder: string[];
  hiddenFields: string[];
  requiredFields: string[];
}

export interface ServiceKeywordFieldMapping {
  id: string;
  service_type: string;
  field_mapping: ServiceFieldMapping;
  ui_config: UIConfig;
  created_at: string;
  updated_at: string;
}

export const fieldMappingService = {
  // 서비스 타입별 필드 매핑 가져오기
  async getFieldMapping(serviceType: string): Promise<ServiceKeywordFieldMapping | null> {
    try {
      const { data, error } = await supabase
        .from('service_keyword_field_mappings')
        .select('*')
        .eq('service_type', serviceType)
        .single();

      if (error) {
        console.error('필드 매핑 조회 오류:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('필드 매핑 조회 실패:', error);
      return null;
    }
  },

  // 순서대로 정렬된 필드 목록 가져오기
  getOrderedFields(fieldMapping: ServiceFieldMapping): Array<{ fieldName: string; config: FieldConfig }> {
    return Object.entries(fieldMapping)
      .filter(([_, config]) => config !== undefined)
      .map(([fieldName, config]) => ({
        fieldName,
        config: config as FieldConfig,
        order: (config as FieldConfig).order || 999
      }))
      .filter(field => !field.config.hidden)
      .sort((a, b) => a.order - b.order)
      .map(({ fieldName, config }) => ({ fieldName, config }));
  },

  // 엑셀 다운로드용 필드 목록 가져오기
  getExcelFields(fieldMapping: ServiceFieldMapping): Array<{ fieldName: string; label: string }> {
    return Object.entries(fieldMapping)
      .filter(([_, config]) => config !== undefined)
      .map(([fieldName, config]) => ({
        fieldName,
        label: (config as FieldConfig).label,
        order: (config as FieldConfig).order || 999,
        hidden: (config as FieldConfig).hidden || false
      }))
      .filter(field => !field.hidden)
      .sort((a, b) => a.order - b.order)
      .map(({ fieldName, label }) => ({ fieldName, label }));
  },

  // 필수 필드 검증
  getRequiredFields(fieldMapping: ServiceFieldMapping): string[] {
    return Object.entries(fieldMapping)
      .filter(([_, config]) => config !== undefined && config.required)
      .map(([fieldName, _]) => fieldName);
  },

  // 기본 필드 매핑 (DB에 없을 경우 사용)
  getDefaultFieldMapping(serviceType: string): ServiceFieldMapping {
    // 기본 매핑
    const defaultMapping: ServiceFieldMapping = {
      main_keyword: {
        label: '메인 키워드',
        placeholder: '메인 키워드를 입력하세요',
        order: 1,
        required: true
      },
      mid: {
        label: 'MID',
        placeholder: 'MID를 입력하세요',
        order: 2
      },
      url: {
        label: 'URL',
        placeholder: 'URL을 입력하세요',
        order: 3
      },
      keyword1: {
        label: '키워드1',
        placeholder: '키워드1을 입력하세요',
        order: 4
      },
      keyword2: {
        label: '키워드2',
        placeholder: '키워드2를 입력하세요',
        order: 5
      },
      keyword3: {
        label: '키워드3',
        placeholder: '키워드3을 입력하세요',
        order: 6
      },
      description: {
        label: '설명',
        placeholder: '설명을 입력하세요',
        order: 7
      }
    };

    // 서비스 타입별 커스터마이징
    if (serviceType.includes('place')) {
      defaultMapping.mid = {
        label: '플레이스 ID',
        placeholder: '플레이스 ID를 입력하세요',
        order: 2,
        required: true
      };
    }

    if (serviceType.includes('shopping')) {
      defaultMapping.url = {
        label: '상품 URL',
        placeholder: '상품 URL을 입력하세요',
        order: 2,
        required: true
      };
    }

    return defaultMapping;
  }
};