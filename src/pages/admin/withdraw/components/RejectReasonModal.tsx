import React, { useState } from 'react'

interface RejectReasonModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  requestId: number
}

export const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  requestId
}) => {
  const [reason, setReason] = useState<string>('')
  const [error, setError] = useState<string>('')

  // 모달이 열려있지 않으면 아무것도 렌더링하지 않음
  if (!isOpen) return null
  
  // 확인 버튼 클릭 시 처리
  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('반려 사유를 입력해주세요.')
      return
    }
    
    onConfirm(reason)
    setReason('') // 입력 필드 초기화
    setError('') // 에러 메시지 초기화
  }
  
  // 취소 버튼 클릭 시 처리
  const handleCancel = () => {
    setReason('') // 입력 필드 초기화
    setError('') // 에러 메시지 초기화
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* 오버레이 */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={handleCancel}></div>
        
        {/* 모달 내용 */}
        <div className="relative bg-white rounded-lg max-w-md w-full mx-auto shadow-xl z-10">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">출금 요청 반려</h3>
          </div>
          
          <div className="p-6">
            <div className="mb-4">
              <label htmlFor="reject-reason" className="block text-sm font-medium text-gray-700 mb-1">
                반려 사유
              </label>
              <textarea
                id="reject-reason"
                rows={4}
                className={`block w-full px-3 py-2 border ${error ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="반려 사유를 입력해주세요"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value)
                  if (e.target.value.trim()) setError('')
                }}
              />
              {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={handleCancel}
              >
                취소
              </button>
              <button
                type="button"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={handleConfirm}
              >
                반려하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RejectReasonModal