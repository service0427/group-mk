import { Fragment } from 'react';

import { Container } from '@/components/container';

import { OhouseTrafficIntroContent } from '.';
import { IntroLogo } from '@/partials/intro-logo';
import { toAbsoluteUrl } from '@/utils';
import { Navbar } from '@/partials/navbar';
import { PageMenu } from '@/pages/public-profile';
import { ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { useLocation } from 'react-router';
import { useMenus } from '@/providers';
import { useMenuBreadcrumbs, useMenuCurrentItem } from '@/components';

const OhouseTrafficIntroPage = () => {

    const { pathname } = useLocation();
    const { getMenuConfig } = useMenus();
    const menuConfig = getMenuConfig('primary');
    const menuItem = useMenuCurrentItem(pathname, menuConfig);
    const breadcrumbs = useMenuBreadcrumbs(pathname, menuConfig);

    // breadcrumbs 정보에서 상위 메뉴 찾기
    const parentMenu = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2].title : '';

    const image = (
        <img
            src={toAbsoluteUrl('/media/ad-brand/ohouse.png')}
            className="rounded-full border-3 h-[100px] shrink-0"
        />
    );

    return (
        <Fragment>
            <Container>
                <Navbar>
                    <PageMenu fallbackIndex={2} />
                </Navbar>

                <ToolbarHeading>
                    <ToolbarPageTitle />
                    <ToolbarDescription>
                        {parentMenu} &gt; {menuItem?.title} 페이지
                    </ToolbarDescription>
                </ToolbarHeading>
                <IntroLogo
                    name="오늘의집 트래픽"
                    image={image}
                    info={[
                        { label: '오늘의집 트래픽의 캠페인을 소개합니다.', icon: 'information-3 text-primary' },
                    ]}
                />
            </Container>
            <Container>
                <OhouseTrafficIntroContent mode="cards" />
            </Container>
        </Fragment>
    );
};

export { OhouseTrafficIntroPage };
