import React, { useEffect, useState } from 'react'
import BasicTemplate from '../components/BasicTemplate'
import WithdrawRequestSearchBar from './components/WithdrawRequestSearchBar'
import { WithdrawRequestList } from './components/WithdrawRequestList'

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

  // 임시 데이터 (실제로는 API 호출로 대체)
  const fetchData = () => {
    setLoading(true)
    
    // 실제 서비스에서는 API 호출로 대체
    const mockData: WithdrawRequest[] = [
      {
        id: 1,
        username: '사용자1',
        requestDate: '2025-04-20',
        amount: 500000,
        bankName: '신한은행',
        accountNumber: '110-123-456789',
        status: 'pending',
      },
      {
        id: 2,
        username: '사용자2',
        requestDate: '2025-04-21',
        amount: 1000000,
        bankName: '국민은행',
        accountNumber: '123-12-123456',
        status: 'pending',
      },
      {
        id: 3,
        username: '사용자3',
        requestDate: '2025-04-22',
        amount: 750000,
        bankName: '우리은행',
        accountNumber: '1002-123-123456',
        status: 'approved',
      },
      {
        id: 4,
        username: '사용자4',
        requestDate: '2025-04-23',
        amount: 250000,
        bankName: '하나은행',
        accountNumber: '123-4567-89012',
        status: 'rejected',
      },
      {
        id: 5,
        username: '사용자5',
        requestDate: '2025-04-24',
        amount: 1500000,
        bankName: '농협은행',
        accountNumber: '352-0123-4567-89',
        status: 'pending',
      },
    ]
    
    // 필터링 로직
    let filteredData = [...mockData]
    
    if (searchParams.username) {
      filteredData = filteredData.filter(item => 
        item.username.includes(searchParams.username)
      )
    }
    
    if (searchParams.status) {
      filteredData = filteredData.filter(item => 
        item.status === searchParams.status
      )
    }
    
    if (searchParams.startDate && searchParams.endDate) {
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.requestDate)
        const start = new Date(searchParams.startDate)
        const end = new Date(searchParams.endDate)
        return itemDate >= start && itemDate <= end
      })
    }
    
    setTotalItems(filteredData.length)
    
    // 페이지네이션 처리
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)
    
    setRequests(paginatedData)
    setLoading(false)
  }

  // 검색 파라미터 변경 시 데이터 재로딩
  const handleSearch = (params: any) => {
    // 검색 파라미터 변환 (SearchBar 컴포넌트에서 받는 파라미터 구조가 다를 수 있음)
    const convertedParams: SearchParams = {
      username: params.searchKeyword,
      startDate: params.startDate || '',
      endDate: params.endDate || '',
      status: '',
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
            />
          </div>
        </div>
      </div>
    </BasicTemplate>
  )
}

export default WithdrawApprovePage