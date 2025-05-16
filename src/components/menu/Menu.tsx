import clsx from 'clsx';
import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  memo,
  useContext,
  useState,
  useEffect
} from 'react';
import { IMenuContextProps, IMenuItemProps, IMenuProps } from './';
import { MenuItem } from './';
import { getData, setData } from '@/utils/LocalStorage';

const initalProps: IMenuContextProps = {
  disabled: false,
  highlight: false,
  multipleExpand: false,
  dropdownTimeout: 0,
  // Default function for opening an accordion (to be overridden)
  setOpenAccordion: (parentId: string, id: string) => {
  },
  // Default function for checking if an accordion is open (to be overridden)
  isOpenAccordion: (parentId: string, id: string) => {
    return false; // By default, no accordion is open
  }
};

// Create a Menu Context
const MenuContext = createContext(initalProps);

// Custom hook to use the Menu Context
const useMenu = () => useContext(MenuContext);

const MenuComponent = ({
  className,
  children,
  disabled = false,
  highlight = false,
  dropdownTimeout = 150,
  multipleExpand = false
}: IMenuProps) => {
  // 로컬 스토리지에서 저장된 열린 아코디언 상태 불러오기
  const storedAccordions = (getData('menu_accordions') as { [key: string]: string | null }) || {};
  
  const [openAccordions, setOpenAccordions] = useState<{ [key: string]: string | null }>(storedAccordions);

  // 아코디언 메뉴 토글 함수
  const setOpenAccordion = (parentId: string, id: string) => {
    setOpenAccordions((prevState) => {
      // 일반적인 토글 동작
      const newState = {
        ...prevState,
        [parentId]: prevState[parentId] === id ? null : id
      };
      
      // 로컬 스토리지에 상태 저장
      setData('menu_accordions', newState);
      return newState;
    });
  };

  // 아코디언 메뉴가 열려있는지 확인하는 함수
  const isOpenAccordion = (parentId: string, id: string) => {
    return openAccordions[parentId] === id;
  };

  const modifiedChildren = Children.map(children, (child, index) => {
    if (isValidElement(child)) {
      if (child.type === MenuItem) {
        const modifiedProps: IMenuItemProps = {
          parentId: 'root',
          id: `root-${index}`
        };

        return cloneElement(child, modifiedProps);
      } else {
        return cloneElement(child);
      }
    }

    return child;
  });

  return (
    <MenuContext.Provider
      value={{
        disabled,
        highlight,
        dropdownTimeout,
        multipleExpand,
        setOpenAccordion,
        isOpenAccordion
      }}
    >
      <div className={clsx('menu', 'w-full h-full', className && className)}>{modifiedChildren}</div>
    </MenuContext.Provider>
  );
};

const Menu = memo(MenuComponent);
// eslint-disable-next-line react-refresh/only-export-components
export { Menu, useMenu };