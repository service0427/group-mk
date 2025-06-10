import React, { useEffect, useState } from 'react';
import { CommonTemplate } from '@/components/pageTemplate';
import { CashManageService } from './CashManageService';
import { KeenIcon } from '@/components';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ManageCashPage = () => {
  const [cashRequests, setCashRequests] = useState<any[]>([]);
  const [limit, setLimit] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [searchStatus, setSearchStatus] = useState<string>('pending');
  const [searchEmail, setSearchEmail] = useState<string>('');
  const [searchName, setSearchName] = useState<string>('');
  const [searchDateFrom, setSearchDateFrom] = useState<string>('');
  const [searchDateTo, setSearchDateTo] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // 선택 관련 상태 추가
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // 모달 관련 상태 관리
  const [modalType, setModalType] = useState<'confirm' | 'reject' | 'result' | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // 모달 열기 함수들
  const openConfirmModal = (requestId: string) => {
    setModalType('confirm');
    setModalData({ requestId });
  };

  const openRejectModal = (requestId: string) => {
    setModalType('reject');
    setModalData({ requestId });
    setRejectReason('');
  };

  const openResultModal = (title: string, message: string, isSuccess: boolean) => {
    setModalType('result');
    setModalData({ title, message, isSuccess });
  };

  // 모달 닫기
  const closeModal = () => {
    setModalType(null);
    setModalData(null);
    setRejectReason('');
  };

  // 개별 항목 선택 토글
  const handleSelectionChange = (requestId: string) => {
    setSelectedItems(prev => {
      if (prev.includes(requestId)) {
        return prev.filter(id => id !== requestId);
      } else {
        return [...prev, requestId];
      }
    });
  };

  // 전체 선택/해제
  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedItems(cashRequests.map(request => request.id));
    } else {
      setSelectedItems([]);
    }
  };

  // 선택된 항목 일괄 승인
  const handleBulkApprove = async () => {
    if (selectedItems.length === 0) {
      openResultModal("알림", "선택된 항목이 없습니다.", false);
      return;
    }

    setModalType('confirm');
    setModalData({
      requestIds: selectedItems,
      isBulk: true
    });
  };

  // 선택된 항목 일괄 거부
  const handleBulkReject = async () => {
    if (selectedItems.length === 0) {
      openResultModal("알림", "선택된 항목이 없습니다.", false);
      return;
    }

    setModalType('reject');
    setModalData({
      requestIds: selectedItems,
      isBulk: true
    });
  };

  // 승인 처리
  const handleConfirmApprove = async () => {
    if (!modalData) return;

    closeModal();
    setLoading(true);

    try {
      if (modalData.isBulk) {
        // 일괄 승인 처리
        let successCount = 0;
        let failCount = 0;

        for (const requestId of modalData.requestIds) {
          try {
            const result = await CashManageService.approveChargeRequest(requestId);
            if (result.success) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (error) {
            failCount++;
          }
        }

        getCashRequestList(currentPage);
        setSelectedItems([]); // 선택 초기화

        if (failCount === 0) {
          openResultModal("일괄 승인 완료", `${successCount}건의 충전 요청이 승인되었습니다.`, true);
        } else {
          openResultModal("일괄 승인 부분 완료", `성공: ${successCount}건, 실패: ${failCount}건`, true);
        }
      } else {
        // 개별 승인 처리
        const result = await CashManageService.approveChargeRequest(modalData.requestId);

        if (result.success) {
          getCashRequestList(currentPage);
          openResultModal("충전 요청 승인 완료", result.message, true);
        } else {
          throw new Error(result.message);
        }
      }
    } catch (error: any) {
      openResultModal("승인 처리 오류", error.message, false);
    } finally {
      setLoading(false);
    }
  };

  // 거부 처리
  const handleConfirmReject = async () => {
    if (!modalData || !rejectReason.trim()) return;

    closeModal();
    setLoading(true);

    try {
      if (modalData.isBulk) {
        // 일괄 거부 처리
        let successCount = 0;
        let failCount = 0;

        for (const requestId of modalData.requestIds) {
          try {
            const result = await CashManageService.rejectChargeRequest(requestId, rejectReason);
            if (result.success) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (error) {
            failCount++;
          }
        }

        getCashRequestList(currentPage);
        setSelectedItems([]); // 선택 초기화

        if (failCount === 0) {
          openResultModal("일괄 거부 완료", `${successCount}건의 충전 요청이 거부되었습니다.`, true);
        } else {
          openResultModal("일괄 거부 부분 완료", `성공: ${successCount}건, 실패: ${failCount}건`, true);
        }
      } else {
        // 개별 거부 처리
        const result = await CashManageService.rejectChargeRequest(modalData.requestId, rejectReason);

        if (result.success) {
          getCashRequestList(currentPage);
          openResultModal("충전 요청 거부 완료", result.message, true);
        } else {
          throw new Error(result.message);
        }
      }
    } catch (error: any) {
      openResultModal("거부 처리 오류", error.message, false);
    } finally {
      setLoading(false);
    }
  };

  const getCashRequestList = async (page: number) => {
    setLoading(true);
    try {
      const result = await CashManageService.getCashRequestList(page, limit, {
        status: searchStatus,
        email: searchEmail,
        name: searchName,
        dateFrom: searchDateFrom,
        dateTo: searchDateTo
      });

      if (result.success) {
        setCashRequests(result.data || []);
        setTotalItems(result.totalItems || 0);
      } else {
        openResultModal("데이터 로딩 실패", result.message, false);
      }
    } catch (error: any) {
      openResultModal("데이터 로딩 오류", error.message, false);
    } finally {
      setLoading(false);
    }
  }

  // 페이지당 표시 개수 변경 처리
  const handleChangeLimit = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value);
    setLimit(newLimit);
    setCurrentPage(1);
  }

  // 페이지 이동 처리
  const handlePageChange = (page: number) => {
    if (page < 1 || page > getTotalPages()) return;
    setCurrentPage(page);
  }

  // 총 페이지 수 계산
  const getTotalPages = () => {
    return Math.max(1, Math.ceil(totalItems / limit));
  }

  // 현재 표시 중인 항목 범위 계산
  const getDisplayRange = () => {
    if (totalItems === 0) return "0-0 / 0";
    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, totalItems);
    return `${start}-${end} / ${totalItems}`;
  }

  useEffect(() => {
    getCashRequestList(currentPage);
  }, [limit, currentPage]);

  // 검색 조건이 변경되면 페이지를 1로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchStatus, searchEmail, searchName, searchDateFrom, searchDateTo]);

  const status_array = [
    { "code": "", "name": "전체" },
    { "code": "pending", "name": "대기중" },
    { "code": "approved", "name": "승인됨" },
    { "code": "rejected", "name": "거절됨" },
  ];

  const renderStatusBadge = (status: string) => {
    let badgeClass = '';
    let statusText = '';

    switch (status) {
      case 'approved':
        badgeClass = 'bg-success/10 text-success';
        statusText = '승인됨';
        break;
      case 'rejected':
        badgeClass = 'bg-danger/10 text-danger';
        statusText = '거절됨';
        break;
      case 'pending':
        badgeClass = 'bg-warning/10 text-warning';
        statusText = '대기중';
        break;
      default:
        badgeClass = 'bg-gray-100 text-gray-700';
        statusText = status;
    }

    return (
      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${badgeClass}`}>{statusText}</span>
    );
  }

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 툴바 액션 버튼
  const toolbarActions = (
    <Button variant="outline" size="sm" className="bg-primary-600 text-white hover:bg-primary-700">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      내보내기
    </Button>
  );

  return (
    <CommonTemplate
      title="캐시 신청 관리"
      description="회원들의 캐시 충전 신청을 관리합니다"
      toolbarActions={toolbarActions}
      showPageMenu={false}
    >
      {/* 승인 확인 모달 */}
      {modalType === 'confirm' && (
        <Dialog open={true} onOpenChange={closeModal}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>캐시 충전 승인</DialogTitle>
              <DialogDescription>
                {modalData?.isBulk
                  ? `선택된 ${modalData.requestIds.length}건의 요청을 승인하시겠습니까?`
                  : '이 요청을 승인하시겠습니까?'
                }
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={closeModal}>
                취소
              </Button>
              <Button
                className="bg-success hover:bg-success/90 text-white"
                onClick={handleConfirmApprove}
                disabled={loading}
              >
                승인
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 거부 사유 입력 모달 */}
      {modalType === 'reject' && (
        <Dialog open={true} onOpenChange={closeModal}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>거부 사유 입력</DialogTitle>
              {modalData?.isBulk && (
                <DialogDescription>
                  선택된 {modalData.requestIds.length}건의 요청을 거부합니다
                </DialogDescription>
              )}
            </DialogHeader>
            <DialogBody className="py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                거부 사유
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                rows={4}
                placeholder="거부 사유를 입력하세요"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </DialogBody>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={closeModal}>
                취소
              </Button>
              <Button
                className="bg-danger hover:bg-danger/90 text-white"
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim() || loading}
              >
                거부 확인
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 결과 알림 모달 */}
      {modalType === 'result' && (
        <Dialog open={true} onOpenChange={closeModal}>
          <DialogContent className="max-w-md text-center" aria-describedby={undefined}>
            <DialogHeader className="text-center">
              <DialogTitle className={`text-center ${modalData?.isSuccess ? "text-green-600" : "text-red-600"}`}>
                {modalData?.title}
              </DialogTitle>
              <DialogDescription className="text-center">
                {modalData?.message}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="justify-center">
              <Button
                onClick={closeModal}
                className={modalData?.isSuccess ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700 text-white"}
              >
                확인
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="grid gap-5 lg:gap-7.5">
        {/* 검색 영역 */}
        <div className="card shadow-sm">
          <div className="card-header border-b border-gray-200 dark:border-gray-700">
            <h3 className="card-title">검색 필터</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* 상태 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">상태</label>
                <select
                  className="select"
                  value={searchStatus}
                  onChange={(e) => setSearchStatus(e.target.value)}
                >
                  {status_array.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 이메일 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">이메일</label>
                <input
                  type="text"
                  placeholder="이메일 입력"
                  className="input"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
              </div>

              {/* 이름 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">이름</label>
                <input
                  type="text"
                  placeholder="이름 입력"
                  className="input"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
              </div>

              {/* 신청일 시작 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">신청일(시작)</label>
                <input
                  type="date"
                  className="input"
                  value={searchDateFrom}
                  onChange={(e) => setSearchDateFrom(e.target.value)}
                />
              </div>

              {/* 신청일 종료 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">신청일(종료)</label>
                <input
                  type="date"
                  className="input"
                  value={searchDateTo}
                  onChange={(e) => setSearchDateTo(e.target.value)}
                />
              </div>

              {/* 검색 버튼 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 lg:opacity-0">검색</label>
                <button
                  className="btn btn-primary h-[42px]"
                  onClick={() => getCashRequestList(1)}
                >
                  <KeenIcon icon="magnifier" className="mr-1" />
                  검색
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-5 shadow-sm bg-card">
          <div className="card-header p-6 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="card-title text-lg font-semibold">캐시 충전 신청 리스트</h3>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn btn-sm btn-light"
                onClick={() => handleSelectAll(cashRequests.length > 0 && selectedItems.length !== cashRequests.length)}
                disabled={cashRequests.length === 0}
              >
                <KeenIcon icon="check-squared" className="text-base sm:mr-1" />
                <span className="hidden sm:inline">
                  {selectedItems.length === cashRequests.length && cashRequests.length > 0 ? '전체 해제' : '전체 선택'}
                </span>
              </button>
              <Button
                onClick={handleBulkApprove}
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                disabled={selectedItems.length === 0}
                title="선택 승인"
              >
                <KeenIcon icon="check" className="sm:mr-1" />
                <span className="hidden sm:inline">선택 승인 ({selectedItems.length})</span>
                <span className="sm:hidden">({selectedItems.length})</span>
              </Button>
              <Button
                onClick={handleBulkReject}
                variant="destructive"
                size="sm"
                className="disabled:opacity-50"
                disabled={selectedItems.length === 0}
                title="선택 반려"
              >
                <KeenIcon icon="cross" className="sm:mr-1" />
                <span className="hidden sm:inline">선택 반려 ({selectedItems.length})</span>
                <span className="sm:hidden">({selectedItems.length})</span>
              </Button>
            </div>
          </div>

          <div className="card-body p-0">
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* 데스크톱용 테이블 (md 이상 화면에서만 표시) */}
                <div className="hidden md:block overflow-x-auto">
                  {cashRequests.length > 0 ? (
                    <table className="table align-middle text-sm w-full text-left border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-muted dark:bg-gray-800/60">
                          <th className="py-3 px-3 text-start">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                className="checkbox checkbox-sm checkbox-primary"
                                checked={selectedItems.length === cashRequests.length && cashRequests.length > 0}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                              />
                            </div>
                          </th>
                          <th className="py-3 px-3 text-start font-medium min-w-[120px]">회원명</th>
                          <th className="py-3 px-3 text-start font-medium min-w-[180px]">이메일</th>
                          <th className="py-3 px-3 text-start font-medium min-w-[120px]">충전 금액</th>
                          <th className="py-3 px-3 text-start font-medium min-w-[120px]">입금자명</th>
                          <th className="py-3 px-3 text-start font-medium min-w-[140px]">무료캐시</th>
                          <th className="py-3 px-3 text-center font-medium min-w-[120px]">상태</th>
                          <th className="py-3 px-3 text-center font-medium min-w-[150px]">신청일시</th>
                          <th className="py-3 px-3 text-center font-medium min-w-[140px]">승인/반려</th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          cashRequests.map((request, index) => (
                            <tr key={index} className="border-b border-border hover:bg-muted/40">
                              <td className="py-3 px-3">
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm checkbox-primary"
                                    checked={selectedItems.includes(request.id)}
                                    onChange={() => handleSelectionChange(request.id)}
                                  />
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center">
                                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-2">
                                    {request.full_name ? request.full_name.charAt(0) : '?'}
                                  </div>
                                  <span className="text-gray-900 dark:text-white">{request.full_name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-gray-700 dark:text-gray-400">
                                {request.email}
                              </td>
                              <td className="py-3 px-3">
                                <span className="text-gray-900 dark:text-white font-medium">₩{request.amount.toLocaleString()}</span>
                              </td>
                              <td className="py-3 px-3 text-gray-700 dark:text-gray-400">
                                {request.account_holder || '-'}
                              </td>
                              <td className="py-3 px-3">
                                {request.freeCashPercentage > 1 ? (
                                  request.isEligibleForFreeCash ? (
                                    <div>
                                      <span className="text-green-600 dark:text-green-400 font-medium">+₩{request.freeCashAmount.toLocaleString()}</span>
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        ({request.freeCashPercentage}%, {request.freeCashExpiryMonths > 0 ? `${request.freeCashExpiryMonths}개월 후 만료` : '무기한'})
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                                      {request.status === 'pending' ?
                                        `${request.minRequestAmount.toLocaleString()}원 이상 충전 시 무료캐시 제공` :
                                        '혜택 없음'}
                                    </span>
                                  )
                                ) : (
                                  <span className="text-gray-500 dark:text-gray-400">-</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${request.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                    : request.status === 'approved'
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                  }`}>
                                  {request.status === 'pending' ? '대기중' : request.status === 'approved' ? '승인' : '반려'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className="text-gray-600 dark:text-gray-400">{formatDate(request.requested_at)}</span>
                              </td>
                              <td className="py-3 px-3">
                                {request.status === 'pending' && (
                                  <div className="flex justify-center gap-2">
                                    <button
                                      onClick={() => openConfirmModal(request.id)}
                                      className="btn btn-sm bg-green-500 hover:bg-green-600 text-white transition-colors px-3"
                                      disabled={loading}
                                    >
                                      <KeenIcon icon="check" className="text-xs mr-1" />
                                      승인
                                    </button>
                                    <button
                                      onClick={() => openRejectModal(request.id)}
                                      className="btn btn-sm bg-red-500 hover:bg-red-600 text-white transition-colors px-3"
                                      disabled={loading}
                                    >
                                      <KeenIcon icon="cross" className="text-xs mr-1" />
                                      반려
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      데이터가 없습니다.
                    </div>
                  )}
                </div>

                {/* 모바일용 카드 리스트 (md 미만 화면에서만 표시) */}
                <div className="block md:hidden">
                  {cashRequests.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {cashRequests.map((request, index) => (
                        <div key={index} className="p-4 hover:bg-muted/40">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                className="checkbox checkbox-sm checkbox-primary mr-3"
                                checked={selectedItems.includes(request.id)}
                                onChange={() => handleSelectionChange(request.id)}
                              />
                              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-2">
                                {request.full_name ? request.full_name.charAt(0) : '?'}
                              </div>
                              <span className="text-gray-900 dark:text-white font-medium">{request.full_name}</span>
                            </div>
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${request.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : request.status === 'approved'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                              }`}>
                              {request.status === 'pending' ? '대기중' : request.status === 'approved' ? '승인' : '거부'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                            <div>
                              <p className="text-gray-500 dark:text-gray-400">충전 금액</p>
                              <p className="text-gray-900 dark:text-white font-medium">₩{request.amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 dark:text-gray-400">입금자명</p>
                              <p className="text-gray-700 dark:text-gray-300 font-medium">{request.account_holder || '-'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 dark:text-gray-400">무료캐시</p>
                              {request.isEligibleForFreeCash ? (
                                <div>
                                  <span className="text-green-600 dark:text-green-400 font-medium">+₩{request.freeCashAmount.toLocaleString()}</span>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    ({request.freeCashPercentage}%)
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-500 dark:text-gray-400 text-xs">혜택 없음</span>
                              )}
                            </div>
                            <div className="col-span-2">
                              <p className="text-gray-500 dark:text-gray-400">이메일</p>
                              <p className="text-gray-700 dark:text-gray-300">{request.email}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-gray-500 dark:text-gray-400">신청일시</p>
                              <p className="text-gray-600 dark:text-gray-400">{formatDate(request.requested_at)}</p>
                            </div>
                          </div>

                          {request.status === 'pending' && (
                            <div className="flex justify-end gap-2 mt-3">
                              <button
                                onClick={() => openConfirmModal(request.id)}
                                className="btn btn-sm bg-green-500 hover:bg-green-600 text-white"
                                disabled={loading}
                              >
                                <KeenIcon icon="check" className="text-sm mr-1" />
                                승인
                              </button>
                              <button
                                onClick={() => openRejectModal(request.id)}
                                className="btn btn-sm bg-red-500 hover:bg-red-600 text-white"
                                disabled={loading}
                              >
                                <KeenIcon icon="cross" className="text-sm mr-1" />
                                반려
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      데이터가 없습니다.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 페이지네이션 */}
          <div className="card-footer border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-sm text-gray-600 dark:text-gray-400">페이지당:</span>
                <select
                  className="select text-xs w-20"
                  value={limit}
                  onChange={handleChangeLimit}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span className="text-sm text-gray-600 dark:text-gray-400">개</span>
              </div>

              <div className="flex items-center gap-2 justify-center sm:justify-end">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {getDisplayRange()}
                </span>
                <div className="btn-group">
                  <button
                    className="btn btn-sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <KeenIcon icon="left" />
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= getTotalPages()}
                  >
                    <KeenIcon icon="right" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CommonTemplate>
  );
};

export { ManageCashPage };