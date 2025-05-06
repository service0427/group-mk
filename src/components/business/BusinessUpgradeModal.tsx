import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { supabase } from '@/supabase';
import { BusinessFormData } from '@/types/business';
import { useAuthContext } from '@/auth';

interface BusinessUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: BusinessFormData;
}

const BusinessUpgradeModal: React.FC<BusinessUpgradeModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  initialData 
}) => {
  const [formData, setFormData] = useState<BusinessFormData>({
    business_number: '',
    business_name: '',
    representative_name: ''
  });
  
  // 초기값 설정
  useEffect(() => {
    if (initialData) {
      setFormData({
        business_number: initialData.business_number || '',
        business_name: initialData.business_name || '',
        representative_name: initialData.representative_name || ''
      });
    }
  }, [initialData, isOpen]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  
  const { currentUser } = useAuthContext();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // 사업자 정보를 users 테이블의 business JSONB 필드에 업데이트
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          business: {
            business_number: formData.business_number,
            business_name: formData.business_name,
            representative_name: formData.representative_name,
            verified: false
          }
        })
        .eq('id', currentUser?.id);

      if (userUpdateError) throw userUpdateError;

      // levelup_apply 테이블에 신청 기록 생성
      const { error: applyError } = await supabase
        .from('levelup_apply')
        .insert([
          {
            user_id: currentUser?.id,
            status: 'pending'
          }
        ]);

      if (applyError) throw applyError;

      setSuccess(true);
      if (onSuccess) onSuccess();
      
      // 3초 후 모달 닫기
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 3000);
    } catch (err: any) {
      console.error('등업 신청 에러:', err);
      setError(err.message || '등업 신청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <ModalContent className="w-full max-w-md mx-auto my-8 p-0 animate-showUpModal">
        <ModalHeader className="p-6 pb-4 border-b">
          <ModalTitle className="text-lg font-medium">사업자 등업 신청</ModalTitle>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 btn btn-icon btn-sm btn-ghost"
          >
            <KeenIcon icon="cross" className="size-4" />
          </button>
        </ModalHeader>

        <ModalBody className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/20 text-success mb-4">
                <KeenIcon icon="check" className="size-8" />
              </div>
              <h4 className="text-lg font-medium mb-2">등업 신청 완료</h4>
              <p className="text-gray-600 mb-4">
                사업자 등업 신청이 완료되었습니다.<br />
                관리자 승인 후 등급이 변경됩니다.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">사업자 등록번호</span>
                  </label>
                  <input
                    type="text"
                    name="business_number"
                    value={formData.business_number}
                    onChange={handleChange}
                    placeholder="000-00-00000"
                    className="input input-bordered w-full focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">상호명</span>
                  </label>
                  <input
                    type="text"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleChange}
                    placeholder="상호명을 입력하세요"
                    className="input input-bordered w-full focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">대표자명</span>
                  </label>
                  <input
                    type="text"
                    name="representative_name"
                    value={formData.representative_name}
                    onChange={handleChange}
                    placeholder="대표자명을 입력하세요"
                    className="input input-bordered w-full focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                {error && (
                  <div className="alert alert-error p-3 text-sm">{error}</div>
                )}

                <div className="py-3 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-outline"
                    disabled={loading}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        처리중
                      </span>
                    ) : '신청하기'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { BusinessUpgradeModal };
