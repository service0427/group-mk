import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slot, WorkInputFormData } from '../types';
import { getTodayDateString, getServiceTypeName } from '../services/workInputService';
import { toast } from 'sonner';

interface WorkInputFormProps {
  slots: Slot[];
  onSubmit: (data: WorkInputFormData) => Promise<void>;
  isLoading: boolean;
  selectedMatId?: string;
}

export const WorkInputForm: React.FC<WorkInputFormProps> = ({ slots, onSubmit, isLoading, selectedMatId }) => {
  const [formData, setFormData] = useState<WorkInputFormData>({
    slot_id: '',
    date: getTodayDateString(),
    work_cnt: 0,
    notes: ''
  });

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (slots.length > 0 && !formData.slot_id) {
      // 선택된 MatId가 있으면 해당 MatId를 가진 첫 번째 슬롯을 선택
      if (selectedMatId) {
        const matchingSlot = slots.find(slot => slot.mat_id === selectedMatId);
        if (matchingSlot) {
          setFormData(prev => ({ ...prev, slot_id: matchingSlot.id }));
          setSelectedSlot(matchingSlot);
          return;
        }
      }
      // 없으면 첫 번째 슬롯 선택
      setFormData(prev => ({ ...prev, slot_id: slots[0].id }));
      setSelectedSlot(slots[0]);
    }
  }, [slots, selectedMatId]);

  useEffect(() => {
    if (formData.slot_id) {
      const slot = slots.find(s => s.id === formData.slot_id);
      setSelectedSlot(slot || null);
    }
  }, [formData.slot_id, slots]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.slot_id) {
      newErrors.slot_id = '슬롯을 선택해주세요.';
    }

    if (!formData.date) {
      newErrors.date = '작업 일자를 선택해주세요.';
    } else {
      // 작업 시작일과 종료일 사이인지 확인
      if (selectedSlot?.start_date && new Date(formData.date) < new Date(selectedSlot.start_date)) {
        newErrors.date = '작업 시작일보다 이전 날짜는 선택할 수 없습니다.';
      }
      if (selectedSlot?.end_date && new Date(formData.date) > new Date(selectedSlot.end_date)) {
        newErrors.date = '작업 종료일보다 이후 날짜는 선택할 수 없습니다.';
      }
    }

    if (!formData.work_cnt || formData.work_cnt <= 0) {
      newErrors.work_cnt = '작업 횟수는 0보다 커야 합니다.';
    }

    // quantity 체크
    if (selectedSlot?.quantity && formData.work_cnt > selectedSlot.quantity) {
      newErrors.work_cnt = `작업 횟수는 총 작업수(${selectedSlot.quantity})를 초과할 수 없습니다.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numberValue = value === '' ? 0 : parseInt(value, 10);
    setFormData(prev => ({ ...prev, [name]: numberValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('입력한 정보를 확인해주세요.');
      return;
    }

    try {
      await onSubmit(formData);
      // 성공 시 폼 초기화
      setFormData({
        slot_id: formData.slot_id, // 선택된 슬롯은 유지
        date: getTodayDateString(),
        work_cnt: 0,
        notes: ''
      });
    } catch (error) {
      // 에러는 onSubmit에서 처리하도록 넘김
    }
  };

  // 서비스 타입 이름 가져오기
  const getServiceTypeNameFromSlot = (slot: Slot | null) => {
    if (!slot || !slot.service_type) return '';
    return getServiceTypeName(slot.service_type);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>작업 정보 입력</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium mb-1.5">캠페인 선택</div>
            <Select 
              name="slot_id" 
              value={formData.slot_id} 
              onValueChange={(value) => handleSelectChange('slot_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="캠페인을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {slots.map(slot => (
                  <SelectItem key={slot.id} value={slot.id}>
                    {slot.campaign_name || `캠페인 #${slot.id.substring(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.slot_id && <p className="text-sm text-red-500">{errors.slot_id}</p>}
            
            {selectedSlot && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm">
                <p><span className="font-medium">서비스 유형:</span> {getServiceTypeNameFromSlot(selectedSlot)}</p>
                <p><span className="font-medium">상태:</span> {selectedSlot.status}</p>
                <p><span className="font-medium">작업수:</span> {selectedSlot.quantity || '미지정'}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium mb-1.5">작업 일자</div>
            <Input 
              type="date" 
              id="date" 
              name="date" 
              value={formData.date} 
              onChange={handleChange}
              max={getTodayDateString()} // 오늘 이후 날짜는 선택할 수 없음
            />
            {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium mb-1.5">작업 횟수</div>
            <Input 
              type="number" 
              id="work_cnt" 
              name="work_cnt" 
              value={formData.work_cnt === 0 ? '' : formData.work_cnt} 
              onChange={handleNumberChange}
              min="1"
              placeholder="작업 횟수를 입력하세요"
            />
            {errors.work_cnt && <p className="text-sm text-red-500">{errors.work_cnt}</p>}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium mb-1.5">비고</div>
            <Textarea 
              id="notes" 
              name="notes" 
              value={formData.notes || ''} 
              onChange={handleChange}
              placeholder="추가 메모가 있다면 입력하세요"
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <span className="mr-2">저장 중...</span>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                </>
              ) : '작업 정보 저장'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default WorkInputForm;