========================================
키워드 동적 필드 구현 가이드
========================================

목차:
1. 현재 구조 분석
2. 구현 방법 3가지
3. 필드 순서 지정 기능
4. React 구현 예시
5. 데이터 흐름 및 연동

========================================
1. 현재 구조 분석
========================================

현재 테이블 구조:
- keyword_groups: 사용자별 키워드 그룹 (campaign_type 포함)
- keywords: 그룹 내 키워드들 (고정 필드: main_keyword, keyword1, keyword2, keyword3)
- slots.keyword_id -> keywords.id 참조

문제점:
- 고정된 필드 구조로 서비스별 다른 UI 표현이 어려움
- 서비스마다 다른 라벨과 플레이스홀더 필요

========================================
2. 구현 방법 3가지
========================================

[방법 1] 현재 구조 유지 + UI만 동적 변경 (추천!)
----------------------------------------

-- 서비스별 키워드 필드 매핑 테이블 생성
CREATE TABLE public.service_keyword_field_mappings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    service_type text NOT NULL UNIQUE,
    field_mapping jsonb NOT NULL,
    ui_config jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 네이버 블로그 설정 예시 (order 속성 포함)
INSERT INTO service_keyword_field_mappings (service_type, field_mapping, ui_config) VALUES
('naver_blog', 
'{
    "main_keyword": {
        "label": "메인 키워드", 
        "placeholder": "블로그 주제",
        "order": 1,
        "required": true
    },
    "url": {
        "label": "참조 URL", 
        "placeholder": "https://...",
        "order": 2
    },
    "keyword1": {
        "label": "연관 키워드 1", 
        "placeholder": "관련 검색어",
        "order": 3
    },
    "keyword2": {
        "label": "연관 키워드 2", 
        "placeholder": "추가 검색어",
        "order": 4
    },
    "keyword3": {
        "label": "연관 키워드 3", 
        "placeholder": "보조 검색어",
        "order": 5
    },
    "mid": {
        "label": "네이버 MID", 
        "placeholder": "숫자만 입력",
        "order": 6
    }
}'::jsonb,
'{
    "listHeaders": ["메인 키워드", "참조 URL", "연관1", "연관2", "연관3"],
    "listFieldOrder": ["main_keyword", "url", "keyword1", "keyword2", "keyword3"],
    "hiddenFields": [],
    "requiredFields": ["main_keyword"]
}'::jsonb);

-- 인스타그램 설정 예시 (다른 순서)
INSERT INTO service_keyword_field_mappings (service_type, field_mapping, ui_config) VALUES
('instagram',
'{
    "main_keyword": {
        "label": "메인 해시태그", 
        "placeholder": "#일상",
        "order": 1,
        "required": true
    },
    "keyword1": {
        "label": "서브 해시태그 1", 
        "placeholder": "#데일리",
        "order": 2
    },
    "keyword2": {
        "label": "서브 해시태그 2", 
        "placeholder": "#인스타",
        "order": 3
    },
    "keyword3": {
        "label": "서브 해시태그 3", 
        "placeholder": "#좋아요",
        "order": 4
    },
    "url": {
        "label": "참조 게시물", 
        "placeholder": "인스타그램 URL",
        "order": 5
    },
    "mid": {
        "hidden": true,
        "order": 99
    }
}'::jsonb,
'{
    "listHeaders": ["메인 태그", "서브1", "서브2", "서브3", "참조"],
    "listFieldOrder": ["main_keyword", "keyword1", "keyword2", "keyword3", "url"],
    "hiddenFields": ["mid"],
    "requiredFields": ["main_keyword"]
}'::jsonb);


[방법 2] keywords 테이블에 JSONB 필드 추가
----------------------------------------

-- 동적 필드를 위한 컬럼 추가
ALTER TABLE keywords 
ADD COLUMN IF NOT EXISTS extended_data jsonb DEFAULT '{}';

-- 사용 예시: 인스타그램 추가 데이터
UPDATE keywords 
SET extended_data = '{
    "mention_accounts": ["@account1", "@account2"],
    "location_tag": "서울 강남",
    "content_type": "릴스"
}'::jsonb
WHERE id = 123;


