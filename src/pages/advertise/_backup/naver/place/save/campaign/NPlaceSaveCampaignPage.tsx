import { Fragment } from 'react';

import { Container } from '@/components/container';

import { NPlaceSaveCampaignContent } from '.';
import { Navbar } from '@/partials/navbar';
import { PageMenu } from '@/pages/public-profile';
import { Toolbar, ToolbarActions, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { useLocation } from 'react-router';
import { useMenus } from '@/providers';
import { useMenuBreadcrumbs, useMenuCurrentItem } from '@/components';

const NPlaceSaveCampaignPage = () => {

    const { pathname } = useLocation();
    const { getMenuConfig } = useMenus();
    const menuConfig = getMenuConfig('primary');
    const menuItem = useMenuCurrentItem(pathname, menuConfig);
    const breadcrumbs = useMenuBreadcrumbs(pathname, menuConfig);

    // breadcrumbs 정보에서 상위 메뉴 찾기
    const parentMenu = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2].title : '';


    return (
        <Fragment>
            <Container>
                <Navbar>
                    <PageMenu fallbackIndex={2} />
                </Navbar>

                <Toolbar>
                    <ToolbarHeading>
                        <ToolbarPageTitle />
                        <ToolbarDescription>
                        {parentMenu} &gt; {menuItem?.title} 페이지
                        </ToolbarDescription>
                    </ToolbarHeading>
                    <ToolbarActions>
                        <a href="#" className="btn btn-sm btn-light">
                            엑셀 양식 다운로드
                        </a>
                        <a href="#" className="btn btn-sm btn-primary">
                            엑셀 업로드
                        </a>
                    </ToolbarActions>
                </Toolbar>
            </Container>
            <Container>
                <NPlaceSaveCampaignContent />
            </Container>
        </Fragment>
    );
};

export { NPlaceSaveCampaignPage };
