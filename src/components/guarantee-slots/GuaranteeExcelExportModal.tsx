import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeenIcon } from '@/components';
import { supabase } from '@/supabase';
import { useAuthContext } from '@/auth';
import { toast } from 'sonner';

export interface ExcelColumn {
  field: string;
  label: string;
  enabled: boolean;
  width?: number;
}

export interface ExcelTemplate {
  id?: string;
  name: string;
  columns: ExcelColumn[];
  created_at?: string;
  user_id?: string;
}

interface GuaranteeExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (columns: ExcelColumn[]) => void;
}

// 기본 컬럼 설정
const DEFAULT_COLUMNS: ExcelColumn[] = [
  { field: 'id', label: 'ID', enabled: true, width: 20 },
  { field: 'service_type', label: '서비스타입', enabled: true, width: 15 },
  { field: 'campaign_name', label: '캠페인명', enabled: true, width: 30 },
  { field: 'user_name', label: '요청자명', enabled: true, width: 15 },
  { field: 'user_email', label: '요청자이메일', enabled: true, width: 25 },
  { field: 'main_keyword', label: '메인키워드', enabled: true, width: 20 },
  { field: 'keyword1', label: '서브키워드1', enabled: false, width: 15 },
  { field: 'keyword2', label: '서브키워드2', enabled: false, width: 15 },
  { field: 'keyword3', label: '서브키워드3', enabled: false, width: 15 },
  { field: 'url', label: 'URL', enabled: true, width: 30 },
  { field: 'target_rank', label: '목표순위', enabled: true, width: 10 },
  { field: 'guarantee_period', label: '보장기간', enabled: true, width: 10 },
  { field: 'initial_budget', label: '초기예산', enabled: true, width: 15 },
  { field: 'final_amount', label: '최종협상가', enabled: true, width: 15 },
  { field: 'total_amount', label: '총금액', enabled: true, width: 15 },
  { field: 'quote_status', label: '견적상태', enabled: true, width: 12 },
  { field: 'slot_status', label: '슬롯상태', enabled: true, width: 12 },
  { field: 'start_date', label: '시작일', enabled: true, width: 12 },
  { field: 'end_date', label: '종료일', enabled: true, width: 12 },
  { field: 'created_at', label: '요청일시', enabled: false, width: 20 },
  { field: 'updated_at', label: '수정일시', enabled: false, width: 20 },
  { field: 'approved_at', label: '슬롯승인일', enabled: false, width: 20 },
  { field: 'rejected_at', label: '슬롯거절일', enabled: false, width: 20 },
  { field: 'rejection_reason', label: '거절사유', enabled: false, width: 30 }
];

