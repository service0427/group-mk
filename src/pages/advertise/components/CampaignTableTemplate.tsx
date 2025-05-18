import React, { Fragment, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Container } from '@/components/container';
import { Navbar } from '@/partials/navbar';
import { PageMenu } from '@/partials/pagemenu';
import { ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { IntroLogo } from '@/partials/intro-logo';
import { toAbsoluteUrl } from '@/utils';
import { useMenus } from '@/providers';
import { useMenuBreadcrumbs, useMenuCurrentItem, KeenIcon } from '@/components';
import { AdMiscFaq } from '@/partials/misc';
import { DataGrid, DataGridColumnHeader } from '@/components';
import { ColumnDef, Column } from '@tanstack/react-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CampaignModal } from '@/components/campaign-modals';
import { getServiceTypeFromPath } from '@/components/campaign-modals/types';

interface ICampaignData {
  id: string;
  title: string;
  description: string;
  logo: string;
  logoSize: string;
  efficiency: string;
  minQuantity: string;
  deadline: string;
  status: {
    label: string;
    color: string;
  };
}

interface CampaignTableTemplateProps {
  serviceTitle: string;
  logoPath: string;
  campaigns: ICampaignData[];
}

// 필터링을 위한 컬럼 필터 컴포넌트
interface IColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

const ColumnInputFilter = <TData, TValue>({ column }: IColumnFilterProps<TData, TValue>) => {
  return (
    <Input
      placeholder="필터링..."
      value={(column.getFilterValue() as string) ?? ''}
      onChange={(event) => column.setFilterValue(event.target.value)}
      className="h-9 w-full max-w-40"
    />
  );
};

const CampaignTableTemplate: React.FC<CampaignTableTemplateProps> = ({
  serviceTitle,
  logoPath,
  campaigns
}) => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const menuItem = useMenuCurrentItem(pathname, menuConfig);
  const breadcrumbs = useMenuBreadcrumbs(pathname, menuConfig);
  const [searchInput, setSearchInput] = useState('');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<ICampaignData | null>(null);

  // breadcrumbs 정보에서 상위 메뉴 찾기
  const parentMenu = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2].title : '';

  // 캠페인 페이지 타이틀 생성
  const pageTitle = "캠페인 소개";

  // 서비스 카테고리 생성 - NS 트래픽, NP 저장 등의 형식으로 표시
  let serviceCategory = '';
  if (pathname.includes('naver/shopping/traffic')) {
    serviceCategory = 'NS 트래픽';
  } else if (pathname.includes('naver/place/save')) {
    serviceCategory = 'NP 저장';
  } else if (pathname.includes('naver/place/share')) {
    serviceCategory = 'NP 공유';
  } else if (pathname.includes('naver/place/traffic')) {
    serviceCategory = 'NP 트래픽';
  } else if (pathname.includes('naver/auto')) {
    serviceCategory = 'N 자동완성';
  } else if (pathname.includes('naver/traffic')) {
    serviceCategory = 'N 트래픽';
  } else if (pathname.includes('coupang/traffic')) {
    serviceCategory = 'C 트래픽';
  } else if (pathname.includes('ohouse/traffic')) {
    serviceCategory = 'OH 트래픽';
  } else {
    // URL에서 기본 서비스 정보 추출 (fallback)
    const pathSegments = pathname.split('/').filter(Boolean);
    serviceCategory = pathSegments.length >= 3 ? `${pathSegments[1]} > ${pathSegments[2]}` : '';
  }

  const image = (
    <img
      src={toAbsoluteUrl(logoPath)}
      className="rounded-full border-3 h-[100px] shrink-0"
    />
  );

  // 테이블 컬럼 정의
  const columns = useMemo<ColumnDef<ICampaignData>[]>(
    () => [
      {
        accessorFn: (row) => row.title,
        id: 'campaignName',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="캠페인명"
            filter={<ColumnInputFilter column={column} />}
            column={column}
          />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-4">
              <img
                src={toAbsoluteUrl(`/media/${row.original.logo}`)}
                className="rounded-full size-10 shrink-0"
                alt={row.original.title}
              />
              <span className="text-base font-medium text-gray-900">
                {row.original.title}
              </span>
            </div>
          );
        },
        meta: {
          className: 'min-w-[220px]',
          cellClassName: 'font-medium',
        }
      },
      {
        accessorFn: (row) => row.description,
        id: 'description',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="캠페인 설명"
            filter={<ColumnInputFilter column={column} />}
            column={column}
          />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          return (
            <div className="line-clamp-2 text-sm text-gray-700">
              {row.original.description}
            </div>
          );
        },
        meta: {
          className: 'min-w-[300px]',
        }
      },
      {
        accessorFn: (row) => row.efficiency,
        id: 'efficiency',
        header: ({ column }) => <DataGridColumnHeader title="상승효율" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          return (
            <div className="text-center">
              <span className="text-base font-medium text-primary">
                {row.original.efficiency}
              </span>
            </div>
          );
        },
        meta: {
          className: 'min-w-[100px]',
          cellClassName: 'text-center',
        }
      },
      {
        accessorFn: (row) => row.minQuantity,
        id: 'minQuantity',
        header: ({ column }) => <DataGridColumnHeader title="최소수량" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          return (
            <div className="text-center">
              <span className="text-sm text-gray-900">
                {row.original.minQuantity}
              </span>
            </div>
          );
        },
        meta: {
          className: 'min-w-[100px]',
          cellClassName: 'text-center',
        }
      },
      {
        accessorFn: (row) => row.deadline,
        id: 'deadline',
        header: ({ column }) => <DataGridColumnHeader title="접수마감시간" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          return (
            <div className="text-center">
              <span className="text-sm text-gray-900">
                {row.original.deadline}
              </span>
            </div>
          );
        },
        meta: {
          className: 'min-w-[120px]',
          cellClassName: 'text-center',
        }
      },
      {
        accessorFn: (row) => row.status.label,
        id: 'status',
        header: ({ column }) => <DataGridColumnHeader title="상태" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          return (
            <div className="text-center">
              <span className={`badge badge-${row.original.status.color} shrink-0 badge-outline rounded-[30px]`}>
                <span className={`size-1.5 rounded-full bg-${row.original.status.color} me-1.5`}></span>
                {row.original.status.label}
              </span>
            </div>
          );
        },
        meta: {
          className: 'min-w-[120px]',
          cellClassName: 'text-center',
        }
      },
      {
        id: 'actions',
        header: () => <div className="text-center">상세설정</div>,
        enableSorting: false,
        cell: ({ row }) => {
          return (
            <div className="flex justify-center gap-2">
              <button 
                className="btn btn-sm btn-primary"
                onClick={() => {
                  setSelectedCampaign(row.original);
                  setDetailModalOpen(true);
                }}
              >
                신청하기
              </button>
            </div>
          );
        },
        meta: {
          headerClassName: 'text-center',
          className: 'w-[120px]',
          cellClassName: 'text-center',
        }
      }
    ],
    []
  );

  // 툴바 컴포넌트
  const Toolbar = () => {
    return (
      <div className="card-header flex-wrap gap-2 border-b-0 px-5">
        <h3 className="card-title font-medium text-sm">전체 {campaigns.length}개 캠페인</h3>

        <div className="flex flex-wrap gap-2 lg:gap-5">
          <div className="flex">
            <label className="input input-sm">
              <KeenIcon icon="magnifier" />
              <input
                type="text"
                placeholder="캠페인명 검색"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Select defaultValue="all">
              <SelectTrigger className="w-28" size="sm">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent className="w-32">
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="active">진행중</SelectItem>
                <SelectItem value="pending">준비중</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Fragment>
      <Container>
        <Navbar>
          <PageMenu />
        </Navbar>

        <ToolbarHeading>
          <ToolbarPageTitle customTitle={pageTitle} />
          <ToolbarDescription>
            캠페인 소개 &gt; {serviceCategory}
          </ToolbarDescription>
        </ToolbarHeading>
        <IntroLogo
          name={serviceTitle}
          image={image}
          info={[
            { label: `${serviceTitle}의 캠페인을 소개합니다`, icon: 'information-3 text-primary' },
          ]}
        />
      </Container>
      <Container>
        <div className="grid gap-5 lg:gap-7.5">
          <DataGrid
            columns={columns}
            data={campaigns}
            pagination={{ size: 10 }}
            sorting={[{ id: 'campaignName', desc: false }]}
            toolbar={<Toolbar />}
            layout={{ card: true }}
          />

          <AdMiscFaq />
        </div>
      </Container>

      {/* 캠페인 상세 모달 */}
      {selectedCampaign && (
        <CampaignModal
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          serviceType={serviceCategory}
          onSave={(newCampaign) => {
            // 캠페인이 성공적으로 생성되면 모달 닫기
            setDetailModalOpen(false);
            // 성공 메시지
            alert(`${newCampaign.campaignName} 캠페인이 신청되었습니다.`);
          }}
        />
      )}
    </Fragment>
  );
};

export default CampaignTableTemplate;