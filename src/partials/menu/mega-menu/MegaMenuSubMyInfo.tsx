import { TMenuConfig, IMenuItemConfig, MenuSub, Menu, MenuItem, MenuLink, MenuTitle } from '@/components/menu';
import { KeenIcon } from '@/components';

const MegaMenuSubMyInfo = (items: TMenuConfig, itemIndex: number = 0) => {
  // 사이드바 메뉴 구조에서 내 정보 관리 항목 찾기
  const myInfoItem = items.find(item => !item.heading && item.title === 'My 페이지');

  if (!myInfoItem) return null;

  // 내 정보 영역 (프로필, 내 서비스 관리 이외의 항목들)
  const myInfoItems = myInfoItem.children?.slice(0, 3) || [];

  // 네이버 서비스 항목
  const naverServices = {
    heading: '네이버 서비스',
    children: (myInfoItem.children
      ?.find(item => item.title === '내 서비스 관리')
      ?.children?.find(item => item.title === '네이버')
      ?.children?.filter(item => !item.title?.includes('가구매')) || [])
  };

  // 쿠팡 서비스 항목
  const coupangServices = {
    heading: '쿠팡 서비스',
    children: (myInfoItem.children
      ?.find(item => item.title === '내 서비스 관리')
      ?.children?.find(item => item.title === '쿠팡')
      ?.children?.filter(item => !item.title?.includes('가구매')) || [])
  };

  // 캐쉬/포인트 항목들
  const cashPointItems = {
    heading: '캐쉬/포인트',
    children: (myInfoItem.children
      ?.filter(item => item.title === '캐쉬/포인트 관리')
      .flatMap(item => item.children || []) || [])
  };

  // 출금 신청 항목들
  const withdrawItems = {
    heading: '출금 신청',
    children: (myInfoItem.children
      ?.filter(item => item.title === '총판 출금 신청') || [])
  };

  // 준비 중인 서비스
  const disabledServices = {
    heading: '준비 중인 서비스',
    children: [
      ...(myInfoItem.children
        ?.find(item => item.title === '내 서비스 관리')
        ?.children?.filter(item => item.disabled) || []),

      // NS 가구매 항목
      ...(myInfoItem.children
        ?.find(item => item.title === '내 서비스 관리')
        ?.children?.find(item => item.title === '네이버')
        ?.children?.filter(item => item.title?.includes('가구매')) || []),

      // CP 가구매 항목
      ...(myInfoItem.children
        ?.find(item => item.title === '내 서비스 관리')
        ?.children?.find(item => item.title === '쿠팡')
        ?.children?.filter(item => item.title?.includes('가구매')) || [])
    ]
  };

  return (
    <MenuSub className="flex-col gap-0 w-full lg:max-w-[1100px]">
      <div className="flex flex-col lg:flex-row">
        <div className="pt-4 pb-2 lg:p-7.5 lg:pb-5 grow">
          {/* 모든 메뉴 항목을 가로로 배치 */}
          <div className="flex flex-row items-start gap-6 flex-wrap">
            {/* 내 정보 섹션 */}
            <div className="mb-4">
              <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 mb-4">
                내 정보
              </h3>
              <Menu className="menu-default menu-fit flex-col">
                {myInfoItems.map((item: IMenuItemConfig, idx) => (
                  <MenuItem key={`my-info-item-${idx}`} disabled={item.disabled}>
                    <MenuLink path={item.path} className="py-2 text-sm flex items-center hover:bg-gray-50 dark:hover:bg-coal-600 px-2 rounded">
                      {item.icon && <KeenIcon icon={item.icon} className="me-2 text-gray-500 w-5 h-5" />}
                      <MenuTitle>{item.title}</MenuTitle>
                    </MenuLink>
                  </MenuItem>
                ))}
              </Menu>
            </div>

            {/* 캐쉬/포인트 섹션 */}
            <div className="mb-4">
              <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 mb-4">
                {cashPointItems.heading}
              </h3>
              <Menu className="menu-default menu-fit flex-col">
                {cashPointItems.children.map((item: IMenuItemConfig, idx) => (
                  <MenuItem key={`cash-point-item-${idx}`} disabled={item.disabled}>
                    <MenuLink path={item.path} className="py-2 text-sm flex items-center hover:bg-gray-50 dark:hover:bg-coal-600 px-2 rounded">
                      {item.icon && <KeenIcon icon={item.icon} className="me-2 text-gray-500 w-5 h-5" />}
                      <MenuTitle>{item.title}</MenuTitle>
                    </MenuLink>
                  </MenuItem>
                ))}
              </Menu>
            </div>


            {/* 네이버 서비스 섹션 */}
            <div className="mb-4">
              <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 mb-4">
                {naverServices.heading}
              </h3>
              <Menu className="menu-default menu-fit flex-col">
                {naverServices.children?.map((item: IMenuItemConfig, idx) => (
                  <MenuItem key={`naver-service-item-${idx}`} disabled={item.disabled}>
                    <MenuLink path={item.path} className="py-2 text-sm flex items-center hover:bg-gray-50 dark:hover:bg-coal-600 px-2 rounded">
                      {item.iconImage && <img src={item.iconImage} alt={item.title} className="me-2 w-5 h-5" />}
                      {item.icon && <KeenIcon icon={item.icon} className="me-2 text-gray-500 w-5 h-5" />}
                      <MenuTitle>{item.title}</MenuTitle>
                    </MenuLink>
                  </MenuItem>
                ))}
              </Menu>
            </div>
            
            {/* 쿠팡 서비스 섹션 */}
            <div className="mb-4">
              <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 mb-4">
                {coupangServices.heading}
              </h3>
              <Menu className="menu-default menu-fit flex-col">
                {coupangServices.children?.map((item: IMenuItemConfig, idx) => (
                  <MenuItem key={`coupang-service-item-${idx}`} disabled={item.disabled}>
                    <MenuLink path={item.path} className="py-2 text-sm flex items-center hover:bg-gray-50 dark:hover:bg-coal-600 px-2 rounded">
                      {item.iconImage && <img src={item.iconImage} alt={item.title} className="me-2 w-5 h-5" />}
                      {item.icon && <KeenIcon icon={item.icon} className="me-2 text-gray-500 w-5 h-5" />}
                      <MenuTitle>{item.title}</MenuTitle>
                    </MenuLink>
                  </MenuItem>
                ))}
              </Menu>
            </div>


            {/* 출금 신청 섹션 */}
            {withdrawItems.children.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 mb-4">
                  {withdrawItems.heading}
                </h3>
                <Menu className="menu-default menu-fit flex-col">
                  {withdrawItems.children.map((item: IMenuItemConfig, idx) => (
                    <MenuItem key={`withdraw-item-${idx}`} disabled={item.disabled}>
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

        {/* 준비 중인 서비스 - 서비스 메뉴와 동일한 디자인 */}
        {disabledServices.children && disabledServices.children.length > 0 && (
          <div className="lg:w-[250px] mb-4 lg:mb-0 lg:border-l lg:border-s-gray-200 rounded-xl lg:rounded-e-xl lg:rounded-s-none shrink-0 px-3 py-4 lg:p-7.5 bg-light-active dark:bg-coal-500 dark:lg:border-l-coal-100">
            <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 mb-5">
              {disabledServices.heading}
            </h3>
            <div className="menu menu-default menu-fit flex-col">
              {disabledServices.children?.map((item: IMenuItemConfig, idx) => (
                <MenuItem key={`disabled-service-item-${idx}`} disabled={true}>
                  <MenuLink className="py-2 text-sm flex items-center hover:bg-gray-50 dark:hover:bg-coal-600 px-2 rounded">
                    {item.iconImage && <img src={item.iconImage} alt={item.title} className="me-2 w-5 h-5 opacity-50" />}
                    {item.icon && <KeenIcon icon={item.icon} className="me-2 text-gray-400 w-5 h-5" />}
                    <MenuTitle className="text-gray-400">{item.title}</MenuTitle>
                  </MenuLink>
                </MenuItem>
              ))}
            </div>
          </div>
        )}
      </div>
    </MenuSub>
  );
};

export { MegaMenuSubMyInfo };