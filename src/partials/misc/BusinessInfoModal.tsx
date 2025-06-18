import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { KeenIcon } from '@/components';

interface BusinessInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BusinessInfoModal: React.FC<BusinessInfoModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeenIcon icon="shop" className="size-5" />
            사업자 정보
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-6">
            {/* 회사 정보 섹션 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <KeenIcon icon="office-bag" className="size-5 text-primary" />
                회사 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">상호명</p>
                  <p className="font-medium text-blue-900 dark:text-blue-100">마케팅의정석</p>
                </div>
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">대표자</p>
                  <p className="font-medium text-blue-900 dark:text-blue-100">정석</p>
                </div>
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">사업자등록번호</p>
                  <p className="font-medium text-blue-900 dark:text-blue-100">677-01-02974</p>
                </div>
              </div>
            </div>

            {/* 연락처 정보 섹션 */}
            {/* <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <KeenIcon icon="phone" className="size-5 text-primary" />
                연락처 정보
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">주소</p>
                  <p className="font-medium">서울특별시 강남구 테헤란로 123, 5층</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">전화번호</p>
                    <p className="font-medium">02-1234-5678</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">이메일</p>
                    <p className="font-medium">contact@marketing-master.co.kr</p>
                  </div>
                </div>
              </div>
            </div> */}

            {/* 기타 정보 섹션 */}
            {/* <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <KeenIcon icon="information-2" className="size-5 text-primary" />
                기타 정보
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">개인정보보호책임자</p>
                  <p className="font-medium">김철수 (privacy@marketing-master.co.kr)</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">호스팅 서비스 제공</p>
                  <p className="font-medium">Amazon Web Services (AWS)</p>
                </div>
              </div>
            </div> */}

          </div>
        </DialogBody>
        <div className="flex justify-end p-4 border-t">
          <button
            onClick={onClose}
            className="btn btn-light btn-sm"
          >
            닫기
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { BusinessInfoModal };