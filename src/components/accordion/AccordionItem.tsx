import clsx from 'clsx';
import { memo, ReactNode } from 'react';
import { Collapse } from '@mui/material';
import { KeenIcon } from '../keenicons';

interface IAccordionItemProps {
  title: string; // Title of the accordion item
  indicator?: ReactNode; // Optional indicator, like an icon
  children: ReactNode; // Content of the accordion item
  isOpen?: boolean; // To control open/close state of the item
  onClick?: () => void; // Function to handle click event on the item
}

const AccordionItemComponent = ({
  title,
  indicator,
  children,
  isOpen,
  onClick
}: IAccordionItemProps) => {
  const buildIndicator = () => {
    return (
      indicator || (
        <span className="accordion-indicator">
          {isOpen ? (
            <KeenIcon icon="minus" className="text-muted-foreground text-sm" />
          ) : (
            <KeenIcon icon="plus" className="text-muted-foreground text-sm" />
          )}
        </span>
      )
    );
  };

  return (
    <div
      className={clsx(
        'accordion-item [&:not(:last-child)]:border-b border-b-border',
        isOpen && 'active'
      )}
    >
      <button type="button" className="accordion-toggle py-4 cursor-pointer" onClick={onClick}>
        <span className="text-base text-foreground">{title}</span>
        {buildIndicator()}
      </button>
      <Collapse in={isOpen}>
        <div className="accordion-content">
          <div className="text-foreground text-md pb-4">{children}</div>
        </div>
      </Collapse>
    </div>
  );
};

const AccordionItem = memo(AccordionItemComponent);
export { AccordionItem, type IAccordionItemProps };
