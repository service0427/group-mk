import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogBody,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useCustomToast } from '@/hooks/useCustomToast';
import { KeenIcon } from '@/components';
import { cn } from '@/lib/utils';
import {
  getExcelTemplates,
  createExcelTemplate,
  updateExcelTemplate,
  deleteExcelTemplate
} from '../services/excelTemplateService';
import { Slot } from './types';

// 엑셀 컬럼 정의
export interface ExcelColumn {
  field: string;
  label: string;
  enabled: boolean;
  width?: number;
}

// 엑셀 템플릿 정의
export interface ExcelTemplate {
  id: string;
  name: string;
  columns: ExcelColumn[];
  statusFilter?: string;
  createdAt: string;
  updatedAt: string;
}

// 기본 컬럼 목록 (실제 DB 구조에 맞게 수정)
const AVAILABLE_COLUMNS = [
  { field: 'user_slot_number', label: '슬롯 번호', width: 15 },
  { field: 'campaign_name', label: '캠페인명', width: 30 },
  { field: 'service_type', label: '서비스 타입', width: 20 },
  { field: 'user.full_name', label: '사용자 이름', width: 20 },
  { field: 'input_data.keywords', label: '키워드', width: 40 },
  { field: 'input_data.mainKeyword', label: '메인 키워드', width: 25 },
  { field: 'input_data.keyword1', label: '키워드1', width: 20 },
  { field: 'input_data.keyword2', label: '키워드2', width: 20 },
  { field: 'input_data.keyword3', label: '키워드3', width: 20 },
  { field: 'input_data.url', label: 'URL', width: 50 },
  { field: 'input_data.mid', label: 'MID', width: 20 },
  { field: 'quantity', label: '작업량', width: 15 },
  { field: 'deadline', label: '마감 기한', width: 15 },
  { field: 'input_data.dueDays', label: '작업일수', width: 15 },
  { field: 'start_date', label: '시작일', width: 20 },
  { field: 'end_date', label: '종료일', width: 20 },
  { field: 'created_at', label: '생성일', width: 25 },
  { field: 'submitted_at', label: '제출일', width: 25 },
  { field: 'processed_at', label: '처리일', width: 25 },
  { field: 'min_quantity', label: '최소 수량', width: 15 },
  { field: 'unit_price', label: '단가', width: 15 },
  { field: 'mat_reason', label: '총판 메모', width: 40 },
  { field: 'rejection_reason', label: '반려 사유', width: 40 },
  { field: 'user_reason', label: '사용자 메모', width: 40 },
  { field: 'status', label: '상태', width: 15 },
];

// 기본 선택 컬럼 (비워둠)
const DEFAULT_SELECTED_FIELDS: string[] = [];

