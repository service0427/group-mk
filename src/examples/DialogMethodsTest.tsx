import React from 'react';
import { useDialog } from '@/providers';

export const DialogMethodsTest: React.FC = () => {
  // Import the dialog hooks from our updated components
  const { showDialog, showAlert, showConfirm } = useDialog();
  
  // Test showAlert
  const handleTestAlert = () => {
    showAlert('테스트 알림', '이것은 showAlert 함수 테스트입니다.', () => {
      console.log('Alert confirmed');
    });
  };
  
  // Test showConfirm
  const handleTestConfirm = () => {
    showConfirm(
      '확인 테스트',
      '이것은 showConfirm 함수 테스트입니다.',
      (confirmed: boolean) => {
        console.log('Confirm result:', confirmed);
      },
      {
        confirmText: '네',
        cancelText: '아니오'
      }
    );
  };
  
  // Test showDialog
  const handleTestDialog = () => {
    showDialog({
      title: '다이얼로그 테스트',
      message: '이것은 showDialog 함수 테스트입니다.',
      confirmText: '확인',
      cancelText: '취소',
      variant: 'warning',
      onConfirm: () => console.log('Dialog confirmed'),
      onCancel: () => console.log('Dialog cancelled')
    });
  };
  
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Dialog 메서드 테스트</h1>
      <div className="flex gap-4">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleTestAlert}
        >
          showAlert 테스트
        </button>
        <button
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
          onClick={handleTestConfirm}
        >
          showConfirm 테스트
        </button>
        <button
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
          onClick={handleTestDialog}
        >
          showDialog 테스트
        </button>
      </div>
    </div>
  );
};

export default DialogMethodsTest;