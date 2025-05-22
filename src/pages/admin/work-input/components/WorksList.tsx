import React, { useState } from 'react';
import { SlotWorkInfo, Slot } from '../types';
import { formatDateToKorean } from '../services/workInputService';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WorksListProps {
  works: SlotWorkInfo[];
  slots: Slot[];
  onUpdate: (id: string, data: { date?: string; work_cnt?: number; notes?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading: boolean;
}

export const WorksList: React.FC<WorksListProps> = ({ works, slots, onUpdate, onDelete, isLoading }) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWork, setSelectedWork] = useState<SlotWorkInfo | null>(null);
  const [editFormData, setEditFormData] = useState<{
    date: string;
    work_cnt: number;
    notes?: string;
  }>({
    date: '',
    work_cnt: 0,
    notes: '',
  });

  // 슬롯 ID로 캠페인 이름 찾기
  const getCampaignName = (slotId: string): string => {
    const slot = slots.find(s => s.id === slotId);
    return slot?.campaign_name || `캠페인 #${slotId.substring(0, 8)}`;
  };

  // 편집 다이얼로그 열기
  const openEditDialog = (work: SlotWorkInfo) => {
    setSelectedWork(work);
    setEditFormData({
      date: work.date,
      work_cnt: work.work_cnt,
      notes: work.notes || '',
    });
    setEditDialogOpen(true);
  };

  // 삭제 다이얼로그 열기
  const openDeleteDialog = (work: SlotWorkInfo) => {
    setSelectedWork(work);
    setDeleteDialogOpen(true);
  };

  // 편집 폼 변경 핸들러
  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numberValue = value === '' ? 0 : parseInt(value, 10);
    setEditFormData(prev => ({ ...prev, [name]: numberValue }));
  };

  // 편집 저장
  const handleEditSave = async () => {
    if (!selectedWork) return;

    try {
      await onUpdate(selectedWork.id, editFormData);
      setEditDialogOpen(false);
    } catch (error) {
      // 에러는 onUpdate에서 처리
    }
  };

  // 삭제 확인
  const handleDeleteConfirm = async () => {
    if (!selectedWork) return;

    try {
      await onDelete(selectedWork.id);
      setDeleteDialogOpen(false);
    } catch (error) {
      // 에러는 onDelete에서 처리
    }
  };

  if (works.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>작업 기록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10">
            <p className="mb-4 text-gray-500">등록된 작업 기록이 없습니다.</p>
            <p className="text-gray-400 text-sm">위 양식을 사용하여 작업 정보를 입력해주세요.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>작업 기록</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>작업일자</TableHead>
                  <TableHead>캠페인명</TableHead>
                  <TableHead className="text-center">작업 횟수</TableHead>
                  <TableHead>비고</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {works.map((work) => (
                  <TableRow key={work.id}>
                    <TableCell className="font-medium">{formatDateToKorean(work.date)}</TableCell>
                    <TableCell>{getCampaignName(work.slot_id)}</TableCell>
                    <TableCell className="text-center">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {work.work_cnt}회
                      </span>
                    </TableCell>
                    <TableCell>{work.notes || '-'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => openEditDialog(work)}
                        disabled={isLoading}
                      >
                        수정
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => openDeleteDialog(work)}
                        disabled={isLoading}
                      >
                        삭제
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 편집 다이얼로그 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>작업 정보 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="text-sm font-medium mb-1.5">작업 일자</div>
              <Input
                type="date"
                id="edit-date"
                name="date"
                value={editFormData.date}
                onChange={handleEditChange}
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium mb-1.5">작업 횟수</div>
              <Input
                type="number"
                id="edit-work_cnt"
                name="work_cnt"
                value={editFormData.work_cnt === 0 ? '' : editFormData.work_cnt}
                onChange={handleNumberChange}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium mb-1.5">비고</div>
              <Textarea
                id="edit-notes"
                name="notes"
                value={editFormData.notes || ''}
                onChange={handleEditChange}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button 
              onClick={handleEditSave}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업을 삭제하면 복구할 수 없습니다. 이 작업은 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WorksList;