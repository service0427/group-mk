import React, { useState, useEffect } from 'react';
import { WithdrawRequest, getRecentWithdrawRequests } from '../services/withdrawService';

interface WithdrawHistoryProps {
  userId: string;
  refreshTrigger?: number; // 부모 컴포넌트에서 재조회 트리거
}

const WithdrawHistory: React.FC<WithdrawHistoryProps> = ({ userId, refreshTrigger }) => {
  const [recentRequests, setRecentRequests] = useState<WithdrawRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  
  // 상태에 따른 배지 색상
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // 상태 한글 표시
  const getStatusText = (status: string) => {
    switch(status) {
      case 'approved':
        return '승인';
      case 'rejected':
        return '반려';
      case 'pending':
        return '대기중';
      default:
        return status;
    }
  };
  
  // 금액을 천 단위 쉼표가 있는 형식으로 변환
  const formatNumberWithCommas = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // 최근 출금 요청 내역 가져오기
  const fetchRecentRequests = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    
    try {
      const data = await getRecentWithdrawRequests(userId);
      setRecentRequests(data);
    } catch (err) {
      
      setRecentRequests([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 컴포넌트 마운트 시 또는 재조회 시 데이터 가져오기
  useEffect(() => {
    if (userId) {
      fetchRecentRequests();
    }
  }, [userId, refreshTrigger]);

  return (
    <div className="mb-8 pt-10">
      <div className="mb-3">
        <p className="text-sm font-medium">최근 출금 요청 내역</p>
      </div>
      
      {isLoading ? (
        <div className="text-center py-4 text-gray-500">
          내역을 불러오는 중...
        </div>
      ) : recentRequests.length > 0 ? (
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">날짜</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">금액</th>
                <th className="px-4 py-2 text-center font-medium text-gray-500">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentRequests.map((request) => (
                <React.Fragment key={request.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">
                      {formatDate(request.requested_at)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-medium">
                      {formatNumberWithCommas(request.amount)}원
                      {request.fee_amount > 0 && (
                        <div className="text-xs text-red-600">
                          수수료 {formatNumberWithCommas(request.fee_amount)}원
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </td>
                  </tr>
                  {/* 반려 상태일 경우 반려 사유 표시 */}
                  {request.status === 'rejected' && request.rejected_reason && (
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="px-4 py-2 text-xs text-red-600 italic">
                        <span className="font-semibold">반려 사유:</span> {request.rejected_reason}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-md p-4 text-center text-gray-500">
          최근 출금 요청 내역이 없습니다.
        </div>
      )}
    </div>
  );
};

export default WithdrawHistory;