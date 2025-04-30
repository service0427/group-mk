import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Container } from '@/components/container';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { useMenus } from '@/providers';
import { useMenuBreadcrumbs, useMenuCurrentItem } from '@/components';
import { IMenuItemConfig, TMenuConfig } from '@/components/menu';
import { KeenIcon } from '@/components/keenicons';

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
  const [activeCategory, setActiveCategory] = useState<string>("전체");

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
    const paddingLeft = `${depth * 20}px`;

    return (
      <div key={item.title + (item.path || '')} className={`mb-1 ${depth === 0 ? 'mt-3' : ''}`}>
        <div
          className={`py-2 flex items-center rounded-md ${depth === 0 ? 'bg-gray-50 dark:bg-coal-500 px-3' : ''}`}
          style={{ paddingLeft: depth !== 0 ? paddingLeft : undefined }}
        >
          {item.icon && (
            <span className={`flex items-center justify-center mr-3 ${depth === 0 ? 'text-primary' : 'text-gray-500'}`}>
              <KeenIcon icon={item.icon} className={depth === 0 ? 'text-lg' : 'text-base'} />
            </span>
          )}

          {item.path ? (
            <Link
              to={item.path}
              className={`hover:text-primary font-medium ${depth === 0 ? 'text-gray-800 font-medium' : 'text-gray-600'}`}
              style={{
                fontSize: depth === 0 ? '1rem' : '0.875rem',
                fontWeight: depth === 0 ? 600 : 400
              }}
            >
              {item.title}
            </Link>
          ) : (
            <span
              className={`font-medium ${depth === 0 ? 'text-gray-800 font-medium' : 'text-gray-600'}`}
              style={{
                fontSize: depth === 0 ? '1rem' : '0.875rem',
                fontWeight: depth === 0 ? 600 : 400
              }}
            >
              {item.title}
            </span>
          )}

          {item.disabled && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-500">Soon</span>
          )}
        </div>

        {item.children && item.children.length > 0 && (
          <div className="border-l-2 border-gray-100 dark:border-coal-400 ml-3 pl-3">
            {item.children.map(child => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // 카테고리 필터 렌더링
  const renderCategoryFilter = () => {
    const allCategories = ["전체", ...Object.keys(categories).filter(cat => categories[cat].length > 0)];

    return (
      <div className="flex flex-wrap gap-2 mb-6">
        {allCategories.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === category
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-coal-400 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-coal-300'
              }`}
          >
            {category}
          </button>
        ))}
      </div>
    );
  };

  // 활성 카테고리에 따른 메뉴 아이템 필터링
  const getFilteredCategories = () => {
    if (activeCategory === "전체") {
      return categories;
    } else {
      const filtered: { [key: string]: TMenuConfig } = {};
      if (categories[activeCategory]) {
        filtered[activeCategory] = categories[activeCategory];
      }
      return filtered;
    }
  };

  return (
    <>
      <Container fullWidth>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle customTitle={pageTitle} />
            <ToolbarDescription>{pageDescription}</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container fullWidth>
        {/* 카테고리 필터 */}
        {renderCategoryFilter()}

        {/* 메뉴 구조 트리 뷰 */}
        <div className="bg-white dark:bg-coal-600 rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">서비스 구조</h2>

          <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {Object.entries(getFilteredCategories())
              .filter(([_, items]) => items.length > 0)
              .map(([category, items]) => (
                <div key={category} className="min-w-0">
                  <div className="mb-3 pb-2 border-b border-gray-200 dark:border-coal-400">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                      {category === "대시보드" && <KeenIcon icon="element-11" className="mr-2 text-primary" />}
                      {category === "정보" && <KeenIcon icon="notification" className="mr-2 text-warning" />}
                      {category === "서비스" && <KeenIcon icon="shop" className="mr-2 text-success" />}
                      {category === "내 정보" && <KeenIcon icon="user-edit" className="mr-2 text-danger" />}
                      {category === "관리자" && <KeenIcon icon="setting-3" className="mr-2 text-info" />}
                      {category}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {items.map(item => renderMenuItem(item))}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* 자주 사용하는 메뉴 바로가기 */}
        <div className="bg-white dark:bg-coal-600 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">자주 사용하는 메뉴</h2>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            <Link
              to="/"
              className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-coal-400 hover:border-primary dark:hover:border-primary hover:bg-gray-50 dark:hover:bg-coal-500 transition-all"
            >
              <KeenIcon icon="element-11" className="text-3xl text-primary mb-3" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">대시보드</span>
            </Link>

            <Link
              to="/notice"
              className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-coal-400 hover:border-primary dark:hover:border-primary hover:bg-gray-50 dark:hover:bg-coal-500 transition-all"
            >
              <KeenIcon icon="notification" className="text-3xl text-warning mb-3" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">공지사항</span>
            </Link>

            <Link
              to="/faq"
              className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-coal-400 hover:border-primary dark:hover:border-primary hover:bg-gray-50 dark:hover:bg-coal-500 transition-all"
            >
              <KeenIcon icon="message-question" className="text-3xl text-info mb-3" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">FAQ</span>
            </Link>

            <Link
              to="/advertise/naver/shopping/traffic/intro"
              className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-coal-400 hover:border-primary dark:hover:border-primary hover:bg-gray-50 dark:hover:bg-coal-500 transition-all"
            >
              <KeenIcon icon="shop" className="text-3xl text-success mb-3" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">NAVER 쇼핑</span>
            </Link>

            <Link
              to="/myinfo/profile"
              className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-coal-400 hover:border-primary dark:hover:border-primary hover:bg-gray-50 dark:hover:bg-coal-500 transition-all"
            >
              <KeenIcon icon="user-edit" className="text-3xl text-danger mb-3" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">내 정보 관리</span>
            </Link>

            <Link
              to="/cash/charge"
              className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-coal-400 hover:border-primary dark:hover:border-primary hover:bg-gray-50 dark:hover:bg-coal-500 transition-all"
            >
              <KeenIcon icon="dollar" className="text-3xl text-primary mb-3" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">캐시 충전</span>
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
};

export default BasicTemplate;