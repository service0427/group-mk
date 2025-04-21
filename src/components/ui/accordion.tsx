import React, { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { Collapse } from "@mui/material";

// Accordion 컨텍스트
const AccordionContext = createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  collapsible?: boolean;
}>({});

// 아이템 값 전달을 위한 컨텍스트
const AccordionItemContext = createContext<{ value: string }>({ value: "" });

// Accordion 컴포넌트
interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  collapsible?: boolean;
  children?: React.ReactNode;
}

const Accordion = ({
  className,
  type = "single",
  value,
  defaultValue,
  onValueChange,
  collapsible = false,
  children,
  ...props
}: AccordionProps) => {
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);
  const currentValue = value !== undefined ? value : internalValue;

  const handleValueChange = (newValue: string) => {
    if (type === "single") {
      if (collapsible && currentValue === newValue) {
        setInternalValue(undefined);
        onValueChange?.(undefined as any);
      } else {
        setInternalValue(newValue);
        onValueChange?.(newValue);
      }
    }
  };

  return (
    <AccordionContext.Provider
      value={{ value: currentValue, onValueChange: handleValueChange, collapsible }}
    >
      <div
        className={cn("flex flex-col space-y-1", className)}
        {...props}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

// AccordionItem 컴포넌트
interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, disabled = false, children, ...props }, ref) => {
    return (
      <AccordionItemContext.Provider value={{ value }}>
        <div
          ref={ref}
          className={cn("border-b", className)}
          data-value={value}
          data-disabled={disabled ? "" : undefined}
          {...props}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  }
);
AccordionItem.displayName = "AccordionItem";

// AccordionTrigger 컴포넌트
interface AccordionTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, onClick, ...props }, ref) => {
    const { value, onValueChange } = useContext(AccordionContext);
    const { value: itemValue } = useContext(AccordionItemContext);
    const isOpen = value === itemValue;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        onClick(e);
      }
      onValueChange?.(itemValue);
    };

    return (
      <div className="flex">
        <button
          ref={ref}
          type="button"
          className={cn(
            "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline",
            className
          )}
          onClick={handleClick}
          aria-expanded={isOpen}
          {...props}
        >
          {children}
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-300",
              isOpen ? "rotate-180" : ""
            )}
          />
        </button>
      </div>
    );
  }
);
AccordionTrigger.displayName = "AccordionTrigger";

// AccordionContent 컴포넌트
interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  forceMount?: boolean;
}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, forceMount, ...props }, ref) => {
    const { value } = useContext(AccordionContext);
    const { value: itemValue } = useContext(AccordionItemContext);
    const isOpen = value === itemValue;

    return (
      <Collapse in={isOpen} timeout={300} collapsedSize={0}>
        <div
          ref={ref}
          className={cn(
            "overflow-hidden text-sm transition-all",
            className
          )}
          aria-hidden={!isOpen}
          {...props}
        >
          <div className={cn("pb-4 pt-0")}>{children}</div>
        </div>
      </Collapse>
    );
  }
);
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };