import React, { useEffect, useState } from 'react'
import WithdrawRequestSearchBar from './components/WithdrawRequestSearchBar'
import { WithdrawRequestList } from './components/WithdrawRequestList'
import { getWithdrawApproveList } from './services/withdrawService'
import { CommonTemplate } from '@/components/pageTemplate'
import { Button } from '@/components/ui/button'
import { exportWithdrawRequestsToExcel } from '../cash/services/cashExcelExportService'

// 출금 요청 인터페이스
export interface WithdrawRequest {
  id: number
  username: string
  requestDate: string
  amount: number
  bankName: string
  accountNumber: string
  status: 'pending' | 'approved' | 'rejected'
  businessName?: string
  businessNumber?: string
  email?: string
}

// 검색 파라미터 인터페이스
export interface SearchParams {
  username: string
  startDate: string
  endDate: string
  status: string
}

export const WithdrawApprovePage: React.FC = () => {
  // 상태 관리
  const [requests, setRequests] = useState<WithdrawRequest[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [searchParams, setSearchParams] = useState<SearchParams>({
    username: '',
    startDate: '',
    endDate: '',
    status: 'all', // 기본값을 전체(all)로 설정
  })
  const [totalItems, setTotalItems] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage] = useState<number>(10)

  // 실제 API 호출로 데이터 가져오기
  const fetchData = async () => {
    setLoading(true)

    try {
      // API 호출로 실제 데이터 가져오기
      const response = await getWithdrawApproveList()

      // 필터링 로직
      let filteredData = [...response]

      if (searchParams.username) {
        filteredData = filteredData.filter(item =>
          item.users.full_name?.toLowerCase().includes(searchParams.username.toLowerCase())
        )
      }

      if (searchParams.status && searchParams.status !== 'all') {
        filteredData = filteredData.filter(item =>
          item.status === searchParams.status
        )
      }

      if (searchParams.startDate && searchParams.endDate) {
        filteredData = filteredData.filter(item => {
          // created_at 필드를 사용
          const itemDate = new Date(item.created_at)
          const start = new Date(searchParams.startDate)
          const end = new Date(searchParams.endDate)
          return itemDate >= start && itemDate <= end
        })
      }

      // 상태 기준으로 정렬 (대기중 -> 승인 -> 반려 순서)
      // 같은 상태일 경우 최신순으로 정렬
      filteredData.sort((a, b) => {
        const statusOrder: Record<string, number> = { pending: 0, approved: 1, rejected: 2 };
        const statusA = statusOrder[a.status] || 0;
        const statusB = statusOrder[b.status] || 0;

        // 상태가 다르면 상태 순서대로
        if (statusA !== statusB) {
          return statusA - statusB;
        }

        // 상태가 같으면 최신 날짜 순으로 (내림차순)
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });

      setTotalItems(filteredData.length)

      // 페이지네이션 처리
      const startIndex = (currentPage - 1) * itemsPerPage
      const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

      // 데이터 변환 (필요한 경우)
      const formattedData = paginatedData.map(item => ({
        id: item.id,
        username: item.users?.full_name || '알 수 없음',
        requestDate: new Date(item.created_at).toISOString().split('T')[0],
        amount: item.amount,
        bankName: item.bank_name,
        accountNumber: item.account_number,
        status: item.status,
        businessName: item.users?.business?.business_name || '',
        businessNumber: item.users?.business?.business_number || '',
        email: item.users?.email || ''
      }))

      setRequests(formattedData)
    } catch (error) {

      // 에러 처리 로직
    } finally {
      setLoading(false)
    }
  }

  // 요청 업데이트 후 데이터 다시 가져오기
  const handleRequestUpdated = () => {
    fetchData()
  }

  // 검색 파라미터 변경 시 데이터 재로딩
  const handleSearch = (params: any) => {
    // 검색 파라미터 변환 (SearchBar 컴포넌트에서 받는 파라미터 구조가 다를 수 있음)
    const convertedParams: SearchParams = {
      username: params.searchKeyword,
      startDate: params.startDate || '',
      endDate: params.endDate || '',
      status: params.status || 'all', // 상태가 없으면 기본값 'all' 사용
    }

    setSearchParams(convertedParams)
    setCurrentPage(1) // 검색 시 첫 페이지로 이동
  }

  // 페이지 변경 처리
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // 엑셀 다운로드 핸들러
  const handleExcelDownload = () => {
    if (requests.length === 0) {
      alert('내보낼 데이터가 없습니다.')
      return
    }

    const result = exportWithdrawRequestsToExcel(requests)
    if (result.success) {
      alert('엑셀 파일이 다운로드되었습니다.')
    } else {
      alert(result.error || '엑셀 다운로드 중 오류가 발생했습니다.')
    }
  }

  // 툴바 액션 버튼
  const toolbarActions = (
    <Button
      variant="outline"
      size="sm"
      className="bg-primary-600 text-white hover:bg-primary-700"
      onClick={handleExcelDownload}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      내보내기
    </Button>
  )

  // 컴포넌트 마운트 시와 검색 파라미터, 페이지 변경 시 데이터 로드
  useEffect(() => {
    fetchData()
  }, [searchParams, currentPage])

  return (
    <CommonTemplate
      title="운영자 출금 승인 관리"
      description="총판 출금 요청을 승인하거나 관리합니다."
      toolbarActions={toolbarActions}
      showPageMenu={false}
    >
      <div className="card shadow-sm bg-card">
        <div className="card-header p-6 pb-5 flex justify-between items-center">
          <div>
            <h3 className="card-title text-lg font-semibold">출금 요청 목록</h3>
            <p className="mt-1 text-sm text-gray-500">총 {totalItems}개의 요청이 있습니다</p>
          </div>
        </div>

        <div className="card-body p-6">
          {/* 검색 영역 */}
          <WithdrawRequestSearchBar
            onSearch={handleSearch}
            initialParams={searchParams}
          />

          {/* 리스트 영역 */}
          <WithdrawRequestList
            requests={requests}
            loading={loading}
            totalItems={totalItems}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onRequestUpdated={handleRequestUpdated}
          />
        </div>
      </div>
    </CommonTemplate>
  )
}

export default WithdrawApprovePage