const GuaranteeExcelExportModal: React.FC<GuaranteeExcelExportModalProps> = ({
  isOpen,
  onClose,
  onExport
}) => {
  const { currentUser } = useAuthContext();
  const [columns, setColumns] = useState<ExcelColumn[]>(DEFAULT_COLUMNS);
  const [templates, setTemplates] = useState<ExcelTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [loading, setLoading] = useState(false);

  // 템플릿 목록 불러오기
  useEffect(() => {
    if (isOpen && currentUser) {
      fetchTemplates();
    }
  }, [isOpen, currentUser]);

  const fetchTemplates = async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('guarantee_excel_templates')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTemplates(data || []);
    } catch (error) {
      console.error('템플릿 목록 조회 실패:', error);
    }
  };

  // 컬럼 활성화 토글
  const toggleColumn = (field: string) => {
    setColumns(prev => prev.map(col =>
      col.field === field ? { ...col, enabled: !col.enabled } : col
    ));
  };

  // 전체 선택/해제
  const toggleAll = (enabled: boolean) => {
    setColumns(prev => prev.map(col => ({ ...col, enabled })));
  };

  // 컬럼 순서 변경
  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const newColumns = [...columns];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < columns.length) {
      [newColumns[index], newColumns[targetIndex]] = [newColumns[targetIndex], newColumns[index]];
      setColumns(newColumns);
    }
  };

  // 템플릿 선택
  const selectTemplate = (templateId: string) => {
    if (templateId === '') {
      setColumns(DEFAULT_COLUMNS);
      setSelectedTemplateId('');
      return;
    }

    const template = templates.find(t => t.id === templateId);
    if (template) {
      setColumns(template.columns);
      setSelectedTemplateId(templateId);
    }
  };

  // 템플릿 저장
  const saveTemplate = async () => {
    if (!currentUser || !templateName.trim()) {
      toast.error('템플릿 이름을 입력하세요.');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('guarantee_excel_templates')
        .insert({
          name: templateName,
          columns: columns,
          user_id: currentUser.id
        });

      if (error) throw error;

      toast.success('템플릿이 저장되었습니다.');
      setTemplateName('');
      setShowSaveTemplate(false);
      fetchTemplates();
    } catch (error) {
      console.error('템플릿 저장 실패:', error);
      toast.error('템플릿 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 템플릿 삭제
  const deleteTemplate = async (templateId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('guarantee_excel_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      toast.success('템플릿이 삭제되었습니다.');
      if (selectedTemplateId === templateId) {
        setSelectedTemplateId('');
        setColumns(DEFAULT_COLUMNS);
      }
      fetchTemplates();
    } catch (error) {
      console.error('템플릿 삭제 실패:', error);
      toast.error('템플릿 삭제에 실패했습니다.');
    }
  };

  // 내보내기 실행
  const handleExport = () => {
    const enabledColumns = columns.filter(col => col.enabled);
    if (enabledColumns.length === 0) {
      toast.error('내보낼 컬럼을 선택하세요.');
      return;
    }

    onExport(columns);
    onClose();
  };

  const enabledCount = columns.filter(col => col.enabled).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col" aria-describedby={undefined}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <KeenIcon icon="file-excel" className="size-5 text-green-600" />
            엑셀 내보내기 설정
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="flex-1 overflow-hidden flex flex-col">
          {/* 템플릿 선택 */}
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <select
                className="select select-bordered select-sm flex-1"
                value={selectedTemplateId}
                onChange={(e) => selectTemplate(e.target.value)}
              >
                <option value="">기본 설정</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSaveTemplate(!showSaveTemplate)}
                className="text-primary"
              >
                <KeenIcon icon="save" className="size-4 me-1" />
                템플릿 저장
              </Button>
              {selectedTemplateId && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteTemplate(selectedTemplateId)}
                  className="text-danger"
                >
                  <KeenIcon icon="trash" className="size-4" />
                </Button>
              )}
            </div>

            {/* 템플릿 저장 폼 */}
            {showSaveTemplate && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Input
                    size="sm"
                    placeholder="템플릿 이름"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && saveTemplate()}
                  />
                  <Button
                    size="sm"
                    onClick={saveTemplate}
                    disabled={loading || !templateName.trim()}
                  >
                    저장
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowSaveTemplate(false);
                      setTemplateName('');
                    }}
                  >
                    취소
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 컬럼 선택 영역 */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1">
              {/* 전체 선택 */}
              <div className="flex items-center justify-between p-2 bg-slate-100 dark:bg-gray-800 rounded sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={enabledCount === columns.length}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                  <span className="text-sm font-medium">
                    전체 선택 ({enabledCount}/{columns.length})
                  </span>
                </div>
              </div>

              {/* 컬럼 목록 */}
              {columns.map((column, index) => (
                <div
                  key={column.field}
                  className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-gray-800 rounded"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={column.enabled}
                      onChange={() => toggleColumn(column.field)}
                    />
                    <span className="text-sm">{column.label}</span>
                    <span className="text-xs text-slate-500 dark:text-gray-500">
                      ({column.field})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="btn btn-icon btn-xs btn-ghost"
                      onClick={() => moveColumn(index, 'up')}
                      disabled={index === 0}
                    >
                      <KeenIcon icon="arrow-up" className="size-3" />
                    </button>
                    <button
                      className="btn btn-icon btn-xs btn-ghost"
                      onClick={() => moveColumn(index, 'down')}
                      disabled={index === columns.length - 1}
                    >
                      <KeenIcon icon="arrow-down" className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogBody>

        <div className="flex-shrink-0 flex justify-end items-center gap-2 p-4 border-t border-slate-200 dark:border-gray-700">
          <Button
            size="sm"
            onClick={handleExport}
            disabled={enabledCount === 0}
            className="btn btn-success btn-sm"
          >
            <KeenIcon icon="download" className="size-4 me-2" />
            내보내기 ({enabledCount}개 컬럼)
          </Button>
          <Button
            variant="light"
            size="sm"
            onClick={onClose}
          >
            취소
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuaranteeExcelExportModal;