import React, { Fragment, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Container } from '@/components/container';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { useMenus } from '@/providers';
import { useMenuBreadcrumbs, useMenuCurrentItem } from '@/components';
import { IMenuItemConfig, TMenuConfig } from '@/components/menu';

interface BasicTemplateProps {
  title: string;
  description?: string;
}

const BasicTemplate: React.FC<BasicTemplateProps> = ({ title, description }) => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const menuItem = useMenuCurrentItem(pathname, menuConfig);
  const breadcrumbs = useMenuBreadcrumbs(pathname, menuConfig);

  // 페이지 타이틀 및 설명 생성
  const pageTitle = title || "사이트맵";
  const pageDescription = description || "전체 서비스 구조를 확인하세요";

  // 메뉴 구조 카테고리 분류
  const [categories, setCategories] = useState<{ [key: string]: TMenuConfig }>({});

  useEffect(() => {
    if (!menuConfig) return;

    // 메뉴 카테고리별로 분류
    const categorizedMenu: { [key: string]: TMenuConfig } = {};

    // 기본 카테고리 설정
    categorizedMenu["대시보드"] = [];
    categorizedMenu["정보"] = [];
    categorizedMenu["서비스"] = [];
    categorizedMenu["내 정보"] = [];
    categorizedMenu["관리자"] = [];

    // 메뉴 항목 분류
    menuConfig.forEach((item: IMenuItemConfig) => {
      if (item.heading) {
        return; // 헤딩은 건너뛰기
      }

      if (item.title === 'Dashboard') {
        categorizedMenu["대시보드"].push(item);
      } else if (item.title === '공지사항' || item.title === 'FAQ' || item.title === '사이트맵') {
        categorizedMenu["정보"].push(item);
      } else if (
        item.title === 'NAVER 쇼핑' ||
        item.title === 'NAVER 플레이스' ||
        item.title === 'NAVER 자동완성' ||
        item.title === 'NAVER 트래픽' ||
        item.title === 'COUPANG 쇼핑' ||
        item.title === '오늘의집' ||
        item.title === '블로그 리뷰'
      ) {
        categorizedMenu["서비스"].push(item);
      } else if (item.title === '내 정보 관리') {
        categorizedMenu["내 정보"].push(item);
      } else if (
        item.title === '사이트 관리' ||
        item.title === '사용자 관리' ||
        item.title === '캠페인 관리' ||
        item.title === '슬롯 관리'
      ) {
        categorizedMenu["관리자"].push(item);
      }
    });

    setCategories(categorizedMenu);
  }, [menuConfig]);

  // 메뉴 아이템 렌더링 함수
  const renderMenuItem = (item: IMenuItemConfig, depth: number = 0) => {
    const paddingLeft = `${depth * 1.5}rem`;

    return (
      <div key={item.title + (item.path || '')}>
        <div
          className="py-2 flex items-center"
          style={{ marginLeft: paddingLeft }}
        >
          {item.icon && (
            <span className="mr-2">
              <i className={`ki-${item.icon}`}></i>
            </span>
          )}

          {item.path ? (
            <a
              href={item.path}
              className="text-gray-700 hover:text-primary font-medium"
              style={{
                fontSize: depth === 0 ? '1rem' : '0.875rem',
                fontWeight: depth === 0 ? 600 : 400
              }}
            >
              {item.title}
            </a>
          ) : (
            <span
              className="text-gray-700 font-medium"
              style={{
                fontSize: depth === 0 ? '1rem' : '0.875rem',
                fontWeight: depth === 0 ? 600 : 400
              }}
            >
              {item.title}
            </span>
          )}

          {item.disabled && (
            <span className="ml-2 badge badge-xs">Soon</span>
          )}
        </div>

        {item.children && item.children.length > 0 && (
          <div>
            {item.children.map(child => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle customTitle={pageTitle} />
            <ToolbarDescription>{pageDescription}</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <div className="grid gap-5 lg:gap-7.5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(categories)
            .filter(([_, items]) => items.length > 0)
            .map(([category, items]) => (
              <div key={category} className="bg-card rounded-lg shadow-sm overflow-hidden">
                <div className="p-5 flex justify-between items-center border-b">
                  <h3 className="text-lg font-medium text-card-foreground">
                    {category}
                  </h3>
                </div>
                <div className="p-5">
                  {items.map(item => renderMenuItem(item))}
                </div>
              </div>
            ))}
        </div>
      </Container>
    </>
  );
};

export default BasicTemplate;