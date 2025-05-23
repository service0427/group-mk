import * as React from 'react';
import Tooltip, { TooltipProps } from '@mui/material/Tooltip';
import ClickAwayListener from '@mui/material/ClickAwayListener';

interface TooltipState {
  isOpen: boolean;
  isFixed: boolean; // 클릭으로 고정되었는지 여부
}

interface ExtendedReactElementProps {
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
  [key: string]: any;
}

// 호버 및 클릭 기능을 모두 지원하는 강화된 툴팁
const DefaultTooltip: React.FC<TooltipProps> = ({ children, className = '', ...props }) => {
  // 툴팁의 표시 상태와 고정 상태를 관리
  const [state, setState] = React.useState<TooltipState>({
    isOpen: false,
    isFixed: false,
  });

  // 마우스가 들어올 때 열기 (고정되지 않은 경우에만)
  const handleMouseEnter = () => {
    if (!state.isFixed) {
      setState({ ...state, isOpen: true });
    }
  };

  // 마우스가 떠날 때 닫기 (고정되지 않은 경우에만)
  const handleMouseLeave = () => {
    if (!state.isFixed) {
      setState({ ...state, isOpen: false });
    }
  };

  // 클릭 시 고정 상태를 토글
  const handleClick = (e: React.MouseEvent) => {
    // 이미 고정되어 있으면 해제
    if (state.isFixed) {
      setState({ isOpen: false, isFixed: false });
    } else {
      // 고정되어 있지 않으면 고정
      setState({ isOpen: true, isFixed: true });
    }

    // 기존 onClick이 있으면 호출
    if (React.isValidElement(children)) {
      const childProps = children.props as ExtendedReactElementProps;
      if (childProps && typeof childProps.onClick === 'function') {
        childProps.onClick(e);
      }
    }
  };

  // 외부 클릭 시 고정 해제
  const handleClickAway = () => {
    if (state.isFixed) {
      setState({ isOpen: false, isFixed: false });
    }
  };

  // 올바른 자식 요소 생성
  const childElement = React.isValidElement(children)
    ? React.cloneElement(children, {
        onClick: handleClick,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        style: {
          ...((React.isValidElement(children) && (children.props as ExtendedReactElementProps).style) || {}),
          cursor: 'pointer',
        },
      } as React.HTMLAttributes<HTMLElement>)
    : children;

  // 클릭 영역 밖을 클릭했을 때 툴팁을 닫는 클릭어웨이 리스너 적용
  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <div style={{ display: 'inline-flex' }}>
        <Tooltip
          {...props}
          classes={{
            popper: className,
            tooltip:
              '!text-white !rounded-md !text-xs !font-normal !bg-[--tw-tooltip-background-color] !box-shadow[--tw-tooltip-box-shadow] !border[--tw-tooltip-border] !px-2 !py-1.5'
          }}
          sx={{
            '& .MuiTooltip-tooltip': {
              maxWidth: '350px',
            }
          }}
          open={state.isOpen}
          disableFocusListener
          disableHoverListener
          disableTouchListener
          PopperProps={{
            disablePortal: false,
            sx: {
              zIndex: 9999,
              '& .MuiTooltip-tooltip': {
                zIndex: 9999,
              }
            },
            modifiers: [
              {
                name: 'preventOverflow',
                enabled: true,
                options: {
                  boundary: 'viewport',
                },
              },
            ],
          } as any}
        >
          {childElement}
        </Tooltip>
      </div>
    </ClickAwayListener>
  );
};

export { DefaultTooltip };
