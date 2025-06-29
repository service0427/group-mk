import React, { useState } from 'react'
import { WithdrawRequest } from '../WithdrawApprovePage'
import { approveWithdrawRequest, rejectWithdrawRequest } from '../services/withdrawService'
import { useAuthContext } from '@/auth'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface WithdrawRequestListProps {
  requests: WithdrawRequest[]
  loading: boolean
  totalItems: number
  currentPage: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onRequestUpdated: () => void // 요청 처리 후 목록 갱신을 위한 콜백
}

export const WithdrawRequestList: React.FC<WithdrawRequestListProps> = ({
  requests,
  loading,
  totalItems,
  currentPage,
  itemsPerPage,
  onPageChange,
  onRequestUpdated,
}) => {
  // 인증 컨텍스트에서 현재 사용자 정보 가져오기
  const { currentUser } = useAuthContext();

  // 처리 중 상태 관리
  const [processing, setProcessing] = useState<boolean>(false)

  // 알림 모달 상태 관리
  const [notification, setNotification] = useState<{
    visible: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'success',
    title: '',
    message: ''
  })

  // 반려 확인 모달 상태
  const [rejectConfirm, setRejectConfirm] = useState<{
    visible: boolean;
    id: number | null;
    reason: string;
  }>({
    visible: false,
    id: null,
    reason: ''
  })

  // 승인 확인 모달 상태
  const [approveConfirm, setApproveConfirm] = useState<{
    visible: boolean;
    id: number | null;
  }>({
    visible: false,
    id: null
  })

  // 상태에 따른 배지 색상 및 텍스트 반환
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className='inline-block px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800'>
            대기중
          </span>
        )
      case 'approved':
        return (
          <span className='inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800'>
            승인됨
          </span>
        )
      case 'rejected':
        return (
          <span className='inline-block px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800'>
            거부됨
          </span>
        )
      default:
        return (
          <span className='inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800'>
            기타
          </span>
        )
    }
  }

  // 금액 포맷팅
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount)
  }

  // 승인 확인 모달 표시
  const showApproveModal = (id: number) => {
    if (processing) return // 이미 처리 중인 경우 중복 요청 방지

    // 관리자 ID 확인
    if (!currentUser || !currentUser.id) {
      setNotification({
        visible: true,
        type: 'error',
        title: '권한 오류',
        message: '로그인이 필요하거나 권한이 없습니다.'
      })
      return;
    }

    // 승인 확인 모달 열기
    setApproveConfirm({
      visible: true,
      id: id
    })
  }

  // 출금 요청 승인 처리
  const handleApprove = async () => {
    if (processing || !approveConfirm.id) return // 이미 처리 중인 경우 중복 요청 방지

    try {
      setProcessing(true)
      const result = await approveWithdrawRequest(String(approveConfirm.id), currentUser.id) // 관리자 ID 전달

      // 모달 닫기
      setApproveConfirm({
        visible: false,
        id: null
      })

      if (result.success) {
        setNotification({
          visible: true,
          type: 'success',
          title: '승인 완료',
          message: '출금 요청이 승인되었습니다.'
        })
      } else {
        throw new Error(result.message || '승인 처리 중 오류가 발생했습니다.')
      }

      onRequestUpdated() // 목록 갱신
    } catch (error: any) {

      setNotification({
        visible: true,
        type: 'error',
        title: '승인 실패',
        message: error.message || '승인 처리 중 오류가 발생했습니다.'
      })
    } finally {
      setProcessing(false)
    }
  }

  // 출금 요청 반려 시 모달 표시
  const showRejectModal = (id: number) => {
    if (processing) return // 이미 처리 중인 경우 중복 요청 방지

    // 관리자 ID 확인
    if (!currentUser || !currentUser.id) {
      setNotification({
        visible: true,
        type: 'error',
        title: '권한 오류',
        message: '로그인이 필요하거나 권한이 없습니다.'
      })
      return;
    }

    // 반려 확인 모달 열기
    setRejectConfirm({
      visible: true,
      id: id,
      reason: ''
    })
  }

  // 반려 사유 변경 처리
  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRejectConfirm(prev => ({
      ...prev,
      reason: e.target.value
    }))
  }

  // 출금 요청 반려 처리
  const handleReject = async () => {
    if (processing) return // 이미 처리 중인 경우 중복 요청 방지

    // ID와 반려 사유가 없는 경우
    if (!rejectConfirm.id || !rejectConfirm.reason.trim()) {
      setNotification({
        visible: true,
        type: 'error',
        title: '입력 오류',
        message: '반려 사유를 입력해야 합니다.'
      })
      return
    }

    try {
      setProcessing(true)
      const result = await rejectWithdrawRequest(
        String(rejectConfirm.id),
        rejectConfirm.reason
      ) // id를 문자열로 변환

      // 모달 닫기
      setRejectConfirm({
        visible: false,
        id: null,
        reason: ''
      })

      if (result.success) {
        setNotification({
          visible: true,
          type: 'success',
          title: '반려 완료',
          message: '출금 요청이 반려되었습니다.'
        })
      } else {
        throw new Error(result.message || '반려 처리 중 오류가 발생했습니다.')
      }

      onRequestUpdated() // 목록 갱신
    } catch (error: any) {

      setNotification({
        visible: true,
        type: 'error',
        title: '반려 실패',
        message: error.message || '반려 처리 중 오류가 발생했습니다.'
      })
    } finally {
      setProcessing(false)
    }
  }

  // 페이지네이션 계산
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  return (
    <div className="w-full card">
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* 모바일 카드 뷰 (md 미만 화면에서만 표시) */}
          <div className="md:hidden space-y-4">
            {requests.length > 0 ? (
              requests.map((request) => (
                <div key={request.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-lg">{request.username}</h4>
                      <p className="text-gray-500 text-sm">{request.requestDate}</p>
                    </div>
                    <div>
                      {getStatusBadge(request.status)}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-500">은행</p>
                        <p className="font-medium">{request.bankName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">계좌번호</p>
                        <p className="font-medium">{request.accountNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">요청금액</p>
                        <p className="font-medium">{formatAmount(request.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">상호명</p>
                        <p className="font-medium">{request.businessName || '-'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">사업자번호</p>
                        <p className="font-medium">{request.businessNumber || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {request.status === 'pending' && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex space-x-2">
                      <button
                        className="flex-1 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 disabled:opacity-50"
                        onClick={() => showApproveModal(request.id)}
                        disabled={processing}
                      >
                        승인
                      </button>
                      <button
                        className="flex-1 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 disabled:opacity-50"
                        onClick={() => showRejectModal(request.id)}
                        disabled={processing}
                      >
                        반려
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                <p className="text-gray-500">검색 결과가 없습니다</p>
              </div>
            )}
          </div>

          {/* 테이블 뷰 (md 이상 화면에서만 표시) */}
          <div className="hidden md:block overflow-x-auto rounded-lg shadow-sm border border-gray-200 card">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사업자정보
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    은행정보
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    요청금액
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    요청일자
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.length > 0 ? (
                  requests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.username}</div>
                        <div className="text-sm text-gray-500">{request.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.businessName || '-'}</div>
                        <div className="text-sm text-gray-500">{request.businessNumber || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.bankName}</div>
                        <div className="text-sm text-gray-500">{request.accountNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatAmount(request.amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.requestDate}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {request.status === 'pending' && (
                          <div className="flex justify-end space-x-2">
                            <button
                              className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200 disabled:opacity-50"
                              onClick={() => showApproveModal(request.id)}
                              disabled={processing}
                              title="승인"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </button>
                            <button
                              className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50"
                              onClick={() => showRejectModal(request.id)}
                              disabled={processing}
                              title="반려"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-500">검색 결과가 없습니다</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 0 && (
            <div className="flex justify-center md:justify-end mt-6">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  <span className="sr-only">이전</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => onPageChange(pageNumber)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNumber
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                {totalPages > 5 && (
                  <>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      ...
                    </span>
                    <button
                      onClick={() => onPageChange(totalPages)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === totalPages
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  <span className="sr-only">다음</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          )}
        </>
      )}

      {/* 알림 모달 */}
      <Dialog open={notification.visible} onOpenChange={(open) => setNotification(prev => ({ ...prev, visible: open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold pb-2">
              {notification.type === 'success' ? (
                <div className="flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {notification.title}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  {notification.title}
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 text-center">
            <p className="text-gray-700 text-lg">{notification.message}</p>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setNotification(prev => ({ ...prev, visible: false }))}
              className={`w-full py-3 rounded-md font-medium ${notification.type === 'success'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
            >
              확인
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 승인 확인 모달 */}
      <Dialog open={approveConfirm.visible} onOpenChange={(open) => setApproveConfirm(prev => ({ ...prev, visible: open }))}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">출금 요청 승인</DialogTitle>
          </DialogHeader>

          <div className="p-6">
            <p className="text-gray-700">
              이 출금 요청을 승인하시겠습니까?
            </p>
          </div>

          <DialogFooter className="flex space-x-2">
            <button
              type="button"
              onClick={handleApprove}
              disabled={processing}
              className={`flex-1 py-2.5 rounded-md font-medium bg-green-600 text-white hover:bg-green-700 ${processing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              {processing ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  처리 중...
                </div>
              ) : '승인하기'}
            </button>
            <button
              type="button"
              onClick={() => setApproveConfirm(prev => ({ ...prev, visible: false }))}
              className="flex-1 py-2.5 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
            >
              취소
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 반려 확인 모달 */}
      <Dialog open={rejectConfirm.visible} onOpenChange={(open) => setRejectConfirm(prev => ({ ...prev, visible: open }))}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">출금 요청 반려</DialogTitle>
          </DialogHeader>

          <div className="p-6">
            <p className="text-gray-700 mb-4">반려 사유를 입력해주세요.</p>
            <textarea
              value={rejectConfirm.reason}
              onChange={handleReasonChange}
              placeholder="반려 사유를 상세히 입력해주세요"
              className="w-full border border-gray-300 rounded-md p-3 h-32 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <DialogFooter className="flex space-x-2">
            <button
              type="button"
              onClick={handleReject}
              disabled={!rejectConfirm.reason.trim() || processing}
              className={`flex-1 py-2.5 rounded-md font-medium bg-red-600 text-white hover:bg-red-700 ${!rejectConfirm.reason.trim() || processing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              {processing ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  처리 중...
                </div>
              ) : '반려하기'}
            </button>
            <button
              type="button"
              onClick={() => setRejectConfirm(prev => ({ ...prev, visible: false }))}
              className="flex-1 py-2.5 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
            >
              취소
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default WithdrawRequestList