import React, { Fragment, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Container } from '@/components/container';
import { Navbar } from '@/partials/navbar';
import { PageMenu } from '@/pages/public-profile';
import { Toolbar, ToolbarActions, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { useMenus } from '@/providers';
import { useMenuBreadcrumbs, KeenIcon } from '@/components';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdMiscFaq } from '@/partials/misc';

interface CampaignTemplateProps {
  title: string;
  description?: string;
  serviceCode?: string;
}

const CampaignTemplate: React.FC<CampaignTemplateProps> = ({ title, description, serviceCode }) => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const breadcrumbs = useMenuBreadcrumbs(pathname, menuConfig);

  // breadcrumbs 정보에서 상위 메뉴 찾기
  const parentMenu = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2].title : '';

  // 캠페인 페이지 타이틀 생성
  const pageTitle = title || "캠페인 리스트";

  // 페이지 설명 생성
  const pageDescription = description || `${parentMenu} > ${pageTitle}`;

  // 서비스 카테고리 생성 - 파라미터로 받은 serviceCode 사용
  const serviceCategory = serviceCode || '';
  console.log(serviceCategory);

  const [searchInput, setSearchInput] = useState('');

  return (
    <Fragment>
      <Container>
        <Navbar>
          <PageMenu />
        </Navbar>

        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle customTitle={pageTitle} />
            <ToolbarDescription>
              {pageDescription}
            </ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <a href="#" className="btn btn-sm btn-light">
              양식 엑셀 다운로드
            </a>
            <a href="#" className="btn btn-sm btn-primary">
              엑셀 업로드
            </a>
          </ToolbarActions>
        </Toolbar>
      </Container>
      <Container>
        <div className="grid gap-5 lg:gap-7.5">
          <div className="card">
            <div className="card-header flex-wrap gap-2 border-b-0 px-5">
              <h3 className="card-title font-medium text-sm">전체 n 건</h3>

              <div className="flex flex-wrap gap-2 lg:gap-5">
                <div className="flex">
                  <label className="input input-sm">
                    <KeenIcon icon="magnifier" />
                    <input
                      type="text"
                      placeholder="검색어 입력"
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
                      <SelectItem value="approval">승인요청</SelectItem>
                      <SelectItem value="approved">승인완료</SelectItem>
                      <SelectItem value="reject">반려</SelectItem>
                      <SelectItem value="wating">대기중</SelectItem>
                      <SelectItem value="active">진행중</SelectItem>
                      <SelectItem value="pause">일시중단</SelectItem>
                      <SelectItem value="expire">만료</SelectItem>
                      <SelectItem value="force-stop">강제종료</SelectItem>
                    </SelectContent>
                  </Select>

                  <button className="btn btn-sm btn-outline btn-primary">
                    <KeenIcon icon="setting-4" /> 필터 검색
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              {/* 테이블 내용 */}
            </div>
            <div className="card-footer">
              {/* 페이지네이션 */}
            </div>
          </div>

          <AdMiscFaq />
        </div>
      </Container>
    </Fragment>
  );
};

export default CampaignTemplate;