// input_data에서 동적 필드 추출
const extractDynamicFields = (slots: Slot[]): { field: string; label: string; width: number }[] => {
  const fieldCountMap = new Map<string, number>();
  
  // 모든 슬롯의 input_data에서 필드 수집 및 빈도 계산
  slots.forEach(slot => {
    if (slot.input_data && typeof slot.input_data === 'object') {
      Object.keys(slot.input_data).forEach(key => {
        // 제외할 필드들
        const excludeFields = [
          // 기본 키워드 관련
          'productName', 'keywords', 'mainKeyword', 'main_keyword', 'keyword1', 'keyword2', 'keyword3',
          'url', 'mid', 'quantity', 'dueDays', 'workCount', 'work_days', 'minimum_purchase',
          // 시스템 필드
          'service_type', 'campaign_name', 'campaignName', 'campaign_id', 'campaignId',
          'is_manual_input', 'keywordId', 'keyword_id', 'expected_deadline',
          'slot_id', 'slotId', 'user_id', 'userId', 'status',
          // 내부 관리 필드
          'mat_id', 'batch_id', 'group_id', 'groupId',
          'processed', 'approved', 'rejected', 'completed',
          'payment_amount', 'payment_status', 'payment_id',
          // 기타 메타데이터
          'version', 'type', 'source', 'target', 'meta',
          'temp', 'tmp', 'test', 'debug'
        ];
        
        if (!excludeFields.includes(key) &&
            !key.endsWith('_file') && !key.endsWith('_fileName') &&
            !key.endsWith('_id') && !key.endsWith('Id') &&
            !key.includes('created_at') && !key.includes('updated_at') &&
            !key.includes('_at') && !key.includes('_by')) {
          fieldCountMap.set(key, (fieldCountMap.get(key) || 0) + 1);
        }
      });
    }
  });
  
  // 최소 사용 빈도 (전체 슬롯의 5% 이상에서 사용된 필드만 표시)
  const minFrequency = Math.max(1, Math.floor(slots.length * 0.05));
  const dynamicFieldsSet = new Set<string>();
  
  // 빈도수가 충분한 필드만 추가
  fieldCountMap.forEach((count, field) => {
    if (count >= minFrequency) {
      dynamicFieldsSet.add(field);
    }
  });

  // 필드명 한글 변환 매핑 (영문 필드만 변환)
  const fieldLabelMap: Record<string, string> = {
    'work_days': '작업일',
    'minimum_purchase': '최소 구매수',
    'ohouse_url': '오늘의집 URL',
    'product_url': '상품 URL',
    'price': '가격',
    'total_price': '총 가격',
    'unit_price': '단가',
    // 영문 필드명만 추가
  };

  // Set을 배열로 변환하고 필드 정보 생성
  return Array.from(dynamicFieldsSet).map(field => ({
    field: `input_data.${field}`,
    label: fieldLabelMap[field] || field,
    width: 20
  }));
};

interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (template: ExcelTemplate, filters?: { status?: string }) => void;
  slots?: Slot[]; // 슬롯 데이터 추가
}

