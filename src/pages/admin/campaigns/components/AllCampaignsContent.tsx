import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { ICampaign } from './CampaignContent';
import { updateCampaignStatus } from '../services/campaignService';
import { formatImageUrl } from '@/utils/CampaignFormat';
import { toAbsoluteUrl } from '@/utils';
import { CampaignModal } from '@/components/campaign-modals';
import { updateCampaign } from '../services/campaignService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KeenIcon } from '@/components';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// 페이지네이션 컴포넌트
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number,
  totalPages: number,
  onPageChange: (page: number) => void
}) => {
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <KeenIcon icon="arrow-left" className="size-3" />
      </Button>

      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        // 페이지 버튼 표시 로직
        let pageNum;
        if (totalPages <= 5) {
          // 5페이지 이하면 모든 페이지 버튼 표시
          pageNum = i + 1;
        } else if (currentPage <= 3) {
          // 현재 페이지가 1-3이면 1-5 표시
          pageNum = i + 1;
        } else if (currentPage >= totalPages - 2) {
          // 현재 페이지가 끝에서 3번째 이내면 마지막 5개 표시
          pageNum = totalPages - 4 + i;
        } else {
          // 그 외에는 현재 페이지 중심으로 2개씩 앞뒤로 표시
          pageNum = currentPage - 2 + i;
        }

        return (
          <Button
            key={pageNum}
            variant={currentPage === pageNum ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(pageNum)}
            className={`${currentPage === pageNum ? 'bg-primary text-white' : ''}`}
          >
            {pageNum}
          </Button>
        );
      })}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <KeenIcon icon="arrow-right" className="size-3" />
      </Button>
    </div>
  );
};

interface AllCampaignsContentProps {
  campaigns: ICampaign[];
  onCampaignUpdated: () => void;
}