[방법 3] 뷰를 통한 통합 관리
----------------------------------------

-- 키워드와 서비스 설정을 함께 보는 뷰
CREATE OR REPLACE VIEW keyword_display_view AS
SELECT 
    k.*,
    kg.campaign_type as service_type,
    COALESCE(
        sfm.field_mapping->'main_keyword'->>'label',
        'Main Keyword'
    ) as main_keyword_label,
    COALESCE(
        sfm.field_mapping->'keyword1'->>'label',
        'Keyword 1'
    ) as keyword1_label,
    sfm.ui_config->>'listHeaders' as list_headers,
    sfm.ui_config->>'hiddenFields' as hidden_fields
FROM keywords k
JOIN keyword_groups kg ON k.group_id = kg.id
LEFT JOIN service_keyword_field_mappings sfm 
    ON kg.campaign_type = sfm.service_type;

========================================
3. 필드 순서 지정 기능
========================================

[순서대로 필드 가져오는 함수]
----------------------------------------
CREATE OR REPLACE FUNCTION get_ordered_keyword_fields(p_service_type text)
RETURNS TABLE (
    field_name text,
    field_config jsonb,
    field_order int
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        key as field_name,
        value as field_config,
        COALESCE((value->>'order')::int, 999) as field_order
    FROM service_keyword_field_mappings sfm,
         jsonb_each(sfm.field_mapping)
    WHERE sfm.service_type = p_service_type
    ORDER BY COALESCE((value->>'order')::int, 999), key;
END;
$$ LANGUAGE plpgsql;

-- 사용 예시
SELECT * FROM get_ordered_keyword_fields('naver_blog');


[관리자용 순서 변경 함수]
----------------------------------------
-- 단일 필드 순서 변경
CREATE OR REPLACE FUNCTION update_field_order(
    p_service_type text,
    p_field_name text,
    p_new_order int
) RETURNS void AS $$
BEGIN
    UPDATE service_keyword_field_mappings
    SET field_mapping = jsonb_set(
        field_mapping,
        ARRAY[p_field_name, 'order'],
        to_jsonb(p_new_order)
    ),
    updated_at = NOW()
    WHERE service_type = p_service_type;
END;
$$ LANGUAGE plpgsql;

-- 드래그 앤 드롭으로 순서 변경 시 사용
CREATE OR REPLACE FUNCTION bulk_update_field_orders(
    p_service_type text,
    p_field_orders jsonb  -- [{"field": "main_keyword", "order": 1}, ...]
) RETURNS void AS $$
DECLARE
    v_field_order jsonb;
    v_field_mapping jsonb;
BEGIN
    -- 현재 field_mapping 가져오기
    SELECT field_mapping INTO v_field_mapping
    FROM service_keyword_field_mappings
    WHERE service_type = p_service_type;
    
    -- 각 필드의 순서 업데이트
    FOR v_field_order IN SELECT * FROM jsonb_array_elements(p_field_orders)
    LOOP
        v_field_mapping := jsonb_set(
            v_field_mapping,
            ARRAY[v_field_order->>'field', 'order'],
            (v_field_order->>'order')::jsonb
        );
    END LOOP;
    
    -- 업데이트
    UPDATE service_keyword_field_mappings
    SET field_mapping = v_field_mapping,
        updated_at = NOW()
    WHERE service_type = p_service_type;
END;
$$ LANGUAGE plpgsql;

========================================
4. React 구현 예시
========================================

[커스텀 훅 - 순서가 적용된 필드 가져오기]
----------------------------------------
// hooks/useOrderedKeywordFields.ts
export const useOrderedKeywordFields = (serviceType: string) => {
  const [fields, setFields] = useState<OrderedField[]>([]);
  const [uiConfig, setUiConfig] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase
        .from('service_keyword_field_mappings')
        .select('*')
        .eq('service_type', serviceType)
        .single();
      
      if (data) {
        // field_mapping을 순서대로 정렬
        const orderedFields = Object.entries(data.field_mapping)
          .map(([fieldName, config]: [string, FieldConfig]) => ({
            fieldName,
            config,
            order: config.order || 999
          }))
          .filter(field => !field.config.hidden)
          .sort((a, b) => a.order - b.order);
        
        setFields(orderedFields);
        setUiConfig(data.ui_config);
      }
    };
    
    if (serviceType) fetchConfig();
  }, [serviceType]);

  return { fields, uiConfig };
};


