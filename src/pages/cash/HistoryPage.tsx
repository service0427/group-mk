import { useState, useEffect, useCallback } from 'react';
import { Container } from '@/components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  CircleDollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  X,
  RotateCcw
} from 'lucide-react';
import { CashService } from './CashService';
import { useAuthContext } from '@/auth/useAuthContext';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { SERVICE_TYPE_LABELS } from '@/components/campaign-modals/types';

interface CashBalance {
  paid_balance: number;
  free_balance: number;
  total_balance: number;
}

interface CashTransaction {
  id: string;
  user_id: string;
  transaction_type: string;
  amount: number;
  description?: string;
  transaction_at: string;
  reference_id?: string;
  ip_address?: string;
  user_agent?: string;
  expired_dt?: string;
  mat_id?: string;
  balance_type?: string;
  // slots 관련
  product_id?: number;
  keyword_id?: number;
  user_slot_number?: number;
  slot_status?: string;
  slot_start_date?: string;
  slot_end_date?: string;
  quantity?: number;
  slot_input_data?: any;
  // keywords 관련
  main_keyword?: string;
  keyword1?: string;
  keyword2?: string;
  keyword3?: string;
  keyword_is_active?: boolean;
  keyword_description?: string;
  keyword_url?: string;
  // campaigns 관련
  campaign_name?: string;
  service_type?: string;
  campaign_group_id?: string;
  unit_price?: number;
  slot_type?: string;
  // 계산된 필드
  is_slot_transaction?: boolean;
  keywords_combined?: string;
  // 캠페인 추가 필드 정보
  campaign_add_info?: any;
}

interface ChargeRequest {
  id: string;
  amount: number;
  status: string;
  requested_at: string;
  processed_at?: string;
  free_cash_percentage?: number;
  account_holder?: string;
}

type TransactionFilter = 'all' | 'charge' | 'use' | 'refund';

