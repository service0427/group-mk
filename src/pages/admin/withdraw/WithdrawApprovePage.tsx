import React, { useEffect, useState } from 'react'
import BasicTemplate from '../components/BasicTemplate'
import WithdrawRequestSearchBar from './components/WithdrawRequestSearchBar'
import { WithdrawRequestList } from './components/WithdrawRequestList'
import { getWithdrawApproveList } from './services/withdrawService'

// 출금 요청 인터페이스
export interface WithdrawRequest {
  id: number
  username: string
  requestDate: string
  amount: number
  bankName: string
  accountNumber: string
  status: 'pending' | 'approved' | 'rejected'
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
    status: '',
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
      
      if (searchParams.status) {
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
        status: item.status
      }))
      
      setRequests(formattedData)
    } catch (error) {
      console.error('Failed to fetch withdraw requests:', error)
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
      status: params.status || '',
    }
    
    setSearchParams(convertedParams)
    setCurrentPage(1) // 검색 시 첫 페이지로 이동
  }

  // 페이지 변경 처리
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // 컴포넌트 마운트 시와 검색 파라미터, 페이지 변경 시 데이터 로드
  useEffect(() => {
    fetchData()
  }, [searchParams, currentPage])

  return (
    <BasicTemplate 
      title="출금 승인 관리" 
      description="관리자 메뉴 > 출금 관리 > 출금 승인 관리"
    >
      <div className="w-full max-w-full mx-auto px-4 sm:px-6 md:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">출금 요청 목록</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">총 {totalItems}개의 요청이 있습니다</p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
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
      </div>
    </BasicTemplate>
  )
}

export default WithdrawApprovePage