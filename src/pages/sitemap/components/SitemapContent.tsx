import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMenus } from '@/providers';
import { IMenuItemConfig, TMenuConfig } from '@/components/menu';
import { KeenIcon } from '@/components/keenicons';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/auth';
import { hasPermission, PERMISSION_GROUPS } from '@/config/roles.config';

const SitemapContent: React.FC = () => {
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const { userRole } = useAuthContext();

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
      } else if (item.title === '내 정보 관리' || item.title === 'My 페이지') {
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

    // 권한 체크 - authCheck 함수가 있으면 해당 함수로 권한 체크
    if (item.authCheck && !item.authCheck(userRole)) {
      return null;
    }

    // 서비스 섹션 항목은 광고주 이상 권한 필요
    if (item.title && (
      item.title.includes('NAVER') || 
      item.title.includes('COUPANG') || 
      item.title === '서비스'
    ) && !hasPermission(userRole, PERMISSION_GROUPS.ADVERTISEMENT)) {
      return null;
    }

    // 관리자 섹션 항목은 권한에 따라 다르게 적용
    if (item.title) {
      // 슬롯 관리는 총판 이상 권한 필요
      if (item.title === '슬롯 관리' && !hasPermission(userRole, PERMISSION_GROUPS.DISTRIBUTOR)) {
        return null;
      }
      
      // 그 외 관리자 메뉴는 관리자 권한 필요
      if ((
        item.title === '사이트 관리' || 
        item.title === '사용자 관리' || 
        item.title === '캠페인 관리'
      ) && !hasPermission(userRole, PERMISSION_GROUPS.ADMIN)) {
        return null;
      }
    }

    // 자식 항목 필터링 (권한 기반)
    let filteredChildren = item.children;
    if (filteredChildren && filteredChildren.length > 0) {
      filteredChildren = filteredChildren.filter(child => {
        if (child.authCheck) {
          return child.authCheck(userRole);
        }
        
        // 서비스 섹션 항목은 광고주 이상 권한 필요
        if (child.title && (
          child.title.includes('NAVER') || 
          child.title.includes('COUPANG')
        ) && !hasPermission(userRole, PERMISSION_GROUPS.ADVERTISEMENT)) {
          return false;
        }
        
        // 슬롯 관련 자식 메뉴는 총판 이상 권한 필요
        if (child.title && (
          child.title.includes('슬롯') || 
          child.title === '슬롯 정보 관리' || 
          child.title === '슬롯 승인 관리'
        ) && !hasPermission(userRole, PERMISSION_GROUPS.DISTRIBUTOR)) {
          return false;
        }
        
        return true;
      });
      
      // 자식 항목이 권한 필터링 후 없어졌으면 현재 아이템도 표시 안함
      if (filteredChildren.length === 0 && item.children.length > 0) {
        return null;
      }
    }

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
          {item.iconImage && (
            <span className="flex items-center justify-center mr-3">
              <img 
                src={item.iconImage} 
                alt="" 
                className="w-5 h-5 object-contain" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
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

        {filteredChildren && filteredChildren.length > 0 && (
          <div className="border-l-2 border-gray-100 dark:border-coal-400 ml-3 pl-3">
            {filteredChildren.map(child => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // 카테고리 필터 렌더링
  const renderCategoryFilter = () => {
    const allCategories = ["전체", ...Object.keys(categories).filter(cat => categories[cat].length > 0)];

    return (
      <div className="card rounded-lg shadow-sm p-5">
        <div className="flex flex-wrap gap-2">
          {allCategories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              onClick={() => setActiveCategory(category)}
              className={`${activeCategory === category ? 'bg-primary text-white' : 'bg-white text-gray-700'}`}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  // 활성 카테고리에 따른 메뉴 아이템 필터링
  const getFilteredCategories = () => {
    // 먼저 권한에 따라 필터링
    const permissionFiltered: { [key: string]: TMenuConfig } = {};
    
    // 각 카테고리별로 권한 체크하여 필터링
    Object.entries(categories).forEach(([category, items]) => {
      // 권한에 따라 필터링된 아이템들
      const filteredItems = items.filter(item => {
        // authCheck 함수가 있으면 해당 함수로 권한 체크
        if (item.authCheck) {
          return item.authCheck(userRole);
        }
        
        // 카테고리별 기본 권한 체크
        if (category === "관리자" && !hasPermission(userRole, PERMISSION_GROUPS.ADMIN)) {
          return false;
        }
        
        if (category === "서비스" && !hasPermission(userRole, PERMISSION_GROUPS.ADVERTISEMENT)) {
          return false;
        }
        
        // 자식 항목이 있는 경우 재귀적으로 체크
        if (item.children && item.children.length > 0) {
          const hasVisibleChildren = item.children.some(child => 
            child.authCheck ? child.authCheck(userRole) : true
          );
          if (!hasVisibleChildren) return false;
        }
        
        return true;
      });
      
      if (filteredItems.length > 0) {
        permissionFiltered[category] = filteredItems;
      }
    });
    
    // 이제 활성 카테고리에 따라 필터링
    if (activeCategory === "전체") {
      return permissionFiltered;
    } else {
      const filtered: { [key: string]: TMenuConfig } = {};
      if (permissionFiltered[activeCategory]) {
        filtered[activeCategory] = permissionFiltered[activeCategory];
      }
      return filtered;
    }
  };

  return (
    <div className="grid gap-4 lg:gap-5">
      {/* 카테고리 필터 */}
      {renderCategoryFilter()}

      {/* 메뉴 구조 트리 뷰 */}
      <div className="bg-white dark:bg-coal-600 rounded-lg shadow-sm p-6 mb-6">
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

          {/* 광고주 이상 권한 필요한 메뉴 */}
          {hasPermission(userRole, PERMISSION_GROUPS.ADVERTISEMENT) && (
            <>
              <Link
                to="/advertise/naver/shopping/traffic/intro"
                className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-coal-400 hover:border-primary dark:hover:border-primary hover:bg-gray-50 dark:hover:bg-coal-500 transition-all"
              >
                <KeenIcon icon="shop" className="text-3xl text-success mb-3" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">NAVER 쇼핑</span>
              </Link>

              <Link
                to="/cash/charge"
                className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-coal-400 hover:border-primary dark:hover:border-primary hover:bg-gray-50 dark:hover:bg-coal-500 transition-all"
              >
                <KeenIcon icon="dollar" className="text-3xl text-primary mb-3" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">캐시 충전</span>
              </Link>
            </>
          )}

          <Link
            to="/myinfo/profile"
            className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-coal-400 hover:border-primary dark:hover:border-primary hover:bg-gray-50 dark:hover:bg-coal-500 transition-all"
          >
            <KeenIcon icon="user-edit" className="text-3xl text-danger mb-3" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">내 정보 관리</span>
          </Link>

          {/* 키워드 관리 추가 - 광고주 이상 권한 필요 */}
          {hasPermission(userRole, PERMISSION_GROUPS.ADVERTISEMENT) && (
            <Link
              to="/keyword"
              className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-coal-400 hover:border-primary dark:hover:border-primary hover:bg-gray-50 dark:hover:bg-coal-500 transition-all"
            >
              <KeenIcon icon="pencil" className="text-3xl text-success mb-3" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">내 키워드</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default SitemapContent;