[동적 키워드 입력 폼 - 순서 적용]
----------------------------------------
// components/DynamicKeywordForm.tsx
const DynamicKeywordForm = ({ keywordGroup, onSubmit }) => {
  const { fields, uiConfig } = useOrderedKeywordFields(keywordGroup.campaign_type);
  const [formData, setFormData] = useState({});

  if (!fields.length) return <Skeleton />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">
        {keywordGroup.campaign_type} 키워드 입력
      </h3>
      
      {/* 순서대로 필드 렌더링 */}
      {fields.map(({ fieldName, config }) => (
        <div key={fieldName} className="form-group">
          <label className="block text-sm font-medium mb-1">
            {config.label}
            {config.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <Input
            placeholder={config.placeholder}
            value={formData[fieldName] || ''}
            onChange={(e) => setFormData({
              ...formData,
              [fieldName]: e.target.value
            })}
            required={config.required}
          />
        </div>
      ))}
      
      <Button type="submit" className="w-full">저장</Button>
    </form>
  );
};


[동적 키워드 리스트 - 순서 적용]
----------------------------------------
// components/DynamicKeywordList.tsx
const DynamicKeywordList = ({ keywords, campaignType }) => {
  const { fields, uiConfig } = useOrderedKeywordFields(campaignType);
  
  if (!fields.length) return <Skeleton />;
  
  // listFieldOrder가 있으면 사용, 없으면 fields 순서 사용
  const displayFields = useMemo(() => {
    if (uiConfig?.listFieldOrder) {
      return uiConfig.listFieldOrder
        .map(fieldName => fields.find(f => f.fieldName === fieldName))
        .filter(Boolean);
    }
    return fields;
  }, [fields, uiConfig]);
  
  const headers = uiConfig?.listHeaders || displayFields.map(f => f.config.label);
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>번호</TableHead>
          {headers.map((header, idx) => (
            <TableHead key={idx}>{header}</TableHead>
          ))}
          <TableHead>작업</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {keywords.map((keyword, index) => (
          <TableRow key={keyword.id}>
            <TableCell>{index + 1}</TableCell>
            {displayFields.map(({ fieldName }) => (
              <TableCell key={fieldName}>
                {keyword[fieldName] || '-'}
              </TableCell>
            ))}
            <TableCell>
              <Button size="sm" variant="ghost">편집</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};


[관리자용: 필드 순서 변경 컴포넌트]
----------------------------------------
// components/FieldOrderManager.tsx
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const FieldOrderManager = ({ serviceType }) => {
  const { fields: initialFields } = useOrderedKeywordFields(serviceType);
  const [fields, setFields] = useState(initialFields);
  const [isSaving, setIsSaving] = useState(false);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // 새로운 순서 할당
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1
    }));

    setFields(updatedItems);
  };

  const saveOrder = async () => {
    setIsSaving(true);
    
    const fieldOrders = fields.map((field, index) => ({
      field: field.fieldName,
      order: index + 1
    }));

    const { error } = await supabase.rpc('bulk_update_field_orders', {
      p_service_type: serviceType,
      p_field_orders: fieldOrders
    });

    if (!error) {
      toast.success('순서가 저장되었습니다');
    }
    setIsSaving(false);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">
        {serviceType} 필드 순서 관리
      </h3>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="fields">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {fields.map((field, index) => (
                <Draggable
                  key={field.fieldName}
                  draggableId={field.fieldName}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`p-3 mb-2 bg-white border rounded 
                        ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                    >
                      <span>{field.config.label} ({field.fieldName})</span>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      <Button onClick={saveOrder} disabled={isSaving} className="mt-4">
        {isSaving ? '저장 중...' : '순서 저장'}
      </Button>
    </div>
  );
};

========================================
5. slots.input_data와 연동
========================================

[자동 input_data 생성 트리거]
----------------------------------------
CREATE OR REPLACE FUNCTION populate_slot_input_data()
RETURNS TRIGGER AS $$
DECLARE
    v_keyword RECORD;
    v_field_mapping jsonb;
BEGIN
    -- 키워드 정보 가져오기
    SELECT k.*, kg.campaign_type 
    INTO v_keyword
    FROM keywords k
    JOIN keyword_groups kg ON k.group_id = kg.id
    WHERE k.id = NEW.keyword_id;
    
    -- 서비스별 필드 매핑 가져오기
    SELECT field_mapping 
    INTO v_field_mapping
    FROM service_keyword_field_mappings
    WHERE service_type = v_keyword.campaign_type;
    
    -- input_data 구성
    NEW.input_data = jsonb_build_object(
        'keyword_id', NEW.keyword_id,
        'service_type', v_keyword.campaign_type,
        'keywords', jsonb_build_object(
            'main', v_keyword.main_keyword,
            'sub1', v_keyword.keyword1,
            'sub2', v_keyword.keyword2,
            'sub3', v_keyword.keyword3
        ),
        'metadata', jsonb_build_object(
            'url', v_keyword.url,
            'mid', v_keyword.mid,
            'description', v_keyword.description
        ),
        'field_labels', v_field_mapping
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_populate_slot_input_data
BEFORE INSERT ON slots
FOR EACH ROW
WHEN (NEW.keyword_id IS NOT NULL)
EXECUTE FUNCTION populate_slot_input_data();

========================================
TypeScript 타입 정의
========================================

interface FieldConfig {
  label: string;
  placeholder: string;
  hidden?: boolean;
}

interface ServiceFieldMapping {
  main_keyword: FieldConfig;
  keyword1: FieldConfig;
  keyword2: FieldConfig;
  keyword3: FieldConfig;
  url: FieldConfig;
  mid: FieldConfig;
}

interface UIConfig {
  listHeaders: string[];
  hiddenFields: string[];
  requiredFields: string[];
}

interface ServiceKeywordFieldMapping {
  id: string;
  service_type: string;
  field_mapping: ServiceFieldMapping;
  ui_config: UIConfig;
  created_at: string;
}

========================================
사용 예시
========================================

1. 서비스별 설정 추가
   - service_keyword_field_mappings 테이블에 새 서비스 타입 추가

2. 키워드 그룹 생성 시
   - campaign_type 지정 (예: 'naver_blog', 'instagram')

3. 키워드 입력 화면
   - campaign_type에 따라 자동으로 UI 변경
   - 라벨, 플레이스홀더, 필수 필드 등 동적 적용

4. 리스트 화면
   - 서비스별로 다른 헤더 표시
   - 숨김 필드는 자동으로 제외

========================================
장점
========================================

1. 기존 테이블 구조 유지
2. 코드 수정 없이 새 서비스 타입 추가 가능
3. UI와 데이터 로직 분리
4. 향후 확장 용이

========================================
추가 고려사항
========================================

1. 권한 관리
   - service_keyword_field_mappings 테이블은 관리자만 수정

2. 캐싱
   - 서비스별 설정은 자주 변경되지 않으므로 프론트엔드에서 캐싱

3. 마이그레이션
   - 기존 데이터는 그대로 유지되므로 별도 마이그레이션 불필요

4. 검증
   - 필수 필드 검증은 프론트엔드와 백엔드 모두에서 수행

5. 필드 순서 기능
   - order 속성으로 각 필드의 표시 순서 제어
   - 드래그 앤 드롭으로 쉽게 순서 변경
   - 입력 폼과 리스트 뷰 모두 순서 적용
   - listFieldOrder로 리스트 화면 별도 순서 지정 가능