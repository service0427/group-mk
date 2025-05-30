import React, { useEffect, useState } from 'react';
import { CommonTemplate } from '@/components/pageTemplate';
import { CashManageService } from './CashManageService';
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
import { cn } from "@/lib/utils";
import { useDialog } from '@/providers';

// 다이얼로그 z-index 스타일 오버라이드
const rejectDialogStyles = `
  .dialog-overlay {
    z-index: 9000 !important;
  }
  
  .dialog-content {
    z-index: 9001 !important;
  }
`;

// 거부 사유 입력 다이얼로그 컴포넌트
interface RejectReasonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const RejectReasonDialog: React.FC<RejectReasonDialogProps> = ({ isOpen, onClose, onConfirm }) => {
  const [reason, setReason] = useState<string>("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      onConfirm(reason);
      setReason(""); // 입력 내용 초기화
    }
  };
  
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: rejectDialogStyles }} />
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="dialog-content sm:max-w-[400px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>거부 사유 입력</DialogTitle>
            </DialogHeader>
            <DialogBody className="py-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="reason">
                  거부 사유
                </label>
                <textarea
                  id="reason"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={4}
                  placeholder="거부 사유를 입력하세요"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>
            </DialogBody>
            <DialogFooter className="space-x-2">
              <Button
                type="submit"
                className="bg-danger hover:bg-danger/90 text-white"
                disabled={!reason.trim()}
              >
                거부 확인
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                취소
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

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
  
  // 알림 다이얼로그 상태 관리
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogTitle, setDialogTitle] = useState<string>("");
  const [dialogDescription, setDialogDescription] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(true);
  
  // 거부 사유 다이얼로그 상태 관리
  const [rejectDialogOpen, setRejectDialogOpen] = useState<boolean>(false);
  const [currentRequestId, setCurrentRequestId] = useState<string>("");
  
  // 알림 다이얼로그 표시 함수
  const showDialog = (title: string, description: string, success: boolean = true) => {
    setDialogTitle(title);
    setDialogDescription(description);
    setIsSuccess(success);
    setDialogOpen(true);
  };

  // 캐시 요청 승인 처리 함수
  const { showConfirm } = useDialog();
  
  const handleApproveRequest = async (requestId: string) => {
    showConfirm(
      '캐시 충전 승인',
      '이 요청을 승인하시겠습니까?',
      async (confirmed) => {
        if (!confirmed) return;
        
        setLoading(true);
        try {
          const result = await CashManageService.approveChargeRequest(requestId);
          
          if (result.success) {
            showDialog("충전 요청 승인 완료", result.message, true);
            getCashRequestList(currentPage);
          } else {
            throw new Error(result.message);
          }
        } catch (error: any) {
          showDialog("승인 처리 오류", error.message, false);
        } finally {
          setLoading(false);
        }
      },
      {
        confirmText: '승인',
        cancelText: '취소',
        confirmButtonClass: 'bg-success hover:bg-success/90 text-white'
      }
    );
  };
  
  // 캐시 요청 거부 다이얼로그 표시 함수
  const handleRejectRequest = (requestId: string) => {
    setCurrentRequestId(requestId);
    setRejectDialogOpen(true);
  };
  
  // 캐시 요청 거부 처리 함수
  const processRejectRequest = async (reason: string) => {
    setRejectDialogOpen(false);
    
    if (!reason.trim()) return;
    
    setLoading(true);
    try {
      const result = await CashManageService.rejectChargeRequest(currentRequestId, reason);
      
      if (result.success) {
        showDialog("충전 요청 거부 완료", result.message, true);
        getCashRequestList(currentPage);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      showDialog("거부 처리 오류", error.message, false);
    } finally {
      setLoading(false);
    }
  };

  const getCashRequestList = async(page:number) => {
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
        showDialog("데이터 로딩 실패", result.message, false);
      }
    } catch (error:any) {
      
      showDialog("데이터 로딩 오류", error.message, false);
    } finally {
      setLoading(false);
    }
  }

  // 페이지당 표시 개수 변경 처리
  const handleChangeLimit = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value);
    setLimit(newLimit);
    // 페이지도 1로 초기화
    setCurrentPage(1);
    // useEffect에서 처리하므로 여기서는 getCashRequestList 호출하지 않음
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
    {"code":"", "name": "전체"},
    {"code":"pending", "name": "대기중"},
    {"code":"approved", "name": "승인됨"},
    {"code":"rejected", "name": "거절됨"},
  ];

  // 다른 방식: 개별 행마다 모달을 렌더링하는 대신, 중앙에서 단일 모달 관리
  const renderStatusBadge = (status: string) => {
    let badgeClass = '';
    let statusText = '';

    switch(status) {
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
      title="충전 관리" 
      description="회원들의 캐시 충전 신청을 관리합니다"
      toolbarActions={toolbarActions}
      showPageMenu={false}
    >
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent 
          className="max-w-md mx-auto text-center" 
          onPointerDownOutside={() => setDialogOpen(false)} // 모달 외부 클릭 시 닫기
        >
          <DialogHeader className="text-center">
            <DialogTitle className={`text-center mb-2 ${isSuccess ? "text-green-600" : "text-red-600"}`}>
              {dialogTitle}
            </DialogTitle>
            <DialogDescription className="whitespace-pre-line text-center">
              {dialogDescription}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center mt-6 sm:justify-center">
            <Button 
              onClick={() => setDialogOpen(false)}
              className={`min-w-[100px] ${isSuccess ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700 text-white"}`}
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="grid gap-5 lg:gap-7.5">
        <div className="card p-6 mb-5 shadow-sm bg-card">
          <div className="card-header pb-5">
            <h3 className="card-title text-lg font-semibold">캐시 충전 신청 검색</h3>
          </div>
          
          <div className="card-body p-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              {/* 상태(status) - select box */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-sm font-medium text-foreground">상태</span>
                </label>
                <select className="select select-bordered w-full focus:ring-2 focus:ring-primary"
                        value={searchStatus}
                        onChange={(e) => setSearchStatus(e.target.value)}>
                  {status_array.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 이메일(email) - input */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-sm font-medium text-foreground">이메일</span>
                </label>
                <input 
                  type="text" 
                  placeholder="이메일을 입력하세요" 
                  className="input input-bordered w-full focus:ring-2 focus:ring-primary"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)} 
                />
              </div>

              {/* 이름(user_name) - input */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-sm font-medium text-foreground">이름</span>
                </label>
                <input 
                  type="text" 
                  placeholder="이름을 입력하세요" 
                  className="input input-bordered w-full focus:ring-2 focus:ring-primary"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 신청일 시작 */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-sm font-medium text-foreground">신청일 (시작)</span>
                </label>
                <input 
                  type="date" 
                  className="input input-bordered w-full focus:ring-2 focus:ring-primary"
                  value={searchDateFrom}
                  onChange={(e) => setSearchDateFrom(e.target.value)} 
                />
              </div>

              {/* 신청일 종료 */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-sm font-medium text-foreground">신청일 (종료)</span>
                </label>
                <input 
                  type="date" 
                  className="input input-bordered w-full focus:ring-2 focus:ring-primary"
                  value={searchDateTo}
                  onChange={(e) => setSearchDateTo(e.target.value)} 
                />
              </div>
            </div>
          </div>
          
          <div className="card-footer pt-5 flex justify-end">
            <button className="btn btn-primary px-6" onClick={() => getCashRequestList(1)}>
              검색
            </button>
          </div>
        </div>

        <div className="card mb-5 shadow-sm bg-card">
          <div className="card-header p-6 pb-5 flex justify-between items-center">
            <h3 className="card-title text-lg font-semibold">캐시 충전 신청 리스트</h3>
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
                    <table className="table align-middle text-gray-700 text-sm w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted">
                          <th className="py-4 px-5 text-start">
                            <div className="flex items-center">
                              <input type="checkbox" className="input checkbox checkbox-sm checkbox-primary" />
                            </div>
                          </th>
                          <th className="py-4 px-5 text-start min-w-[120px]">
                            <div className="flex items-center">
                              <span className="font-medium text-foreground">회원명</span>
                            </div>
                          </th>
                          <th className="py-4 px-5 text-start min-w-[180px]">
                            <div className="flex items-center">
                              <span className="font-medium text-foreground">이메일</span>
                            </div>
                          </th>
                          <th className="py-4 px-5 text-start min-w-[120px]">
                            <div className="flex items-center">
                              <span className="font-medium text-foreground">충전 금액</span>
                            </div>
                          </th>
                          <th className="py-4 px-5 text-start min-w-[120px]">
                            <div className="flex items-center">
                              <span className="font-medium text-foreground">입금자명</span>
                            </div>
                          </th>
                          <th className="py-4 px-5 text-start min-w-[140px]">
                            <div className="flex items-center">
                              <span className="font-medium text-foreground">무료캐시</span>
                            </div>
                          </th>
                          <th className="py-4 px-5 text-start min-w-[120px]">
                            <div className="flex items-center">
                              <span className="font-medium text-foreground">상태</span>
                            </div>
                          </th>
                          <th className="py-4 px-5 text-start min-w-[150px]">
                            <div className="flex items-center">
                              <span className="font-medium text-foreground">신청일시</span>
                            </div>
                          </th>
                          <th className="py-4 px-5 text-end min-w-[120px]">
                            <span className="font-medium text-foreground">작업</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          cashRequests.map((request, index) => (
                            <tr key={index} className="border-b border-border hover:bg-muted/40">
                              <td className="py-4 px-5">
                                <div className="flex items-center">
                                  <input type="checkbox" className="input checkbox checkbox-sm checkbox-primary" />
                                </div>
                              </td>
                              <td className="py-4 px-5">
                                <div className="flex items-center">
                                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-2">
                                    {request.full_name ? request.full_name.charAt(0) : '?'}
                                  </div>
                                  <span className="text-foreground">{request.full_name}</span>
                                </div>
                              </td>
                              <td className="py-4 px-5">
                                <span className="text-foreground">{request.email}</span>
                              </td>
                              <td className="py-4 px-5">
                                <span className="text-foreground font-medium">₩{request.amount.toLocaleString()}</span>
                              </td>
                              <td className="py-4 px-5">
                                <span className="text-foreground">{request.account_holder || '-'}</span>
                              </td>
                              <td className="py-4 px-5">
                                {request.freeCashPercentage > 1 ? (
                                  request.isEligibleForFreeCash ? (
                                    <div>
                                      <span className="text-green-600 font-medium">+₩{request.freeCashAmount.toLocaleString()}</span>
                                      <div className="text-xs text-gray-500 mt-1">
                                        ({request.freeCashPercentage}%, {request.freeCashExpiryMonths > 0 ? `${request.freeCashExpiryMonths}개월 후 만료` : '무기한'})
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 text-xs">
                                      {request.status === 'pending' ? 
                                        `${request.minRequestAmount.toLocaleString()}원 이상 충전 시 무료캐시 제공` : 
                                        '혜택 없음'}
                                    </span>
                                  )
                                ) : (
                                  <span className="text-gray-500">-</span>
                                )}
                              </td>
                              <td className="py-4 px-5">
                                {renderStatusBadge(request.status)}
                              </td>
                              <td className="py-4 px-5">
                                <span className="text-foreground">{formatDate(request.requested_at)}</span>
                              </td>
                              <td className="py-4 px-5 text-end">
                                <div className="flex justify-end gap-2">
                                  {request.status === 'pending' && (
                                    <>
                                      <button 
                                        className="btn btn-sm btn-success"
                                        onClick={() => handleApproveRequest(request.id)}
                                      >
                                        승인
                                      </button>
                                      <button 
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handleRejectRequest(request.id)}
                                      >
                                        거부
                                      </button>
                                    </>
                                  )}
                                  {request.status !== 'pending' && (
                                    <span className="text-sm text-gray-500">
                                      {request.status === 'approved' ? '승인됨' : '거부됨'}
                                    </span>
                                  )}
                                </div>
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
                    <div className="divide-y divide-gray-200">
                      {cashRequests.map((request, index) => (
                        <div key={index} className="p-4 hover:bg-muted/40">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <input type="checkbox" className="input checkbox checkbox-sm checkbox-primary mr-3" />
                              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-2">
                                {request.full_name ? request.full_name.charAt(0) : '?'}
                              </div>
                              <span className="text-foreground font-medium">{request.full_name}</span>
                            </div>
                            {renderStatusBadge(request.status)}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                            <div>
                              <p className="text-muted-foreground">충전 금액</p>
                              <p className="font-medium">₩{request.amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">입금자명</p>
                              <p className="font-medium">{request.account_holder || '-'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">무료캐시</p>
                              {request.isEligibleForFreeCash ? (
                                <div>
                                  <span className="text-green-600 font-medium">+₩{request.freeCashAmount.toLocaleString()}</span>
                                  <div className="text-xs text-gray-500 mt-1">
                                    ({request.freeCashPercentage}%)
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-500 text-xs">혜택 없음</span>
                              )}
                            </div>
                            <div className="col-span-2">
                              <p className="text-muted-foreground">이메일</p>
                              <p>{request.email}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-muted-foreground">신청일시</p>
                              <p>{formatDate(request.requested_at)}</p>
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-2 mt-3">
                            {request.status === 'pending' && (
                              <>
                                <button 
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleApproveRequest(request.id)}
                                >
                                  승인
                                </button>
                                <button 
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleRejectRequest(request.id)}
                                >
                                  거부
                                </button>
                              </>
                            )}
                            {request.status !== 'pending' && (
                              <span className="text-sm text-gray-500">
                                {request.status === 'approved' ? '승인됨' : '거부됨'}
                              </span>
                            )}
                          </div>
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
          
          <div className="card-footer p-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3 order-2 md:order-1 min-w-[200px]">
              <span className="text-sm text-muted-foreground whitespace-nowrap">페이지당 표시:</span>
              <select 
                className="select select-sm select-bordered flex-grow min-w-[100px]" 
                name="perpage" 
                value={limit}
                onChange={handleChangeLimit}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            
            <div className="flex items-center gap-3 order-1 md:order-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">{getDisplayRange()}</span>
              <div className="flex">
                <button 
                  className="btn btn-icon btn-sm btn-light rounded-r-none border-r-0"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6"></path>
                  </svg>
                </button>
                <button 
                  className="btn btn-icon btn-sm btn-light rounded-l-none"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= getTotalPages()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 거부 사유 입력 다이얼로그 */}
      <RejectReasonDialog
        isOpen={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        onConfirm={processRejectRequest}
      />
    </CommonTemplate>
  );
};

export { ManageCashPage };