const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  slots = [],
}) => {
  const { showSuccess, showError } = useCustomToast();
  const [templates, setTemplates] = useState<ExcelTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [templateName, setTemplateName] = useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [selectedAvailable, setSelectedAvailable] = useState<string[]>([]);
  const [selectedChosen, setSelectedChosen] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDynamicFields, setShowDynamicFields] = useState<boolean>(true); // 동적 필드 표시 여부
  const [columnSearchTerm, setColumnSearchTerm] = useState<string>(''); // 컬럼 검색어

  // 저장된 템플릿 불러오기 (DB에서)
  useEffect(() => {
    const loadTemplates = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      try {
        // 템플릿 목록 불러오기 (기본 템플릿 생성하지 않음)
        const loadedTemplates = await getExcelTemplates();
        setTemplates(loadedTemplates);
        
        // 템플릿이 없으면 새 템플릿 생성 모드로
        if (loadedTemplates.length === 0) {
          setSelectedTemplateId('new');
          setIsCreatingNew(true);
          setTemplateName('');
        } else {
          // 템플릿이 있어도 기본값은 선택 안됨 상태
          setSelectedTemplateId('');
          setIsCreatingNew(false);
        }
        
        // 기본 컬럼과 동적 필드 합치기
        const dynamicFields = extractDynamicFields(slots);
        const allColumns = [...AVAILABLE_COLUMNS, ...dynamicFields];
        
        // 컬럼은 항상 비어있는 상태로 시작
        setSelectedColumns([]);
        setAvailableColumns(allColumns.map(col => col.field));
      } catch (error: any) {
        console.error('템플릿 로드 오류:', error);
        showError('템플릿을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, [isOpen, showError]);

  // 템플릿 선택 시
  const handleTemplateSelect = (templateId: string) => {
    if (templateId === 'new') {
      setIsCreatingNew(true);
      setTemplateName('');
      const dynamicFields = extractDynamicFields(slots);
      const allColumns = [...AVAILABLE_COLUMNS, ...dynamicFields];
      setSelectedColumns([]);
      setAvailableColumns(allColumns.map(col => col.field));
      setSelectedTemplateId('new'); // 'new'로 설정
      return;
    }

    setSelectedTemplateId(templateId);
    setIsCreatingNew(false);
    
    const template = templates.find(t => t.id === templateId);
    if (template) {
      // 저장된 컬럼들만 선택된 컬럼으로 설정
      const selectedFields = template.columns.map(col => col.field);
      setSelectedColumns(selectedFields);
      
      // 기본 컬럼과 동적 필드 합치기
      const dynamicFields = extractDynamicFields(slots);
      const allColumns = [...AVAILABLE_COLUMNS, ...dynamicFields];
      
      setAvailableColumns(
        allColumns
          .filter(col => !selectedFields.includes(col.field))
          .map(col => col.field)
      );
      setTemplateName(template.name);
      // 상태 필터도 로드
      setStatusFilter(template.statusFilter || 'all');
    }
  };

  // 선택된 컬럼을 오른쪽으로 이동
  const moveToSelected = () => {
    const toMove = selectedAvailable.filter(key => availableColumns.includes(key));
    if (toMove.length > 0) {
      setSelectedColumns([...selectedColumns, ...toMove]);
      setAvailableColumns(availableColumns.filter(key => !toMove.includes(key)));
      setSelectedAvailable([]);
    }
  };

  // 선택된 컬럼을 왼쪽으로 이동
  const moveToAvailable = () => {
    const toMove = selectedChosen.filter(key => selectedColumns.includes(key));
    if (toMove.length > 0) {
      setAvailableColumns([...availableColumns, ...toMove]);
      setSelectedColumns(selectedColumns.filter(key => !toMove.includes(key)));
      setSelectedChosen([]);
    }
  };

  // 모든 컬럼을 오른쪽으로 이동
  const moveAllToSelected = () => {
    setSelectedColumns([...selectedColumns, ...availableColumns]);
    setAvailableColumns([]);
    setSelectedAvailable([]);
  };

  // 모든 컬럼을 왼쪽으로 이동
  const moveAllToAvailable = () => {
    setAvailableColumns([...availableColumns, ...selectedColumns]);
    setSelectedColumns([]);
    setSelectedChosen([]);
  };

  // 선택된 컬럼 위로 이동
  const moveUp = () => {
    if (selectedChosen.length !== 1) return;
    const index = selectedColumns.indexOf(selectedChosen[0]);
    if (index > 0) {
      const newColumns = [...selectedColumns];
      [newColumns[index - 1], newColumns[index]] = [newColumns[index], newColumns[index - 1]];
      setSelectedColumns(newColumns);
    }
  };

  // 선택된 컬럼 아래로 이동
  const moveDown = () => {
    if (selectedChosen.length !== 1) return;
    const index = selectedColumns.indexOf(selectedChosen[0]);
    if (index < selectedColumns.length - 1) {
      const newColumns = [...selectedColumns];
      [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
      setSelectedColumns(newColumns);
    }
  };

  // 컬럼 선택 핸들러
  const handleAvailableSelect = (columnKey: string, isCtrlKey: boolean) => {
    if (isCtrlKey) {
      setSelectedAvailable(prev => 
        prev.includes(columnKey) 
          ? prev.filter(k => k !== columnKey)
          : [...prev, columnKey]
      );
    } else {
      setSelectedAvailable([columnKey]);
    }
  };

  const handleChosenSelect = (columnKey: string, isCtrlKey: boolean) => {
    if (isCtrlKey) {
      setSelectedChosen(prev => 
        prev.includes(columnKey) 
          ? prev.filter(k => k !== columnKey)
          : [...prev, columnKey]
      );
    } else {
      setSelectedChosen([columnKey]);
    }
  };

  // 컬럼 라벨 가져오기
  const getColumnLabel = (field: string) => {
    // 기본 컬럼과 동적 필드 합치기
    const dynamicFields = extractDynamicFields(slots);
    const allColumns = [...AVAILABLE_COLUMNS, ...dynamicFields];
    return allColumns.find(col => col.field === field)?.label || field;
  };

  // 템플릿 저장 (DB로)
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      showError('템플릿 이름을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      // 기본 컬럼과 동적 필드 합치기
      const dynamicFields = extractDynamicFields(slots);
      const allColumns = [...AVAILABLE_COLUMNS, ...dynamicFields];
      
      // 선택된 컬럼만 저장
      const columns: ExcelColumn[] = selectedColumns.map(field => {
        const col = allColumns.find(c => c.field === field)!;
        return {
          field: col.field,
          label: col.label,
          enabled: true,
          width: col.width
        };
      });

      let savedTemplate: ExcelTemplate;
      
      if (isCreatingNew) {
        // 새 템플릿 생성
        savedTemplate = await createExcelTemplate(templateName, columns, statusFilter);
        setTemplates([...templates, savedTemplate]);
        setSelectedTemplateId(savedTemplate.id);
        setIsCreatingNew(false);
      } else {
        // 기존 템플릿 수정
        
        savedTemplate = await updateExcelTemplate(selectedTemplateId, templateName, columns, statusFilter);
        setTemplates(templates.map(t =>
          t.id === selectedTemplateId ? savedTemplate : t
        ));
      }
      
      showSuccess('템플릿이 저장되었습니다.');
    } catch (error: any) {
      console.error('템플릿 저장 오류:', error);
      showError(error.message || '템플릿 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 템플릿 삭제 (DB에서)
  const handleDeleteTemplate = async () => {
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    if (!confirm(`'${template.name}' 템플릿을 삭제하시겠습니까?`)) {
      return;
    }

    setIsSaving(true);
    try {
      await deleteExcelTemplate(selectedTemplateId);
      
      const updatedTemplates = templates.filter(t => t.id !== selectedTemplateId);
      setTemplates(updatedTemplates);
      
      // 기본 템플릿으로 전환
      const defaultTemplate = updatedTemplates.find(t => t.name === '기본 템플릿');
      if (defaultTemplate) {
        handleTemplateSelect(defaultTemplate.id);
      }
      
      showSuccess('템플릿이 삭제되었습니다.');
    } catch (error: any) {
      console.error('템플릿 삭제 오류:', error);
      showError(error.message || '템플릿 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 엑셀 다운로드
  const handleExport = () => {
    if (selectedColumns.length === 0) {
      showError('최소 1개 이상의 컬럼을 선택해주세요.');
      return;
    }

    // 기본 컬럼과 동적 필드 합치기
    const dynamicFields = extractDynamicFields(slots);
    const allColumns = [...AVAILABLE_COLUMNS, ...dynamicFields];
    
    // 현재 컬럼 설정을 ExcelColumn 형식으로 변환
    const columns: ExcelColumn[] = selectedColumns.map(field => {
      const col = allColumns.find(c => c.field === field)!;
      return { ...col, enabled: true };
    });

    const exportTemplate: ExcelTemplate = {
      id: selectedTemplateId || 'custom',
      name: templateName || '사용자 정의',
      columns: columns,
      statusFilter: statusFilter,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onExport(exportTemplate);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[900px] max-h-[90vh] flex flex-col p-0 overflow-hidden" aria-describedby={undefined}>
        <DialogHeader className="bg-background py-4 px-5 border-b sticky top-0 z-10 shadow-sm">
          <DialogTitle className="text-lg font-semibold text-foreground flex items-center">
            <KeenIcon icon="file" className="mr-2 text-primary size-5" />
            엑셀 내보내기 설정
          </DialogTitle>
        </DialogHeader>
        
        <DialogBody className="flex-1 overflow-auto py-5 px-5">
          {/* 템플릿 선택 영역 */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">템플릿 선택</label>
              <div className="flex gap-2">
                <Select
                  value={isCreatingNew ? 'new' : selectedTemplateId}
                  onValueChange={handleTemplateSelect}
                  disabled={isLoading}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="템플릿을 선택해주세요" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5} className="z-[9999] max-h-[300px] overflow-y-auto bg-background border shadow-lg">
                    <SelectItem value="new">
                      <div className="flex items-center gap-2">
                        <KeenIcon icon="plus" className="size-4" />
                        새 템플릿 만들기
                      </div>
                    </SelectItem>
                    {templates && templates.length > 0 && (
                      <>
                        <Separator className="my-1" />
                        {templates.map((template, index) => (
                          <SelectItem key={`template-${template.id}-${index}`} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      // 새 템플릿 생성 모드
                      setIsCreatingNew(true);
                      setTemplateName('');
                      setSelectedColumns([]);
                      
                      // 기본 컬럼과 동적 필드 합치기
                      const dynamicFields = extractDynamicFields(slots);
                      const allColumns = [...AVAILABLE_COLUMNS, ...dynamicFields];
                      setAvailableColumns(allColumns.map(col => col.field));
                    }}
                    title="새 템플릿 추가"
                    className="border-green-200 hover:border-green-400 hover:bg-green-50 text-green-600 hover:text-green-700"
                  >
                    <KeenIcon icon="plus" className="size-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      // 현재 템플릿 복사
                      const currentTemplate = templates.find(t => t.id === selectedTemplateId);
                      if (currentTemplate) {
                        setIsCreatingNew(true);
                        setTemplateName(`${currentTemplate.name}_복사본`);
                        
                        // 현재 템플릿의 컬럼 설정 복사
                        const selectedFields = currentTemplate.columns.map(col => col.field);
                        setSelectedColumns(selectedFields);
                        
                        // 기본 컬럼과 동적 필드 합치기
                        const dynamicFields = extractDynamicFields(slots);
                        const allColumns = [...AVAILABLE_COLUMNS, ...dynamicFields];
                        
                        setAvailableColumns(
                          allColumns
                            .filter(col => !selectedFields.includes(col.field))
                            .map(col => col.field)
                        );
                      }
                    }}
                    disabled={!selectedTemplateId || selectedTemplateId === '' || isCreatingNew}
                    title="템플릿 복사"
                    className="border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <KeenIcon icon="copy" className="size-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDeleteTemplate}
                    disabled={isSaving || !selectedTemplateId || isCreatingNew}
                    title="템플릿 삭제"
                    className="border-red-200 hover:border-red-400 hover:bg-red-50 text-red-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <KeenIcon icon="trash" className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* 템플릿 이름 */}
            {selectedTemplateId && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">템플릿 이름</label>
                  {isCreatingNew && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsCreatingNew(false);
                        // 이전 템플릿으로 돌아가기
                        if (templates.length > 0) {
                          const firstTemplate = templates[0];
                          handleTemplateSelect(firstTemplate.id);
                        }
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <KeenIcon icon="cross" className="size-3 mr-1" />
                      취소
                    </Button>
                  )}
                </div>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="템플릿 이름을 입력하세요"
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* 템플릿 선택 안내 */}
          {!selectedTemplateId && !isLoading && templates.length > 0 && (
            <div className="text-center py-12 text-gray-500">
              <KeenIcon icon="information-2" className="size-12 mx-auto mb-3 text-gray-400" />
              <p className="text-base font-medium">템플릿을 선택해주세요</p>
              <p className="text-sm mt-1">상단 드롭다운에서 템플릿을 선택하거나 새로 만들 수 있습니다.</p>
            </div>
          )}

          {/* 컬럼 선택 영역 */}
          {selectedTemplateId && !isLoading && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">컬럼 선택</label>
                <div className="grid grid-cols-[1fr,auto,1fr] gap-4">
                  {/* 사용 가능한 컬럼 */}
                  <div className="space-y-2">
                    {/* 검색 input */}
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="컬럼 검색..."
                        value={columnSearchTerm}
                        onChange={(e) => setColumnSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 h-8 text-sm"
                      />
                      <KeenIcon 
                        icon="search" 
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400"
                      />
                      {columnSearchTerm && (
                        <button
                          type="button"
                          onClick={() => setColumnSearchTerm('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <KeenIcon icon="cross" className="size-3.5" />
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-t-md">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        사용 가능한 컬럼 ({
                          availableColumns.filter(field => {
                            // 검색어 필터
                            if (columnSearchTerm) {
                              const label = getColumnLabel(field).toLowerCase();
                              const searchLower = columnSearchTerm.toLowerCase();
                              if (!label.includes(searchLower)) {
                                return false;
                              }
                            }
                            // 동적 필드 필터
                            if (!showDynamicFields && field.startsWith('input_data.')) {
                              const basicInputFields = [
                                'input_data.keywords', 'input_data.mainKeyword', 
                                'input_data.keyword1', 'input_data.keyword2', 'input_data.keyword3',
                                'input_data.url', 'input_data.mid', 'input_data.dueDays'
                              ];
                              return basicInputFields.includes(field);
                            }
                            return true;
                          }).length
                        })
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowDynamicFields(!showDynamicFields)}
                          className={cn(
                            "text-xs px-2 py-1 rounded transition-colors",
                            showDynamicFields 
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400" 
                              : "bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-400"
                          )}
                        >
                          <KeenIcon icon="filter" className="size-3 inline mr-1" />
                          사용자 입력 필드 {showDynamicFields ? '포함' : '제외'}
                        </button>
                      </div>
                    </div>
                    <div className="border rounded-b-md overflow-hidden">
                      <ScrollArea className="h-[350px]">
                        <div className="p-2 space-y-1">
                          {availableColumns
                            .filter(field => {
                              // 검색어 필터
                              if (columnSearchTerm) {
                                const label = getColumnLabel(field).toLowerCase();
                                const searchLower = columnSearchTerm.toLowerCase();
                                if (!label.includes(searchLower)) {
                                  return false;
                                }
                              }
                              // 동적 필드 표시 여부에 따라 필터링
                              if (!showDynamicFields && field.startsWith('input_data.')) {
                                // input_data로 시작하지만 기본 필드는 표시
                                const basicInputFields = [
                                  'input_data.keywords', 'input_data.mainKeyword', 
                                  'input_data.keyword1', 'input_data.keyword2', 'input_data.keyword3',
                                  'input_data.url', 'input_data.mid', 'input_data.dueDays'
                                ];
                                return basicInputFields.includes(field);
                              }
                              return true;
                            })
                            .map((field, index) => (
                            <div
                              key={field}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
                                selectedAvailable.includes(field) && "bg-blue-50 dark:bg-blue-900/30"
                              )}
                              onClick={(e) => handleAvailableSelect(field, e.ctrlKey || e.metaKey)}
                            >
                              <span className="text-sm text-gray-500 dark:text-gray-400 w-6 text-right">
                                {index + 1}
                              </span>
                              <span className="text-sm flex-1">
                                {getColumnLabel(field)}
                                {field.startsWith('input_data.') && 
                                 !['input_data.keywords', 'input_data.mainKeyword', 
                                   'input_data.keyword1', 'input_data.keyword2', 'input_data.keyword3',
                                   'input_data.url', 'input_data.mid', 'input_data.dueDays'].includes(field) && (
                                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(사용자 입력)</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>

                  {/* 이동 버튼 */}
                  <div className="flex flex-col justify-center gap-2 px-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={moveAllToSelected}
                      disabled={availableColumns.length === 0}
                      title="모두 선택"
                      className="h-8 w-8"
                    >
                      <KeenIcon icon="double-arrow-next" className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={moveToSelected}
                      disabled={selectedAvailable.length === 0}
                      title="선택 항목 추가"
                      className="h-8 w-8"
                    >
                      <KeenIcon icon="arrow-right" className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={moveToAvailable}
                      disabled={selectedChosen.length === 0}
                      title="선택 항목 제거"
                      className="h-8 w-8"
                    >
                      <KeenIcon icon="arrow-left" className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={moveAllToAvailable}
                      disabled={selectedColumns.length === 0}
                      title="모두 제거"
                      className="h-8 w-8"
                    >
                      <KeenIcon icon="double-arrow-left" className="size-4" />
                    </Button>
                    
                    <Separator className="my-2" />
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={moveUp}
                      disabled={selectedChosen.length !== 1 || selectedColumns.indexOf(selectedChosen[0]) === 0}
                      title="위로 이동"
                      className="h-8 w-8"
                    >
                      <KeenIcon icon="arrow-up" className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={moveDown}
                      disabled={selectedChosen.length !== 1 || selectedColumns.indexOf(selectedChosen[0]) === selectedColumns.length - 1}
                      title="아래로 이동"
                      className="h-8 w-8"
                    >
                      <KeenIcon icon="arrow-down" className="size-4" />
                    </Button>
                  </div>

                  {/* 선택된 컬럼 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-3 py-2 bg-primary/10 dark:bg-primary/20 rounded-t-md">
                      <span className="text-sm font-medium text-primary">
                        선택된 컬럼 ({selectedColumns.length})
                      </span>
                      <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                      >
                        <SelectTrigger className="h-7 text-xs w-36">
                          <SelectValue placeholder="상태: 전체" />
                        </SelectTrigger>
                        <SelectContent position="popper" sideOffset={5} className="z-[9999]">
                          <SelectItem value="all">상태: 전체</SelectItem>
                          <SelectItem value="pending">대기중</SelectItem>
                          <SelectItem value="approved">승인됨</SelectItem>
                          <SelectItem value="rejected">반려됨</SelectItem>
                          <SelectItem value="success">완료</SelectItem>
                          <SelectItem value="refund">환불</SelectItem>
                          <SelectItem value="pending_user_confirm">확인대기</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="border border-primary/30 rounded-b-md overflow-hidden">
                      <ScrollArea className="h-[350px]">
                        <div className="p-2 space-y-1">
                          {selectedColumns.map((field, index) => (
                            <div
                              key={field}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
                                selectedChosen.includes(field) && "bg-blue-50 dark:bg-blue-900/30"
                              )}
                              onClick={(e) => handleChosenSelect(field, e.ctrlKey || e.metaKey)}
                            >
                              <span className="text-sm text-primary font-medium w-6 text-right">
                                {index + 1}
                              </span>
                              <span className="text-sm flex-1">{getColumnLabel(field)}</span>
                            </div>
                          ))}
                          {selectedColumns.length === 0 && (
                            <div className="text-center py-8 text-sm text-gray-500">
                              컬럼을 선택해주세요
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                    💡 사용 안내
                  </p>
                  <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                    <li>• <strong>Ctrl(Cmd) 키</strong>를 누른 상태로 클릭하여 여러 개를 선택할 수 있습니다.</li>
                    <li>• 템플릿을 저장하지 않으면 <strong>매번 컬럼을 다시 선택</strong>해야 합니다.</li>
                    <li>• 자주 사용하는 설정은 템플릿으로 저장해두세요.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <KeenIcon icon="loading" className="size-6 animate-spin mr-2" />
              <span>템플릿을 불러오는 중...</span>
            </div>
          )}
        </DialogBody>

        {/* 푸터 */}
        <DialogFooter className="py-4 px-5 border-t bg-gray-50 dark:bg-gray-800/50 sticky bottom-0 z-10 shadow-sm">
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              취소
            </Button>
            
            {selectedTemplateId && !isLoading && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSaveTemplate}
                  disabled={!templateName.trim() || isSaving}
                  className="border-blue-300 hover:bg-blue-50 text-blue-600 hover:text-blue-700"
                >
                  {isSaving ? (
                    <>
                      <KeenIcon icon="loading" className="size-4 mr-2 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <KeenIcon icon="disk" className="size-4 mr-2" />
                      템플릿 저장
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleExport}
                  disabled={selectedColumns.length === 0 || isSaving}
                  className="bg-success hover:bg-success/90 text-white"
                >
                  <KeenIcon icon="cloud-download" className="size-4 mr-2" />
                  엑셀 다운로드
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelExportModal;