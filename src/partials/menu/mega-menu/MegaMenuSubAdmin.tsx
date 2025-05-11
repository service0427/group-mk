import { TMenuConfig, IMenuItemConfig, MenuSub, Menu, MenuItem, MenuLink, MenuTitle } from '@/components/menu';
import { KeenIcon } from '@/components';
import { useAuthContext } from '@/auth';
import { hasPermission, PERMISSION_GROUPS } from '@/config/roles.config';

const MegaMenuSubAdmin = (items: TMenuConfig, itemIndex: number = 3) => {
  const { userRole } = useAuthContext();
  
  // 관리자 권한 체크
  if (!hasPermission(userRole || '', PERMISSION_GROUPS.ADMIN)) {
    return null;
  }
  
  const adminItem = items.find(item => item.title === '관리자 메뉴') || (items.length > itemIndex ? items[itemIndex] : {});
  
  // 각 항목 그룹 찾기
  // 사이드바 메뉴 구조에서 각 관리자 메뉴 찾기
  const siteManagement = items.find(item => !item.heading && item.title === '사이트 관리') || {};
  const userManagement = items.find(item => !item.heading && item.title === '사용자 관리') || {};
  const campaignManagement = items.find(item => !item.heading && item.title === '캠페인 관리') || {};
  const slotManagement = items.find(item => !item.heading && item.title === '슬롯 관리') || {};
  const cashManagement = items.find(item => !item.heading && item.title === '캐시 관리') || {};
  const etcManagement = items.find(item => !item.heading && item.title === '필요 페이지') || {};

  // 메뉴 항목 필터링 함수
  const filterMenuItems = (items: IMenuItemConfig[] | undefined) => {
    if (!items) return [];
    
    return items.filter(item => {
      if (item.authCheck) {
        return item.authCheck(userRole || '');
      }
      return true;
    });
  };

  // 각 카테고리별 메뉴 항목 필터링
  const siteItems = filterMenuItems(siteManagement?.children);
  const userItems = filterMenuItems(userManagement?.children);
  const campaignItems = filterMenuItems(campaignManagement?.children);
  const slotItems = filterMenuItems(slotManagement?.children);
  const cashItems = filterMenuItems(cashManagement?.children);
  const etcItems = filterMenuItems(etcManagement?.children);

  return (
    <MenuSub className="flex-col gap-0 w-full lg:max-w-[900px]">
      <div className="flex flex-col lg:flex-row">
        <div className="pt-4 pb-2 lg:p-7.5 lg:pb-5 grow">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* 사이트 관리 */}
            {siteItems && siteItems.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 mb-4">
                  {siteManagement.title}
                </h3>
                <Menu className="menu-default menu-fit flex-col">
                  {siteItems.map((item: IMenuItemConfig, idx) => (
                    <MenuItem key={`site-management-item-${idx}`}>
                      <MenuLink path={item.path} className="py-2 text-sm flex items-center hover:bg-gray-50 dark:hover:bg-coal-600 px-2 rounded">
                        {item.icon && <KeenIcon icon={item.icon} className="me-2 text-gray-500 w-5 h-5" />}
                        <MenuTitle>{item.title}</MenuTitle>
                      </MenuLink>
                    </MenuItem>
                  ))}
                </Menu>
              </div>
            )}

            {/* 사용자 관리 */}
            {userItems && userItems.length > 0 && hasPermission(userRole || '', PERMISSION_GROUPS.MANAGE_USERS) && (
              <div className="mb-4">
                <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 mb-4">
                  {userManagement.title}
                </h3>
                <Menu className="menu-default menu-fit flex-col">
                  {userItems.map((item: IMenuItemConfig, idx) => (
                    <MenuItem key={`user-management-item-${idx}`}>
                      <MenuLink path={item.path} className="py-2 text-sm flex items-center hover:bg-gray-50 dark:hover:bg-coal-600 px-2 rounded">
                        {item.icon && <KeenIcon icon={item.icon} className="me-2 text-gray-500 w-5 h-5" />}
                        <MenuTitle>{item.title}</MenuTitle>
                      </MenuLink>
                    </MenuItem>
                  ))}
                </Menu>
              </div>
            )}

            {/* 캠페인 관리 */}
            {campaignItems && campaignItems.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 mb-4">
                  {campaignManagement.title}
                </h3>
                <Menu className="menu-default menu-fit flex-col">
                  {campaignItems.map((item: IMenuItemConfig, idx) => (
                    <MenuItem key={`campaign-management-item-${idx}`}>
                      <MenuLink path={item.path} className="py-2 text-sm flex items-center hover:bg-gray-50 dark:hover:bg-coal-600 px-2 rounded">
                        {item.icon && <KeenIcon icon={item.icon} className="me-2 text-gray-500 w-5 h-5" />}
                        <MenuTitle>{item.title}</MenuTitle>
                      </MenuLink>
                    </MenuItem>
                  ))}
                </Menu>
              </div>
            )}

            {/* 슬롯 관리 */}
            {slotItems && slotItems.length > 0 && hasPermission(userRole || '', PERMISSION_GROUPS.DISTRIBUTOR) && (
              <div className="mb-4">
                <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 mb-4">
                  {slotManagement.title}
                </h3>
                <Menu className="menu-default menu-fit flex-col">
                  {slotItems.map((item: IMenuItemConfig, idx) => (
                    <MenuItem key={`slot-management-item-${idx}`}>
                      <MenuLink path={item.path} className="py-2 text-sm flex items-center hover:bg-gray-50 dark:hover:bg-coal-600 px-2 rounded">
                        {item.icon && <KeenIcon icon={item.icon} className="me-2 text-gray-500 w-5 h-5" />}
                        <MenuTitle>{item.title}</MenuTitle>
                      </MenuLink>
                    </MenuItem>
                  ))}
                </Menu>
              </div>
            )}

            {/* 캐시 관리 */}
            {cashItems && cashItems.length > 0 && hasPermission(userRole || '', PERMISSION_GROUPS.ADMIN) && (
              <div className="mb-4">
                <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 mb-4">
                  {cashManagement.title}
                </h3>
                <Menu className="menu-default menu-fit flex-col">
                  {cashItems.map((item: IMenuItemConfig, idx) => (
                    <MenuItem key={`cash-management-item-${idx}`}>
                      <MenuLink path={item.path} className="py-2 text-sm flex items-center hover:bg-gray-50 dark:hover:bg-coal-600 px-2 rounded">
                        {item.icon && <KeenIcon icon={item.icon} className="me-2 text-gray-500 w-5 h-5" />}
                        <MenuTitle>{item.title}</MenuTitle>
                      </MenuLink>
                    </MenuItem>
                  ))}
                </Menu>
              </div>
            )}

            {/* 필요 페이지 */}
            {etcItems && etcItems.length > 0 && hasPermission(userRole || '', PERMISSION_GROUPS.ADMIN) && (
              <div className="mb-4">
                <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 mb-4">
                  {etcManagement.title}
                </h3>
                <Menu className="menu-default menu-fit flex-col">
                  {etcItems.map((item: IMenuItemConfig, idx) => (
                    <MenuItem key={`etc-management-item-${idx}`}>
                      <MenuLink path={item.path} className="py-2 text-sm flex items-center hover:bg-gray-50 dark:hover:bg-coal-600 px-2 rounded">
                        {item.icon && <KeenIcon icon={item.icon} className="me-2 text-gray-500 w-5 h-5" />}
                        <MenuTitle>{item.title}</MenuTitle>
                      </MenuLink>
                    </MenuItem>
                  ))}
                </Menu>
              </div>
            )}
          </div>
        </div>
      </div>
    </MenuSub>
  );
};

export { MegaMenuSubAdmin };