const HistoryPage = () => {
  const { currentUser } = useAuthContext();
  const [balance, setBalance] = useState<CashBalance>({
    paid_balance: 0,
    free_balance: 0,
    total_balance: 0
  });
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [chargeRequests, setChargeRequests] = useState<ChargeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TransactionFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<CashTransaction | null>(null);
  const [autoRefundSlots, setAutoRefundSlots] = useState<any[]>([]);
  const itemsPerPage = 20;

  useEffect(() => {
    if (currentUser?.id) {
      // 탭이 변경되면 페이지를 1로 리셋
      setCurrentPage(1);
    }
  }, [activeTab]);

  useEffect(() => {
    if (currentUser?.id) {
      loadData();
    }
  }, [currentUser?.id, currentPage, activeTab]);

  const loadData = async () => {
    if (!currentUser?.id) return;
    
    setLoading(true);
    try {
      // 잔액 조회
      const balanceResult = await CashService.getUserBalance(currentUser.id);
      if (balanceResult.success && balanceResult.data) {
        setBalance(balanceResult.data);
      }

      // 거래 내역 조회 - 필터 타입 전달
      const historyResult = await CashService.getCashHistoryWithFilter(
        currentUser.id,
        currentPage,
        itemsPerPage,
        activeTab
      );
      if (historyResult.success && historyResult.data) {
        setTransactions(historyResult.data);
        if (historyResult.totalItems) {
          setTotalPages(Math.ceil(historyResult.totalItems / itemsPerPage));
        }
      }

      // 충전 요청 내역 조회
      const chargeResult = await CashService.getChargeRequestHistory(
        currentUser.id,
        100
      );
      if (chargeResult.success && chargeResult.data) {
        setChargeRequests(chargeResult.data);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 자동 완료 환불의 관련 슬롯 정보 로드
  const loadAutoRefundSlots = async (transaction: CashTransaction) => {
    console.log('loadAutoRefundSlots 호출됨:', transaction);
    
    if (!currentUser?.id || 
        transaction.transaction_type !== 'refund' || 
        !transaction.description?.includes('슬롯 자동 완료 환불')) {
      console.log('자동 환불이 아님, 조건 체크:', {
        hasUserId: !!currentUser?.id,
        isRefund: transaction.transaction_type === 'refund',
        hasAutoRefundText: transaction.description?.includes('슬롯 자동 완료 환불'),
        description: transaction.description
      });
      setAutoRefundSlots([]);
      return;
    }

    console.log('자동 환불 슬롯 조회 시작:', {
      userId: currentUser.id,
      transactionDate: transaction.transaction_at,
      amount: Math.abs(transaction.amount)
    });

    try {
      const result = await CashService.getAutoRefundSlots(
        currentUser.id,
        transaction.transaction_at,
        Math.abs(transaction.amount)
      );
      
      console.log('자동 환불 슬롯 조회 결과:', result);
      
      if (result.success && result.data) {
        console.log('자동 환불 슬롯 설정:', result.data);
        setAutoRefundSlots(result.data);
      } else {
        console.log('자동 환불 슬롯 없음');
        setAutoRefundSlots([]);
      }
    } catch (error) {
      console.error('자동 환불 슬롯 조회 실패:', error);
      setAutoRefundSlots([]);
    }
  };

  // 상세보기 모달을 열 때 자동 환불 슬롯 정보도 함께 로드
  const handleOpenDetailModal = useCallback((transaction: CashTransaction) => {
    setSelectedTransaction(transaction);
    loadAutoRefundSlots(transaction);
  }, [currentUser?.id]);

  // 이제 서버에서 필터링된 데이터를 받아오므로 클라이언트 필터링 불필요
  const getFilteredTransactions = () => {
    return transactions;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'charge':
      case 'free':
      case 'referral_bonus':
        return <ArrowDownRight className="h-4 w-4 text-green-600" />;
      case 'purchase':
      case 'buy':
      case 'work':
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case 'refund':
        return <RotateCcw className="h-4 w-4 text-orange-600" />;
      default:
        return <CircleDollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionTypeName = (type: string) => {
    const typeNames: Record<string, string> = {
      charge: '충전',
      purchase: '구매',
      refund: '환불',
      withdrawal: '출금',
      referral_bonus: '추천 보너스',
      expire: '만료',
      free: '무료 충전',
      work: '작업',
      buy: '구매'
    };
    return typeNames[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50">대기중</Badge>;
      case 'processed':
        return <Badge variant="outline" className="bg-green-50 text-green-700">완료</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700">거부됨</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const isIncome = ['charge', 'free', 'referral_bonus', 'refund'].includes(type);
    const sign = isIncome ? '+' : '-';
    const className = isIncome ? 'text-green-600' : 'text-red-600';
    
    return (
      <span className={`font-medium ${className}`}>
        {sign}{Math.abs(amount).toLocaleString()}원
      </span>
    );
  };

  const filteredTransactions = getFilteredTransactions();

  return (
    <Container>
      <div className="mx-auto max-w-7xl py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">캐시 충전/사용내역</h1>
          <p className="text-gray-600 mt-1">캐시 잔액 및 거래 내역을 확인하세요</p>
        </div>

        {/* 잔액 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-gray-600">
                <Wallet className="inline-block w-4 h-4 mr-2" />
                총 잔액
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {balance.total_balance.toLocaleString()}원
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-gray-600">
                <TrendingUp className="inline-block w-4 h-4 mr-2 text-blue-600" />
                유료 캐시
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-blue-600">
                {balance.paid_balance.toLocaleString()}원
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-gray-600">
                <TrendingDown className="inline-block w-4 h-4 mr-2 text-green-600" />
                무료 캐시
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-green-600">
                {balance.free_balance.toLocaleString()}원
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 충전 대기 중인 요청 */}
        {chargeRequests.filter(req => req.status === 'pending').length > 0 && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-base">충전 대기 중</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {chargeRequests
                  .filter(req => req.status === 'pending')
                  .map(req => (
                    <div key={req.id} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{req.amount.toLocaleString()}원</span>
                        <span className="text-sm text-gray-600 ml-2">
                          ({format(new Date(req.requested_at), 'MM월 dd일 HH:mm', { locale: ko })})
                        </span>
                        {req.account_holder && (
                          <span className="text-sm text-gray-600 ml-2">
                            입금자: {req.account_holder}
                          </span>
                        )}
                      </div>
                      {getStatusBadge('pending')}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 거래 내역 */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>거래 내역</CardTitle>
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                새로고침
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* 필터 탭 */}
            <div className="mb-6">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === 'all'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setActiveTab('charge')}
                  className={`flex-1 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === 'charge'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  충전
                </button>
                <button
                  onClick={() => setActiveTab('use')}
                  className={`flex-1 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === 'use'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  사용
                </button>
                <button
                  onClick={() => setActiveTab('refund')}
                  className={`flex-1 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === 'refund'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  환불
                </button>
              </div>
            </div>

            {/* 거래 내역 테이블 - 데스크톱 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-900 w-36">날짜</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-900 w-20">구분</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-900">내용</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-900 w-24">금액</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-900 w-16">타입</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-gray-900 w-16">상세</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        로딩 중...
                      </td>
                    </tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        거래 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 text-sm">
                          {format(new Date(transaction.transaction_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1">
                            {getTransactionIcon(transaction.transaction_type)}
                            <span className="text-xs font-medium">
                              {getTransactionTypeName(transaction.transaction_type)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600 max-w-xs">
                          {transaction.is_slot_transaction ? (
                            <div className="truncate">
                              {/* 환불 거래인 경우 특별 표시 */}
                              {transaction.transaction_type === 'refund' && (
                                <div className="text-xs text-red-600 font-medium mb-0.5">
                                  슬롯 #{transaction.user_slot_number} 환불
                                </div>
                              )}
                              
                              {/* 키워드 테이블에서 가져온 경우 */}
                              {transaction.main_keyword ? (
                                <>
                                  <div className="text-xs font-medium text-gray-900 truncate">
                                    {transaction.main_keyword}
                                  </div>
                                  {(transaction.keyword1 || transaction.keyword2 || transaction.keyword3) && (
                                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                                      서브: {[transaction.keyword1, transaction.keyword2, transaction.keyword3]
                                        .filter(Boolean)
                                        .join(', ')}
                                    </div>
                                  )}
                                </>
                              ) : (
                                /* input_data에서 정보 추출 */
                                (transaction.slot_input_data || transaction.is_slot_transaction) ? (
                                  <>
                                    {/* 키워드 미지원 서비스 처리 */}
                                    {(() => {
                                      const inputData = transaction.slot_input_data;
                                      const campaignAddInfo = transaction.campaign_add_info;
                                      
                                      
                                      // 필드 매핑이 있으면 우선순위에 따라 표시
                                      let mainDisplay = '';
                                      const additionalInfo: string[] = [];
                                      
                                      // campaigns.add_info의 add_field 배열 확인
                                      if (campaignAddInfo?.add_field && Array.isArray(campaignAddInfo.add_field) && inputData) {
                                        const addFields = campaignAddInfo.add_field;
                                        
                                        // 첫 번째 필드를 메인 표시로, 나머지는 추가 정보로
                                        addFields.forEach((field: any, index: number) => {
                                          // fieldName이 키임 (예: '항목명 1')
                                          const fieldName = field.fieldName;
                                          const fieldLabel = fieldName; // 간단하게 필드명 사용
                                          const value = inputData[fieldName];
                                          
                                          
                                          if (value && value.toString().trim() !== '') {
                                            if (index === 0) {
                                              mainDisplay = value;
                                            } else {
                                              additionalInfo.push(`${fieldLabel}: ${value}`);
                                            }
                                          }
                                        });
                                      }
                                      
                                      // 필드 매핑이 없으면 기존 로직 사용
                                      if (!mainDisplay && inputData) {
                                        mainDisplay = inputData.productName || 
                                                     inputData.title || 
                                                     inputData.main_keyword || 
                                                     inputData.keyword ||
                                                     inputData.keywords ||
                                                     '';
                                        
                                        // 여전히 없으면 첫 번째 의미있는 필드
                                        if (!mainDisplay) {
                                          const excludeFields = ['mid', 'url', 'price', 'quantity', 'id', 'created_at', 'updated_at'];
                                          for (const [key, value] of Object.entries(inputData)) {
                                            if (!excludeFields.includes(key) && 
                                                typeof value === 'string' && 
                                                value.trim() !== '') {
                                              mainDisplay = value;
                                              break;
                                            }
                                          }
                                        }
                                      }
                                      
                                      return (
                                        <>
                                          <div className="text-xs font-medium text-gray-900 truncate">
                                            {mainDisplay || transaction.description || '슬롯 구매'}
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </>
                                ) : null
                              )}
                              
                              {/* 캠페인 정보 */}
                              {transaction.campaign_name && (
                                <div className="text-xs text-blue-600 mt-1 truncate">
                                  {transaction.campaign_name} <span className='text-green-600'>[{SERVICE_TYPE_LABELS[transaction.service_type as keyof typeof SERVICE_TYPE_LABELS] || transaction.service_type}] </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              {/* 슬롯 자동 완료 환불 특별 처리 */}
                              {transaction.transaction_type === 'refund' && 
                               transaction.description?.includes('슬롯 자동 완료 환불') ? (
                                <div className="truncate">
                                  <div className="text-xs text-orange-600 font-medium">
                                    {transaction.description}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    시스템 자동 환불
                                  </div>
                                </div>
                              ) : (
                                <span className="truncate block">{transaction.description || '-'}</span>
                              )}
                            </>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {formatAmount(transaction.amount, transaction.transaction_type)}
                        </td>
                        <td className="py-3 px-2">
                          {transaction.balance_type && (
                            <Badge variant="outline" className="text-xs">
                              {transaction.balance_type === 'free' ? '무료' : 
                               transaction.balance_type === 'paid' ? '유료' : '혼합'}
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {(transaction.is_slot_transaction || 
                            (transaction.transaction_type === 'refund' && 
                             transaction.description?.includes('슬롯 자동 완료 환불'))) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleOpenDetailModal(transaction)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 거래 내역 카드 - 모바일 */}
            <div className="md:hidden space-y-3">
              {loading ? (
                <div className="text-center py-8 text-gray-500">로딩 중...</div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">거래 내역이 없습니다.</div>
              ) : (
                filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {/* 상단: 날짜와 금액 */}
                    <div className="flex justify-between items-start">
                      <div className="text-xs text-gray-500">
                        {format(new Date(transaction.transaction_at), 'MM/dd HH:mm')}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          {formatAmount(transaction.amount, transaction.transaction_type)}
                        </div>
                        {(transaction.is_slot_transaction || 
                          (transaction.transaction_type === 'refund' && 
                           transaction.description?.includes('슬롯 자동 완료 환불'))) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleOpenDetailModal(transaction)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* 중단: 구분과 내용 */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.transaction_type)}
                        <span className="text-sm font-medium">
                          {getTransactionTypeName(transaction.transaction_type)}
                        </span>
                        {transaction.balance_type && (
                          <Badge variant="outline" className="text-xs">
                            {transaction.balance_type === 'free' ? '무료' : 
                             transaction.balance_type === 'paid' ? '유료' : '혼합'}
                          </Badge>
                        )}
                      </div>
                      
                      {/* 내용 표시 */}
                      <div className="text-sm text-gray-600">
                        {transaction.is_slot_transaction ? (
                          <div>
                            {/* 환불 거래인 경우 특별 표시 */}
                            {transaction.transaction_type === 'refund' && (
                              <div className="text-xs text-red-600 font-medium">
                                슬롯 #{transaction.user_slot_number} 환불
                              </div>
                            )}
                            
                            {/* 키워드 정보 또는 슬롯 정보 표시 로직 */}
                            {transaction.main_keyword ? (
                              <>
                                <div className="font-medium">{transaction.main_keyword}</div>
                                {(transaction.keyword1 || transaction.keyword2 || transaction.keyword3) && (
                                  <div className="text-xs text-gray-500">
                                    {[transaction.keyword1, transaction.keyword2, transaction.keyword3]
                                      .filter(Boolean)
                                      .join(', ')}
                                  </div>
                                )}
                              </>
                            ) : (
                              transaction.description || '슬롯 구매'
                            )}
                            {transaction.campaign_name && (
                              <div className="text-xs text-blue-600 mt-1">
                                {transaction.campaign_name} ({SERVICE_TYPE_LABELS[transaction.service_type as keyof typeof SERVICE_TYPE_LABELS] || transaction.service_type})
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            {/* 슬롯 자동 완료 환불 특별 처리 */}
                            {transaction.transaction_type === 'refund' && 
                             transaction.description?.includes('슬롯 자동 완료 환불') ? (
                              <div>
                                <div className="text-xs text-orange-600 font-medium">
                                  {transaction.description}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  시스템 자동 환불
                                </div>
                              </div>
                            ) : (
                              transaction.description || '-'
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="text-xs sm:text-sm"
                >
                  이전
                </Button>
                <span className="flex items-center px-2 sm:px-4 text-xs sm:text-sm">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="text-xs sm:text-sm"
                >
                  다음
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* 상세보기 모달 */}
      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>거래 상세 정보</DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="overflow-y-auto flex-1 px-6 pb-6">
              <div className="space-y-4">
                {/* 기본 정보 */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">거래일시</p>
                    <p className="text-sm font-medium">{format(new Date(selectedTransaction.transaction_at), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">거래 유형</p>
                    <p className="text-sm font-medium">{getTransactionTypeName(selectedTransaction.transaction_type)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">금액</p>
                    <p className="text-sm font-medium">{formatAmount(selectedTransaction.amount, selectedTransaction.transaction_type)}</p>
                  </div>
                </div>
                
                {/* 슬롯 정보 */}
                {selectedTransaction.is_slot_transaction && (
                  <>
                    <hr />
                    <div>
                      <h4 className="text-sm font-medium mb-2">슬롯 정보</h4>
                      {selectedTransaction.campaign_name && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500">캠페인</p>
                          <p className="text-sm">{selectedTransaction.campaign_name} - {SERVICE_TYPE_LABELS[selectedTransaction.service_type as keyof typeof SERVICE_TYPE_LABELS] || selectedTransaction.service_type}</p>
                        </div>
                      )}
                      {selectedTransaction.user_slot_number && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500">슬롯 번호</p>
                          <p className="text-sm">#{selectedTransaction.user_slot_number}</p>
                        </div>
                      )}
                      {/* 환불인 경우 추가 정보 */}
                      {selectedTransaction.transaction_type === 'refund' && (
                        <>
                          {selectedTransaction.slot_start_date && selectedTransaction.slot_end_date && (
                            <div className="mb-2">
                              <p className="text-xs text-gray-500">원래 작업 기간</p>
                              <p className="text-sm">
                                {format(new Date(selectedTransaction.slot_start_date), 'yyyy.MM.dd', { locale: ko })} ~ 
                                {format(new Date(selectedTransaction.slot_end_date), 'yyyy.MM.dd', { locale: ko })}
                              </p>
                            </div>
                          )}
                          {selectedTransaction.slot_status && (
                            <div className="mb-2">
                              <p className="text-xs text-gray-500">슬롯 상태</p>
                              <p className="text-sm">{selectedTransaction.slot_status}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
                
                {/* 자동 완료 환불 정보 */}
                {selectedTransaction.transaction_type === 'refund' && 
                 selectedTransaction.description?.includes('슬롯 자동 완료 환불') && (
                  <>
                    <hr />
                    <div>
                      <h4 className="text-sm font-medium mb-2">자동 환불 정보</h4>
                      <div className="mb-2">
                        <p className="text-xs text-gray-500">환불 유형</p>
                        <p className="text-sm">시스템 자동 환불</p>
                      </div>
                      <div className="mb-2">
                        <p className="text-xs text-gray-500">설명</p>
                        <p className="text-sm">{selectedTransaction.description}</p>
                      </div>
                      {selectedTransaction.reference_id && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500">참조 ID</p>
                          <p className="text-sm text-gray-600">{selectedTransaction.reference_id}</p>
                        </div>
                      )}
                      
                      {/* 자동 환불 관련 슬롯 목록 */}
                      {autoRefundSlots.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500">환불된 슬롯 ({autoRefundSlots.length}개)</p>
                          <div className="space-y-2 mt-1">
                            {autoRefundSlots.map((slot, index) => (
                              <div key={slot.id} className="bg-white p-3 rounded border text-sm">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-medium">슬롯 #{slot.user_slot_number}</span>
                                  <span className="text-xs text-gray-500">
                                    {format(new Date(slot.processed_at), 'MM/dd HH:mm', { locale: ko })}
                                  </span>
                                </div>
                                {slot.campaigns && (
                                  <div className="text-xs text-blue-600">
                                    {slot.campaigns.campaign_name} - {SERVICE_TYPE_LABELS[slot.campaigns.service_type as keyof typeof SERVICE_TYPE_LABELS] || slot.campaigns.service_type}
                                  </div>
                                )}
                                {slot.keywords?.main_keyword && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    키워드: {slot.keywords.main_keyword}
                                    {(slot.keywords.keyword1 || slot.keywords.keyword2 || slot.keywords.keyword3) && (
                                      <span className="text-gray-500">
                                        {' '}+ {[slot.keywords.keyword1, slot.keywords.keyword2, slot.keywords.keyword3].filter(Boolean).length}개
                                      </span>
                                    )}
                                  </div>
                                )}
                                {slot.start_date && slot.end_date && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    작업기간: {format(new Date(slot.start_date), 'MM/dd', { locale: ko })} ~ {format(new Date(slot.end_date), 'MM/dd', { locale: ko })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                {/* 추가 입력 필드 정보 */}
                {selectedTransaction.slot_input_data && (
                  <>
                    <hr />
                    <div>
                      <h4 className="text-sm font-medium mb-3">상세 정보</h4>
                      <div className="space-y-3">
                        {(() => {
                          const inputData = selectedTransaction.slot_input_data;
                          const campaignAddInfo = selectedTransaction.campaign_add_info;
                          
                          // 표시할 필드들을 정리
                          const fieldsToDisplay: { label: string; value: any }[] = [];
                          
                          // 슬롯 승인 페이지처럼 제외할 필드들 정의
                          const excludeFields = [
                            // 시스템 필드
                            'id', 'created_at', 'updated_at', 'user_id', 'slot_id',
                            'campaign_id', 'product_id', 'deleted_at', 'status',
                            'is_active', 'sort_order', 'meta', 'metadata', 'config',
                            'settings', 'data', 'uuid', 'guid', 'hash', 'token', 'secret',
                            // 캠페인 관련 (이미 별도로 표시됨)
                            'campaign_name', 'service_type',
                            // 키워드 관련 (이미 별도로 표시됨)
                            'keyword1', 'keyword2', 'keyword3', 'keywordId',
                            'mainKeyword', 'main_keyword', 'keywords',
                            // 기타 불필요한 필드
                            'mid', 'price', 'minimum_purchase', 'work_days',
                            'is_manual_input', 'dueDays', 'expected_deadline',
                            'workCount', 'quantity'
                          ];
                          
                          // 필드명 한글 매핑
                          const fieldNameMap: Record<string, string> = {
                            'productName': '상품명',
                            'title': '제목',
                            'url': 'URL',
                            'link': '링크',
                            'start_date': '시작일',
                            'end_date': '종료일',
                            'description': '설명',
                            'content': '내용'
                          };
                          
                          // campaign add_field가 있으면 그것을 우선 사용
                          if (campaignAddInfo?.add_field && Array.isArray(campaignAddInfo.add_field)) {
                            campaignAddInfo.add_field.forEach((field: any) => {
                              const fieldName = field.fieldName;
                              const value = inputData[fieldName];
                              
                              // 빈 값이거나 빈 객체인 경우 제외
                              if (value === undefined || value === null || value === '' || 
                                  (typeof value === 'object' && Object.keys(value).length === 0)) {
                                return;
                              }
                              
                              // 이미지 필드인지 확인
                              const isImage = field.type === 'image' || 
                                            (typeof value === 'string' && 
                                             value.match(/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i));
                              
                              fieldsToDisplay.push({
                                label: field.fieldLabel || fieldName,
                                value: isImage ? { type: 'image', url: value } : value
                              });
                            });
                          }
                          
                          // add_field에 없는 나머지 필드들 중 중요한 것만 표시
                          if (inputData) {
                            const displayedFields = campaignAddInfo?.add_field?.map((f: any) => f.fieldName) || [];
                            
                            // 표시할 만한 중요 필드들
                            const importantFields = ['title', 'productName', 'keyword', 'keywords', 'main_keyword', 'url', 'link'];
                            
                            Object.entries(inputData).forEach(([key, value]) => {
                              // 제외할 필드인 경우 스킵
                              if (excludeFields.includes(key) || displayedFields.includes(key)) {
                                return;
                              }
                              
                              // 파일 관련 필드는 제외 (_fileName, _file로 끝나는 필드)
                              if (key.endsWith('_fileName') || key.endsWith('_file')) {
                                return;
                              }
                              
                              // 빈 값이거나 빈 객체인 경우 제외
                              if (value === undefined || value === null || value === '' || 
                                  (typeof value === 'object' && Object.keys(value).length === 0)) {
                                return;
                              }
                              
                              // URL인지 확인
                              const isUrl = typeof value === 'string' && value.match(/^https?:\/\//);
                              const isImage = isUrl && value.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                              
                              // 필드명 변환 (한글 매핑이 있으면 사용, 없으면 원본 사용)
                              const displayLabel = fieldNameMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                              
                              fieldsToDisplay.push({
                                label: displayLabel,
                                value: isImage ? { type: 'image', url: value } : 
                                      isUrl ? { type: 'url', url: value } : value
                              });
                            });
                          }
                          
                          // 필드가 없으면 원본 JSON 표시
                          if (fieldsToDisplay.length === 0) {
                            return (
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <pre className="text-xs whitespace-pre-wrap text-gray-600">
                                  {JSON.stringify(inputData, null, 2)}
                                </pre>
                              </div>
                            );
                          }
                          
                          // 필드별로 이쁘게 표시
                          return fieldsToDisplay.map((field, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-xs font-medium text-gray-700 mb-2">{field.label}</p>
                              {field.value?.type === 'image' ? (
                                <img 
                                  src={field.value.url} 
                                  alt={field.label}
                                  className="max-w-full h-auto rounded-md shadow-sm"
                                  style={{ maxHeight: '200px', objectFit: 'contain' }}
                                />
                              ) : field.value?.type === 'url' ? (
                                <a 
                                  href={field.value.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
                                >
                                  {field.value.url}
                                </a>
                              ) : (
                                <p className="text-gray-800">
                                  {typeof field.value === 'object' && field.value !== null ? 
                                    JSON.stringify(field.value, null, 2) : 
                                    String(field.value)
                                  }
                                </p>
                              )}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export { HistoryPage };