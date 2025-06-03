import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KeywordGroup, Keyword } from '../types';
import { Badge } from '@/components/ui/badge';
import { KeenIcon } from '@/components';
import { cn } from '@/lib/utils';

interface KeywordMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetGroups: KeywordGroup[];
  selectedCount: number;
  selectedKeywords?: Keyword[];
  onConfirm: (targetGroupId: number, copy: boolean) => Promise<void>;
}

export const KeywordMoveModal: React.FC<KeywordMoveModalProps> = ({
  isOpen,
  onClose,
  targetGroups,
  selectedCount,
  selectedKeywords = [],
  onConfirm,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [actionType, setActionType] = useState<'move' | 'copy'>('move');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {

    if (!selectedTargetId) {
      return;
    }
    
    setIsProcessing(true);
    try {
      await onConfirm(parseInt(selectedTargetId), actionType === 'copy');
      onClose();
    } catch (error) {
      console.error('Failed to move/copy keywords:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
        <DialogHeader className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <KeenIcon icon="arrow-right-left" className="size-5 text-blue-600 dark:text-blue-500" />
            </div>
            키워드 이동/복사
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 space-y-6">
          {/* 선택된 키워드 정보 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              선택된 키워드 ({selectedCount}개)
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="max-h-32 overflow-y-auto space-y-1">
                {selectedKeywords.length > 0 ? (
                  selectedKeywords.slice(0, 10).map((keyword, index) => (
                    <div key={keyword.id} className="text-sm text-gray-700 dark:text-gray-300">
                      • {keyword.mainKeyword}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">선택된 키워드 정보를 불러오는 중...</div>
                )}
                {selectedKeywords.length > 10 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic mt-2">
                    외 {selectedKeywords.length - 10}개...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 작업 유형 선택 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              작업 유형
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActionType('move')}
                className={cn(
                  'relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                  actionType === 'move'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <KeenIcon 
                  icon="arrow-right" 
                  className={cn(
                    'size-6',
                    actionType === 'move' ? 'text-blue-600' : 'text-gray-500'
                  )} 
                />
                <span className={cn(
                  'text-sm font-medium',
                  actionType === 'move' ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                )}>
                  이동
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">원본 삭제</span>
                {actionType === 'move' && (
                  <div className="absolute top-2 right-2">
                    <div className="size-2 bg-blue-500 rounded-full" />
                  </div>
                )}
              </button>
              
              <button
                onClick={() => setActionType('copy')}
                className={cn(
                  'relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                  actionType === 'copy'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <KeenIcon 
                  icon="copy" 
                  className={cn(
                    'size-6',
                    actionType === 'copy' ? 'text-blue-600' : 'text-gray-500'
                  )} 
                />
                <span className={cn(
                  'text-sm font-medium',
                  actionType === 'copy' ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                )}>
                  복사
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">원본 유지</span>
                {actionType === 'copy' && (
                  <div className="absolute top-2 right-2">
                    <div className="size-2 bg-blue-500 rounded-full" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* 대상 그룹 선택 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              대상 그룹 선택
            </h3>
            <div className="max-h-60 overflow-y-auto space-y-2 p-1">
              {targetGroups && targetGroups.length > 0 ? (
                targetGroups.map((group) => (
                  <label
                    key={group.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border',
                      selectedTargetId === group.id.toString()
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                    )}
                  >
                    <input
                      type="radio"
                      name="targetGroup"
                      value={group.id.toString()}
                      checked={selectedTargetId === group.id.toString()}
                      onChange={(e) => setSelectedTargetId(e.target.value)}
                      className="size-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {group.name}
                      </span>
                    </div>
                  </label>
                ))
              ) : (
                <div className="py-8 text-center">
                  <KeenIcon icon="information-2" className="size-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    이동/복사할 수 있는 그룹이 없습니다
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    같은 서비스 타입의 그룹만 선택 가능합니다
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedTargetId || isProcessing || !targetGroups || targetGroups.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <>
                <KeenIcon icon="loading" className="size-4 mr-1 animate-spin" />
                처리 중...
              </>
            ) : (
              <>
                {actionType === 'move' ? '이동하기' : '복사하기'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};