import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ToastUIViewer } from '@/components/toast-editor';
import { ToastUIEditor } from '@/components/toast-editor';
import { useAuthContext } from '@/auth/useAuthContext';
import { Edit, Save, X } from 'lucide-react';
import { supabase } from '@/supabase';
import { useCustomToast } from '@/hooks/useCustomToast';
import { ServiceEffectCategory, SERVICE_CATEGORY_NAMES } from '@/types/service-effect.types';
import { getRoleLevel, PERMISSION_GROUPS } from '@/config/roles.config';
import { useDialog } from '@/components/dialogs/AlertConfirmDialogs';

interface ServiceEffectViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceCategory: ServiceEffectCategory | null;
}

interface ServiceEffectData {
  id?: string;
  service_category: ServiceEffectCategory;
  content: string;
  created_at?: string;
  updated_at?: string;
  updated_by?: string;
}

export const ServiceEffectViewerModal: React.FC<ServiceEffectViewerModalProps> = ({
  isOpen,
  onClose,
  serviceCategory
}) => {
  const { userRole, currentUser } = useAuthContext();
  const { showToast } = useCustomToast();
  const { showConfirm } = useDialog();
  const [isEditMode, setIsEditMode] = useState(false);
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 관리자 그룹 체크 (레벨 90 이상)
  const userLevel = getRoleLevel(userRole);
  const isAdminGroup = userLevel >= PERMISSION_GROUPS.ADMIN;

  // 서비스명 가져오기
  const serviceName = serviceCategory ? SERVICE_CATEGORY_NAMES[serviceCategory] : '';

  // 서비스 효과 및 사용법 데이터 불러오기
  useEffect(() => {
    if (isOpen && serviceCategory) {
      fetchServiceEffect();
    }
  }, [isOpen, serviceCategory]);

  const fetchServiceEffect = async () => {
    if (!serviceCategory) return;

    setIsLoading(true);
    try {
      // RPC 함수 사용
      const { data, error } = await supabase
        .rpc('get_service_effect', { p_service_type: serviceCategory });

      if (error) {
        throw error;
      }

      // data는 배열로 반환됨
      const effectData = data && data.length > 0 ? data[0] : null;

      if (effectData) {
        setContent(effectData.content);
        setOriginalContent(effectData.content);
      } else {
        // 기본 내용 설정
        const defaultContent = `# ${serviceName} 효과 및 사용법

## 서비스 효과

### 주요 효과
- 효과 1
- 효과 2
- 효과 3

## 사용법

### 1단계: 준비하기
설명...

### 2단계: 실행하기
설명...

### 3단계: 확인하기
설명...

## 주의사항
- 주의사항 1
- 주의사항 2

## 문의하기
서비스 관련 문의사항이 있으시면 고객센터로 연락주세요.`;

        setContent(defaultContent);
        setOriginalContent(defaultContent);
      }
    } catch (error) {
      console.error('서비스 효과 데이터 로드 오류:', error);
      showToast('데이터를 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    setContent(originalContent);
    setIsEditMode(false);
  };

  const handleSave = async () => {
    if (!content.trim() || !serviceCategory) {
      showToast('내용을 입력해주세요.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // RPC 함수를 사용하여 저장 (UPSERT)
      const { error } = await supabase
        .rpc('save_service_effect', {
          p_service_type: serviceCategory,
          p_content: content,
          p_updated_by: currentUser?.email || userRole
        });

      if (error) throw error;

      setOriginalContent(content);
      setIsEditMode(false);
      showToast('저장되었습니다.', 'success');
    } catch (error) {
      console.error('저장 오류:', error);
      showToast('저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isEditMode && content !== originalContent) {
      showConfirm(
        '변경사항 확인',
        '변경사항이 저장되지 않았습니다. 정말 닫으시겠습니까?',
        (confirmed) => {
          if (confirmed) {
            setContent(originalContent);
            setIsEditMode(false);
            onClose();
          }
        }
      );
    } else {
      setIsEditMode(false);
      onClose();
    }
  };

  if (!serviceCategory) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl w-[90vw] h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{serviceName} 효과 및 사용법</DialogTitle>
          <DialogDescription className="sr-only">
            {serviceName} 서비스의 효과와 사용법을 확인하실 수 있습니다.
          </DialogDescription>
          {isAdminGroup && !isEditMode && (
            <div className="absolute right-14 top-1/2 -translate-y-1/2">
              <button
                className="btn btn-success btn-sm"
                onClick={handleEdit}
                disabled={isLoading}
              >
                <Edit className="w-4 h-4 mr-1" />
                수정
              </button>
            </div>
          )}
        </DialogHeader>

        <DialogBody className="px-6 py-4 flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : isEditMode ? (
            <div className="h-full">
              <ToastUIEditor
                content={content}
                onChange={setContent}
                height="100%"
                theme="light"
                placeholder="효과 및 사용법을 입력하세요..."
              />
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <ToastUIViewer
                content={content}
                height="auto"
                theme="light"
              />
            </div>
          )}
        </DialogBody>

        {isEditMode && (
          <DialogFooter>
            <Button
              variant="default"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? '저장 중...' : '저장'}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="w-4 h-4 mr-1" />
              취소
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};