export const AllCampaignsContent: React.FC<AllCampaignsContentProps> = ({
  campaigns,
  onCampaignUpdated
}) => {
  // 상태 필터
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 서비스 타입 필터
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  // 검색어
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 정렬 기준
  const [sortBy, setSortBy] = useState<string>('updated_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // 상세 모달
  const [selectedCampaign, setSelectedCampaign] = useState<ICampaign | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);

  // 필터링된 캠페인
  const filteredCampaigns = campaigns.filter(campaign => {
    // 상태 필터링
    if (statusFilter !== 'all' && campaign.status.status !== statusFilter) {
      return false;
    }

    // 서비스 타입 필터링
    if (serviceFilter !== 'all' && campaign.serviceType !== serviceFilter) {
      return false;
    }

    // 검색어 필터링
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      return (
        campaign.campaignName.toLowerCase().includes(lowerSearchTerm) ||
        campaign.description.toLowerCase().includes(lowerSearchTerm) ||
        campaign.id.includes(lowerSearchTerm) ||
        (campaign.matId && campaign.matId.toString().includes(lowerSearchTerm))
      );
    }

    return true;
  });

  // 정렬
  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'name':
        aValue = a.campaignName.toLowerCase();
        bValue = b.campaignName.toLowerCase();
        break;
      case 'status':
        aValue = a.status.status;
        bValue = b.status.status;
        break;
      case 'service':
        aValue = a.serviceType;
        bValue = b.serviceType;
        break;
      case 'created_at':
        aValue = a.originalData?.created_at || '';
        bValue = b.originalData?.created_at || '';
        break;
      case 'updated_at':
      default:
        aValue = a.originalData?.updated_at || '';
        bValue = b.originalData?.updated_at || '';
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // 페이지네이션
  const totalPages = Math.max(1, Math.ceil(sortedCampaigns.length / itemsPerPage));
  const paginatedCampaigns = sortedCampaigns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 모달 열기
  const handleOpenDetail = (campaign: ICampaign) => {
    setSelectedCampaign(campaign);
    setDetailModalOpen(true);
  };

  // 모달 닫기
  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setSelectedCampaign(null);
  };

  // 모달에서 저장 성공 시 처리
  const handleCampaignUpdated = () => {
    onCampaignUpdated();
  };

  // 빠른 상태 변경 핸들러
  const handleQuickStatusChange = async (campaignId: string, newStatus: string) => {
    try {
      await updateCampaignStatus(parseInt(campaignId), newStatus);
      onCampaignUpdated();
    } catch (error) {

    }
  };

  // 사용 가능한 서비스 유형 목록
  const availableServices = Array.from(
    new Set(campaigns.map(campaign => campaign.serviceType || ''))
  ).filter(service => service !== '').sort();

  // 상태 필터 변경 시 1페이지로 돌아가기
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, serviceFilter, searchTerm]);

  // 정렬 방향 토글 핸들러
  const toggleSortDirection = useCallback(() => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  // 정렬 핸들러
  const handleSort = useCallback((field: string) => {
    if (sortBy === field) {
      toggleSortDirection();
    } else {
      setSortBy(field);
      setSortDirection('desc'); // 기본은 내림차순
    }
  }, [sortBy, toggleSortDirection]);

  return (
    <>
      <Card className="shadow-md overflow-hidden border border-border">
        <div className="p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-xl font-bold">모든 캠페인 ({filteredCampaigns.length}개)</h2>

            {/* 필터 섹션 */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* 검색창 */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="캠페인 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 pr-10"
                />
                <KeenIcon
                  icon="search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </div>

              {/* 상태 필터 */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="상태 필터" />
                </SelectTrigger>
                <SelectContent className="w-44">
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="active">진행중</SelectItem>
                  <SelectItem value="pending">준비중</SelectItem>
                  <SelectItem value="waiting_approval">승인 대기중</SelectItem>
                  <SelectItem value="rejected">반려됨</SelectItem>
                  <SelectItem value="pause">표시안함</SelectItem>
                </SelectContent>
              </Select>

              {/* 서비스 타입 필터 */}
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="서비스 필터" />
                </SelectTrigger>
                <SelectContent className="w-44">
                  <SelectItem value="all">전체 서비스</SelectItem>
                  {availableServices.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 테이블 */}
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead
                    onClick={() => handleSort('name')}
                    className="cursor-pointer hover:bg-muted"
                  >
                    <div className="flex items-center">
                      캠페인 이름
                      {sortBy === 'name' && (
                        <KeenIcon
                          icon={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                          className="ml-1 size-3"
                        />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort('service')}
                    className="cursor-pointer hover:bg-muted"
                  >
                    <div className="flex items-center">
                      서비스
                      {sortBy === 'service' && (
                        <KeenIcon
                          icon={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                          className="ml-1 size-3"
                        />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort('status')}
                    className="cursor-pointer hover:bg-muted"
                  >
                    <div className="flex items-center">
                      상태
                      {sortBy === 'status' && (
                        <KeenIcon
                          icon={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                          className="ml-1 size-3"
                        />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort('updated_at')}
                    className="cursor-pointer hover:bg-muted"
                  >
                    <div className="flex items-center">
                      최근 업데이트
                      {sortBy === 'updated_at' && (
                        <KeenIcon
                          icon={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                          className="ml-1 size-3"
                        />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCampaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <KeenIcon icon="document-search" className="size-12 mb-2" />
                        <p>검색 결과가 없습니다.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCampaigns.map((campaign) => (
                    <TableRow key={campaign.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div className="relative mr-3 flex-shrink-0">
                            <img
                              src={formatImageUrl(campaign.logo, campaign.originalData?.add_info, campaign.campaignName)}
                              alt={campaign.campaignName}
                              className="size-10 rounded-full object-cover"
                              onError={(e) => {

                                // 동물 아이콘 목록
                                const animalIcons = [
                                  'bear', 'cat', 'cow', 'crocodile', 'dolphin', 'elephant', 'flamingo',
                                  'giraffe', 'horse', 'kangaroo', 'koala', 'leopard', 'lion', 'llama',
                                  'owl', 'pelican', 'penguin', 'sheep', 'teddy-bear', 'turtle'
                                ];
                                const randomAnimal = animalIcons[Math.floor(Math.random() * animalIcons.length)];
                                e.currentTarget.src = toAbsoluteUrl(`/media/animal/svg/${randomAnimal}.svg`);
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{campaign.campaignName}</p>
                            <p className="text-xs text-muted-foreground">ID: {campaign.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center">
                          <span className="size-2 rounded-full bg-primary mr-2"></span>
                          {campaign.serviceName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className={`badge badge-${campaign.status.color} badge-outline rounded-[30px] h-[28px] py-1 inline-flex items-center justify-center`}>
                            <span className={`size-1.5 rounded-full bg-${campaign.status.color} me-1.5`}></span>
                            {campaign.status.label}
                          </span>

                          {/* 반려된 경우 반려 사유 표시 */}
                          {campaign.status.status === 'rejected' && campaign.originalData?.rejected_reason && (
                            <div className="text-xs text-red-500 max-w-[200px] truncate mt-1" title={campaign.originalData.rejected_reason}>
                              <span className="font-medium">반려 사유:</span> {campaign.originalData.rejected_reason}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {campaign.updatedAt}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* 승인 대기 상태인 경우 빠른 승인/반려 버튼 제공 */}
                          {campaign.status.status === 'waiting_approval' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-500 hover:bg-green-600"
                                onClick={() => handleQuickStatusChange(campaign.id, 'pending')}
                              >
                                준비상태로 승인
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => handleOpenDetail(campaign)}
                              >
                                반려
                              </Button>
                            </>
                          )}

                          {/* 상세 버튼은 항상 표시 */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDetail(campaign)}
                          >
                            상세
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </Card>

      {/* 캠페인 상세 모달 - 운영자 모드로 열기 (통합된 CampaignModal 사용) */}
      {selectedCampaign && (
        <CampaignModal
          open={detailModalOpen}
          onClose={handleCloseDetail}
          campaign={selectedCampaign}
          onSave={handleCampaignUpdated}
          isDetailMode={true}
          isOperator={true} // 운영자 모드 활성화
          updateCampaign={updateCampaign}
          serviceType={selectedCampaign?.serviceType}
        />
      )}
    </>
  );
};