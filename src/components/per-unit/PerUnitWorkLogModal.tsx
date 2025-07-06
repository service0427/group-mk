import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { KeenIcon } from '@/components';
import { supabase } from '@/supabase';
import { useAuthContext } from '@/auth';
import { useCustomToast } from '@/hooks/useCustomToast';
import { formatDateKorean } from '@/utils/Date';

interface PerUnitWorkLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: any;
  onSuccess: () => void;
}

interface WorkLog {
  id: string;
  work_date: string;
  completed_count: number;
  work_urls: string[];
  notes: string;
  status: string;
  created_at: string;
}

export const PerUnitWorkLogModal: React.FC<PerUnitWorkLogModalProps> = ({
  isOpen,
  onClose,
  slot,
  onSuccess
}) => {
  const { currentUser } = useAuthContext();
  const { showSuccess, showError } = useCustomToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  
  const [formData, setFormData] = useState({
    workDate: new Date().toISOString().split('T')[0],
    completedQuantity: '',
    workUrls: '',
    notes: ''
  });

  // 작업 로그 조회
  const fetchWorkLogs = async () => {
    if (!slot?.id) return;

    try {
      setIsLoadingLogs(true);
      const { data, error } = await supabase
        .from('per_unit_work_logs')
        .select('*')
        .eq('slot_id', slot.id)
        .order('work_date', { ascending: false });

      if (error) throw error;

      setWorkLogs(data || []);
    } catch (error) {
      console.error('작업 로그 조회 오류:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWorkLogs();
    }
  }, [isOpen, slot?.id]);

  // 남은 수량 계산
  const getRemainingQuantity = () => {
    const totalCompleted = workLogs.reduce((sum, log) => {
      if (log.status === 'approved') {
        return sum + log.completed_count;
      }
      return sum;
    }, 0);
    return slot.quantity - slot.completed_quantity;
  };

  // 작업 실적 등록
  const handleSubmit = async () => {
    if (!formData.workDate || !formData.completedQuantity) {
      showError('작업일과 완료 수량을 입력해주세요.');
      return;
    }

    const completedQty = parseInt(formData.completedQuantity);
    const remaining = getRemainingQuantity();

    if (completedQty <= 0) {
      showError('완료 수량은 0보다 커야 합니다.');
      return;
    }

    if (completedQty > remaining) {
      showError(`남은 수량(${remaining}건)을 초과할 수 없습니다.`);
      return;
    }

    try {
      setIsProcessing(true);

      // 작업 URL 파싱
      const urls = formData.workUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      // 작업 로그 생성
      const { data: logData, error: logError } = await supabase
        .from('per_unit_work_logs')
        .insert({
          slot_id: slot.id,
          work_date: formData.workDate,
          completed_count: completedQty,
          work_urls: urls,
          notes: formData.notes,
          status: 'pending',
          created_by: currentUser?.id
        })
        .select()
        .single();

      if (logError) throw logError;

      // 슬롯의 completed_quantity 업데이트
      const newCompletedQuantity = slot.completed_quantity + completedQty;
      const isComplete = newCompletedQuantity >= slot.quantity;

      const { error: updateError } = await supabase
        .from('per_unit_slots')
        .update({
          completed_quantity: newCompletedQuantity,
          status: isComplete ? 'completed' : 'in_progress',
          completed_at: isComplete ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', slot.id);

      if (updateError) throw updateError;

      showSuccess('작업 실적이 등록되었습니다.');
      onSuccess();
    } catch (error) {
      console.error('작업 실적 등록 오류:', error);
      showError('작업 실적 등록 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 작업 로그 상태별 색상
  const getLogStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'approved':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // 작업 로그 상태 라벨
  const getLogStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '검토중';
      case 'approved':
        return '승인됨';
      case 'rejected':
        return '거절됨';
      default:
        return '알 수 없음';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>작업 실적 입력</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 슬롯 정보 */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-3">슬롯 정보</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">캠페인:</span>
                <span className="ml-2 font-medium">
                  {slot.per_unit_slot_request?.per_unit_campaign?.campaign?.campaign_name || '알 수 없음'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">전체 수량:</span>
                <span className="ml-2 font-medium">{slot.quantity.toLocaleString()}건</span>
              </div>
              <div>
                <span className="text-muted-foreground">완료 수량:</span>
                <span className="ml-2 font-medium">{slot.completed_quantity.toLocaleString()}건</span>
              </div>
              <div>
                <span className="text-muted-foreground">남은 수량:</span>
                <span className="ml-2 font-medium text-primary">
                  {getRemainingQuantity().toLocaleString()}건
                </span>
              </div>
            </div>
          </div>

          {/* 작업 실적 입력 폼 */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">작업일</label>
              <Input
                type="date"
                value={formData.workDate}
                onChange={(e) => setFormData(prev => ({ ...prev, workDate: e.target.value }))}
                max={formatDate(new Date())}
              />
            </div>

            <div>
              <label className="text-sm font-medium">완료 수량</label>
              <Input
                type="number"
                value={formData.completedQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, completedQuantity: e.target.value }))}
                placeholder="완료된 작업 수량"
                min="1"
                max={getRemainingQuantity()}
              />
              <p className="text-xs text-muted-foreground mt-1">
                최대 {getRemainingQuantity()}건까지 입력 가능합니다.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">작업 URL (선택)</label>
              <Textarea
                value={formData.workUrls}
                onChange={(e) => setFormData(prev => ({ ...prev, workUrls: e.target.value }))}
                placeholder="작업 URL을 한 줄에 하나씩 입력하세요."
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">메모 (선택)</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="작업 관련 메모"
                rows={2}
              />
            </div>
          </div>

          {/* 이전 작업 로그 */}
          {workLogs.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">이전 작업 내역</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {workLogs.map((log) => (
                  <div key={log.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {log.work_date} - {log.completed_count}건
                        </div>
                        {log.notes && (
                          <div className="text-xs text-muted-foreground mt-1">{log.notes}</div>
                        )}
                      </div>
                      <span className={`text-xs font-medium ${getLogStatusColor(log.status)}`}>
                        {getLogStatusLabel(log.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isProcessing || getRemainingQuantity() === 0}>
            {isProcessing ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                처리 중...
              </>
            ) : (
              <>
                <KeenIcon icon="check" className="size-4 mr-2" />
                등록하기
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};