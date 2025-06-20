import React, { useEffect, useState, useCallback } from 'react';
import { useAuthContext } from '@/auth';
import { CommonTemplate } from '@/components/pageTemplate';
import { useCustomToast } from '@/hooks/useCustomToast';
import { hasPermission, PERMISSION_GROUPS, USER_ROLES } from '@/config/roles.config';
import { inquiryService } from '@/services/inquiryService';
import { InquiryChatModal } from '@/components/inquiry';
import { KeenIcon } from '@/components';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Inquiry, InquiryStatus, InquiryPriority } from '@/types/inquiry.types';

const InquiryListPage: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuthContext();
  const { showError } = useCustomToast();
  
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // 필터 상태
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<InquiryPriority | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  // 현재 사용자가 총판 이상 권한인지 확인
  const isDistributorOrAdmin = currentUser && hasPermission(currentUser.role, PERMISSION_GROUPS.DISTRIBUTOR);

  // 문의 목록 가져오기
  const fetchInquiries = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      const filter: any = {};
      
      // 일반 사용자는 자신의 문의만 볼 수 있음
      if (!isDistributorOrAdmin) {
        filter.user_id = currentUser.id;
      } else if (currentUser.role === USER_ROLES.DISTRIBUTOR) {
        // 총판은 자신이 담당하는 문의만 볼 수 있음
        filter.distributor_id = currentUser.id;
      }
      
      // 필터 적용
      if (statusFilter) filter.status = statusFilter;
      if (categoryFilter) filter.category = categoryFilter;
      if (priorityFilter) filter.priority = priorityFilter;

      const { data, error } = await inquiryService.getInquiries(filter);

      if (error) throw error;

      // 검색어 필터링
      let filteredData = data || [];
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredData = filteredData.filter(inquiry =>
          inquiry.title.toLowerCase().includes(term) ||
          inquiry.campaigns?.campaign_name?.toLowerCase().includes(term) ||
          inquiry.slots?.slot_name?.toLowerCase().includes(term)
        );
      }

      setInquiries(filteredData);
    } catch (error) {
      console.error('문의 목록 조회 실패:', error);
      showError('문의 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, isDistributorOrAdmin, statusFilter, categoryFilter, priorityFilter, searchTerm, showError]);

  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchInquiries();
    }
  }, [authLoading, currentUser, fetchInquiries]);

  // 문의 열기
  const handleOpenInquiry = (inquiryId: string) => {
    setSelectedInquiry(inquiryId);
    setModalOpen(true);
  };

  // 새 문의 작성
  const handleNewInquiry = () => {
    setSelectedInquiry(null);
    setModalOpen(true);
  };

  // 상태 배지 색상
  const getStatusBadgeClass = (status: InquiryStatus) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'resolved':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'closed':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // 상태 라벨
  const getStatusLabel = (status: InquiryStatus) => {
    switch (status) {
      case 'open':
        return '열림';
      case 'in_progress':
        return '처리중';
      case 'resolved':
        return '해결됨';
      case 'closed':
        return '종료됨';
      default:
        return status;
    }
  };

  // 우선순위 배지 색상
  const getPriorityBadgeClass = (priority: InquiryPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'normal':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'low':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // 우선순위 라벨
  const getPriorityLabel = (priority: InquiryPriority) => {
    switch (priority) {
      case 'urgent':
        return '긴급';
      case 'high':
        return '높음';
      case 'normal':
        return '보통';
      case 'low':
        return '낮음';
      default:
        return priority;
    }
  };

  if (authLoading || loading) {
    return (
      <CommonTemplate
        title="1:1 문의"
        description="1:1 문의 내역을 확인하고 관리합니다."
        showPageMenu={false}
      >
        <div className="flex items-center justify-center h-64">
          <div className="spinner-border text-primary" />
        </div>
      </CommonTemplate>
    );
  }

  return (
    <CommonTemplate
      title="1:1 문의"
      description="1:1 문의 내역을 확인하고 관리합니다."
      showPageMenu={false}
    >
      {/* 검색 및 필터 영역 */}
      <div className="card shadow-sm mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">상태</label>
              <select
                className="select select-bordered w-full"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as InquiryStatus | '')}
              >
                <option value="">전체</option>
                <option value="open">열림</option>
                <option value="in_progress">처리중</option>
                <option value="resolved">해결됨</option>
                <option value="closed">종료됨</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">카테고리</label>
              <select
                className="select select-bordered w-full"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">전체</option>
                <option value="일반문의">일반문의</option>
                <option value="기술지원">기술지원</option>
                <option value="결제문의">결제문의</option>
                <option value="계정문의">계정문의</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">우선순위</label>
              <select
                className="select select-bordered w-full"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as InquiryPriority | '')}
              >
                <option value="">전체</option>
                <option value="urgent">긴급</option>
                <option value="high">높음</option>
                <option value="normal">보통</option>
                <option value="low">낮음</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">검색</label>
              <div className="relative">
                <input
                  type="text"
                  className="input input-bordered w-full pr-10"
                  placeholder="제목, 캠페인, 슬롯명 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <KeenIcon 
                  icon="magnifier" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button
                variant="default"
                onClick={handleNewInquiry}
                className="w-full"
              >
                <KeenIcon icon="plus" className="size-4 me-2" />
                새 문의
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 문의 목록 */}
      <div className="card shadow-sm">
        <div className="card-body">
          {inquiries.length === 0 ? (
            <div className="text-center py-12">
              <KeenIcon icon="messages" className="size-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">문의 내역이 없습니다.</p>
              <Button
                variant="default"
                onClick={handleNewInquiry}
                className="mt-4"
              >
                새 문의 작성
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>제목</th>
                    <th>카테고리</th>
                    <th>상태</th>
                    <th>우선순위</th>
                    <th>관련 캠페인/슬롯</th>
                    <th>작성일</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((inquiry) => (
                    <tr key={inquiry.id} className="hover">
                      <td>
                        <div className="font-medium">{inquiry.title}</div>
                        {isDistributorOrAdmin && inquiry.users && (
                          <div className="text-xs text-gray-500">
                            {inquiry.users.full_name || inquiry.users.email}
                          </div>
                        )}
                      </td>
                      <td>{inquiry.category || '-'}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(inquiry.status)}`}>
                          {getStatusLabel(inquiry.status)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getPriorityBadgeClass(inquiry.priority)}`}>
                          {getPriorityLabel(inquiry.priority)}
                        </span>
                      </td>
                      <td>
                        {inquiry.campaigns ? (
                          <div className="text-sm">
                            <div className="font-medium">{inquiry.campaigns.campaign_name}</div>
                            {inquiry.slots && (
                              <div className="text-xs text-gray-500">{inquiry.slots.slot_name}</div>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <div className="text-sm">
                          <div>{format(new Date(inquiry.created_at), 'yyyy-MM-dd HH:mm')}</div>
                          <div className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true, locale: ko })}
                          </div>
                        </div>
                      </td>
                      <td>
                        <Button
                          variant="light"
                          size="sm"
                          onClick={() => handleOpenInquiry(inquiry.id)}
                        >
                          <KeenIcon icon="eye" className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 문의 채팅 모달 */}
      <InquiryChatModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedInquiry(null);
          fetchInquiries(); // 목록 새로고침
        }}
        inquiryId={selectedInquiry || undefined}
      />
    </CommonTemplate>
  );
};

export { InquiryListPage };