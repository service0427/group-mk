import React, { Fragment } from 'react';
import { useLocation } from 'react-router-dom';
import { Container } from '@/components/container';
import { Navbar } from '@/partials/navbar';
import { PageMenu } from '@/pages/public-profile';
import { Toolbar, ToolbarActions, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { useMenus } from '@/providers';
import { useMenuBreadcrumbs } from '@/components';
import { AdMiscFaq } from '@/partials/misc';
import { CampaignContent } from './CampaignContent';
import { getCampaignsByService } from '../data';

interface CampaignTemplateProps {
  title: string;
  description?: string;
  serviceCode?: string;
  customContent?: React.ReactNode;
}

const CampaignTemplate: React.FC<CampaignTemplateProps> = ({ 
  title, 
  description, 
  serviceCode = '',
  customContent 
}) => {
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

  // 현재 경로에서 서비스 유형 추출
  const pathSegments = pathname.split('/');
  const serviceType = pathSegments[pathSegments.length - 1];

  // 서비스 코드에 따른 캠페인 데이터 가져오기
  const campaignData = getCampaignsByService(serviceCode);

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
          {customContent ? (
            customContent
          ) : (
            <CampaignContent 
              campaigns={campaignData} 
              serviceType={serviceType} 
            />
          )}
          <AdMiscFaq />
        </div>
      </Container>
    </Fragment>
  );
};

export { CampaignTemplate };