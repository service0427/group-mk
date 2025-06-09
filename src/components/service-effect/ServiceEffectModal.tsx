import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ToastUIViewer } from '@/components/toast-editor';
import { ToastUIEditor } from '@/components/toast-editor';
import { useAuthContext } from '@/auth/useAuthContext';
import { Edit, Save, X } from 'lucide-react';
import { supabase } from '@/supabase';
import { useCustomToast } from '@/hooks/useCustomToast';
import { ServiceType } from '@/types/service.types';
import { getRoleLevel } from '@/config/roles.config';

interface ServiceEffectModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType: ServiceType;
  serviceName: string;
}

interface ServiceEffectData {
  id?: string;
  service_type: ServiceType;
  content: string;
  updated_at?: string;
  updated_by?: string;
}

export const ServiceEffectModal: React.FC<ServiceEffectModalProps> = ({
  isOpen,
  onClose,
  serviceType,
  serviceName
}) => {
  const { userRole, currentUser } = useAuthContext();
  const { showToast } = useCustomToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 관리자 그룹 체크 (레벨 90 이상)
  const isAdminGroup = userRole && getRoleLevel(userRole) >= 90;

  // 서비스 효과 및 사용법 데이터 불러오기
  useEffect(() => {
    if (isOpen && serviceType) {
      fetchServiceEffect();
    }
  }, [isOpen, serviceType]);

  const fetchServiceEffect = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_effects')
        .select('*')
        .eq('service_type', serviceType)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: 데이터 없음
        throw error;
      }

      if (data) {
        setContent(data.content);
        setOriginalContent(data.content);
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
    if (!content.trim()) {
      showToast('내용을 입력해주세요.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const { data: existingData } = await supabase
        .from('service_effects')
        .select('id')
        .eq('service_type', serviceType)
        .single();

      if (existingData) {
        // 업데이트
        const { error } = await supabase
          .from('service_effects')
          .update({
            content,
            updated_at: new Date().toISOString(),
            updated_by: currentUser?.full_name || currentUser?.email
          })
          .eq('service_type', serviceType);

        if (error) throw error;
      } else {
        // 새로 생성
        const { error } = await supabase
          .from('service_effects')
          .insert({
            service_type: serviceType,
            content,
            updated_by: currentUser?.full_name || currentUser?.email
          });

        if (error) throw error;
      }

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
      if (window.confirm('변경사항이 저장되지 않았습니다. 정말 닫으시겠습니까?')) {
        setContent(originalContent);
        setIsEditMode(false);
        onClose();
      }
    } else {
      setIsEditMode(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>{serviceName} 효과 및 사용법</DialogTitle>
            <div className="flex items-center gap-2">
              {isAdminGroup && !isEditMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  disabled={isLoading}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  수정
                </Button>
              )}
              {isEditMode && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4 mr-1" />
                    취소
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {isSaving ? '저장 중...' : '저장'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : isEditMode ? (
            <ToastUIEditor
              content={content}
              onChange={setContent}
              height="600px"
              theme="light"
              placeholder="효과 및 사용법을 입력하세요..."
            />
          ) : (
            <ToastUIViewer
              content={content}
              height="auto"
              theme="light"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};