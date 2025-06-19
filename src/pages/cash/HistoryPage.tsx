import { useState, useEffect } from 'react';
import { Container } from '@/components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  CircleDollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Eye
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
        console.log('거래 내역 데이터:', historyResult.data); // 디버깅용
        // 슬롯 거래만 필터링해서 확인
        const slotTransactions = historyResult.data.filter((t: any) => t.reference_id);
        console.log('reference_id가 있는 거래:', slotTransactions);
        console.log('슬롯 거래로 인식된 거래:', historyResult.data.filter((t: any) => t.is_slot_transaction));
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
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
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
                    <th className="text-left py-3 px-4 font-medium text-gray-900 w-40 lg:w-44">날짜</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 w-28 lg:w-32">구분</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">내용</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 w-24 lg:w-28">금액</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 w-16 lg:w-20">타입</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900 w-20">상세보기</th>
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
                        <td className="py-3 px-4 text-sm">
                          {format(new Date(transaction.transaction_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(transaction.transaction_type)}
                            <span className="text-sm font-medium">
                              {getTransactionTypeName(transaction.transaction_type)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {transaction.is_slot_transaction ? (
                            <div>
                              {/* 키워드 테이블에서 가져온 경우 */}
                              {transaction.main_keyword ? (
                                <>
                                  <div className="text-xs font-medium text-gray-900">
                                    {transaction.main_keyword}
                                  </div>
                                  {(transaction.keyword1 || transaction.keyword2 || transaction.keyword3) && (
                                    <div className="text-xs text-gray-500 mt-0.5">
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
                                      
                                      // 디버깅
                                      console.log('Transaction:', transaction.id, {
                                        service_type: transaction.service_type,
                                        inputData,
                                        campaignAddInfo,
                                        is_slot_transaction: transaction.is_slot_transaction
                                      });
                                      
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
                                          
                                          console.log('Field check:', { fieldName, fieldLabel, value });
                                          
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
                                          <div className="text-xs font-medium text-gray-900">
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
                                <div className="text-xs text-blue-600 mt-1">
                                  {transaction.campaign_name} <span className='text-green-600'>[{SERVICE_TYPE_LABELS[transaction.service_type as keyof typeof SERVICE_TYPE_LABELS] || transaction.service_type}] </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            transaction.description || '-'
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {formatAmount(transaction.amount, transaction.transaction_type)}
                        </td>
                        <td className="py-3 px-4">
                          {transaction.balance_type && (
                            <Badge variant="outline" className="text-xs">
                              {transaction.balance_type === 'free' ? '무료' : 
                               transaction.balance_type === 'paid' ? '유료' : '혼합'}
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {transaction.is_slot_transaction && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setSelectedTransaction(transaction)}
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
                      <div className="text-right">
                        {formatAmount(transaction.amount, transaction.transaction_type)}
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
                          transaction.description || '-'
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
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">거래 상세 정보</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTransaction(null)}
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                {/* 기본 정보 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">거래일시</p>
                    <p className="font-medium">{format(new Date(selectedTransaction.transaction_at), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">거래 유형</p>
                    <p className="font-medium">{getTransactionTypeName(selectedTransaction.transaction_type)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">금액</p>
                    <p className="font-medium">{formatAmount(selectedTransaction.amount, selectedTransaction.transaction_type)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">잔액 타입</p>
                    <p className="font-medium">{selectedTransaction.balance_type || '-'}</p>
                  </div>
                </div>
                
                {/* 슬롯 정보 */}
                {selectedTransaction.is_slot_transaction && (
                  <>
                    <hr />
                    <div>
                      <h4 className="font-medium mb-2">슬롯 정보</h4>
                      {selectedTransaction.campaign_name && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-500">캠페인</p>
                          <p>{selectedTransaction.campaign_name} - {SERVICE_TYPE_LABELS[selectedTransaction.service_type as keyof typeof SERVICE_TYPE_LABELS] || selectedTransaction.service_type}</p>
                        </div>
                      )}
                      {selectedTransaction.user_slot_number && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-500">슬롯 번호</p>
                          <p>#{selectedTransaction.user_slot_number}</p>
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
                      <h4 className="font-medium mb-2">상세 정보</h4>
                      <div className="bg-gray-50 p-3 rounded">
                        <pre className="text-xs whitespace-pre-wrap">
                          {JSON.stringify(selectedTransaction.slot_input_data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export { HistoryPage };