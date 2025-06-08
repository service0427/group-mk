import { TMenuConfig, IMenuItemConfig, MenuSub, Menu, MenuItem, MenuLink, MenuTitle } from '@/components/menu';
import { KeenIcon } from '@/components';
import { MegaMenuSubHighlighted } from './components';

const MegaMenuSubService = (items: TMenuConfig, itemIndex: number = 5) => {
  // 사이드바 메뉴 구조에서 캠페인 소개 항목 찾기
  const serviceItem = items.find(item => !item.heading && item.title === '캠페인 소개');

  if (!serviceItem) return null;

  // 네이버 하위 카테고리들을 모두 수집
  const naverCategory = serviceItem.children?.find(item => item.title === '네이버');
  const naverShoppingItems = naverCategory?.children?.find(item => item.title === '네이버 쇼핑')?.children?.filter(item => !item.title?.includes('가구매') && !item.title?.includes('효과 및 사용법')) || [];
  const naverPlaceItems = naverCategory?.children?.find(item => item.title === '네이버 플레이스')?.children?.filter(item => !item.title?.includes('효과 및 사용법')) || [];
  const naverBlogItems = naverCategory?.children?.find(item => item.title === '네이버 블로그')?.children?.filter(item => !item.title?.includes('효과 및 사용법') && !item.disabled) || [];
  const naverAutoItem = naverCategory?.children?.find(item => item.title === 'N 자동완성');

  // 네이버 서비스 항목 (자동완성 제외)
  const naverServices = {
    heading: '네이버 서비스',
    children: [
      ...naverShoppingItems,
      ...naverPlaceItems,
      ...naverBlogItems
    ]
  };

  // 쿠팡 서비스 항목
  const coupangServices = {
    heading: '쿠팡 서비스',
    children: (serviceItem.children
      ?.find(item => item.title === '쿠팡')
      ?.children?.filter(item => !item.title?.includes('가구매')) || [])
  };

  // 준비 중인 서비스
  const additionalServices = {
    heading: '준비 중인 서비스',
    children: [
      ...(serviceItem.children?.filter(item => item.disabled) || []),

      // N 자동완성
      ...(naverAutoItem ? [naverAutoItem] : []),

      // NS 가구매 항목
      ...(naverCategory?.children?.find(item => item.title === '네이버 쇼핑')?.children?.filter(item => item.title?.includes('가구매')) || []),

      // CP 가구매 항목
      ...(serviceItem.children
        ?.find(item => item.title === '쿠팡')
        ?.children?.filter(item => item.title?.includes('가구매')) || [])
    ]
  };

  return (
    <MenuSub className="flex-col gap-0 w-full lg:max-w-[900px]">
      <div className="flex flex-col lg:flex-row">
        <div className="pt-4 pb-2 lg:p-7.5 lg:pb-5 grow">
          <div className="grid lg:grid-cols-2 gap-6">
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
          </div>
        </div>
        <div className="lg:w-[250px] mb-4 lg:mb-0 lg:border-l lg:border-s-gray-200 rounded-xl lg:rounded-e-xl lg:rounded-s-none shrink-0 px-3 py-4 lg:p-7.5 bg-light-active dark:bg-coal-500 dark:lg:border-l-coal-100">
          <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 mb-5">
            {additionalServices.heading}
          </h3>
          <div className="menu menu-default menu-fit flex-col">
            {additionalServices.children && additionalServices.children.map((item: IMenuItemConfig, idx) => (
              <MenuItem key={`additional-service-item-${idx}`} disabled={true}>
                <MenuLink className="py-2 text-sm flex items-center hover:bg-gray-50 dark:hover:bg-coal-600 px-2 rounded">
                  {item.iconImage && <img src={item.iconImage} alt={item.title} className="me-2 w-5 h-5 opacity-50" />}
                  {item.icon && <KeenIcon icon={item.icon} className="me-2 text-gray-400 w-5 h-5" />}
                  <MenuTitle className="text-gray-400">{item.title}</MenuTitle>
                </MenuLink>
              </MenuItem>
            ))}
          </div>
        </div>
      </div>
    </MenuSub>
  );
};

export { MegaMenuSubService };