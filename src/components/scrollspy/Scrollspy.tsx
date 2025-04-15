/* eslint-disable no-unused-vars */
import { throttle } from '@/utils';
import * as React from 'react';
import { MutableRefObject, ReactNode, useEffect, useRef, useCallback } from 'react';

type IScrollSpyProps = {
  children: ReactNode;
  targetRef?: MutableRefObject<HTMLElement | Document | undefined>;
  onUpdate?: (id: string) => void;
  offset?: number;
  smooth?: boolean;
  className?: string;
  dataAttribute?: string;
  activeClass?: string;
  history?: boolean;
  throttleTime?: number;
};

const Scrollspy = ({
  children,
  targetRef,
  onUpdate,
  className,
  offset = 0,
  smooth = true,
  dataAttribute = 'scrollspy',
  activeClass = 'active',
  history = true,
  throttleTime = 200
}: IScrollSpyProps) => {
  const selfRef = useRef<HTMLDivElement | null>(null);
  const anchorElementsRef = useRef<Element[] | null>(null);
  const prevIdTracker = useRef<string | null>(null);

  // Check if the element is visible
  const isVisible = (element: HTMLElement): boolean => {
    if (!element || element.getClientRects().length === 0) {
      return false;
    }
    return getComputedStyle(element).getPropertyValue('visibility') === 'visible';
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const replaceHash = useCallback(
    throttle((sectionId: string) => {
      window.history.replaceState({}, '', `#${sectionId}`);
    }, throttleTime),
    [throttleTime]
  );

  // Update the active anchor based on the scroll position
  const updateAnchor = (anchorElement: HTMLElement) => {
    const sectionId = anchorElement.getAttribute(`data-${dataAttribute}-anchor`);
    const sectionElement = document.getElementById(sectionId!);

    if (!sectionElement || !isVisible(sectionElement)) return;

    const scrollPosition =
      targetRef?.current === document
        ? window.scrollY || document.documentElement.scrollTop
        : (targetRef?.current as HTMLElement).scrollTop;

    let customOffset = offset;
    const dataOffset = anchorElement.getAttribute(`data-${dataAttribute}-offset`);
    if (dataOffset) {
      customOffset = parseInt(dataOffset, 10);
    }

    const offsetTop = sectionElement.offsetTop;

    if (scrollPosition + customOffset >= offsetTop) {
      anchorElementsRef.current?.forEach((item) => {
        item.classList.remove(activeClass);
      });

      anchorElement.classList.add(activeClass);

      if (onUpdate && sectionId) {
        onUpdate(sectionId);
      }

      prevIdTracker.current = sectionId;

      if (history) {
        replaceHash(sectionId);
      }

      const parentAnchorElements = anchorElement.closest(`[data-${dataAttribute}-group`);
      if (parentAnchorElements) {
        parentAnchorElements.querySelector(`[data-${dataAttribute}]`)?.classList.add(activeClass);
      }
    }
  };

  // Handle the scroll event
  const handleScroll = useCallback(() => {
    anchorElementsRef.current?.forEach((element) => {
      updateAnchor(element as HTMLElement); // Ensuring type as HTMLElement
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorElementsRef]);

  // Handle smooth scrolling to a section on click or when URL hash is present
  const scrollTo = useCallback(
    (anchorElement: HTMLElement) => (event?: Event) => {
      if (event) event.preventDefault();
      const sectionId = anchorElement
        .getAttribute(`data-${dataAttribute}-anchor`)
        ?.replace('#', '');
      const sectionElement = document.getElementById(sectionId!);
      if (!sectionElement) return;

      const scrollToElement = targetRef?.current === document ? window : targetRef?.current;

      let customOffset = offset;
      const dataOffset = anchorElement.getAttribute(`data-${dataAttribute}-offset`);
      if (dataOffset) {
        customOffset = parseInt(dataOffset, 10);
      }

      const scrollTop = sectionElement.offsetTop - customOffset;

      if (scrollToElement && 'scrollTo' in scrollToElement) {
        scrollToElement.scrollTo({
          top: scrollTop,
          left: 0,
          behavior: smooth ? 'smooth' : 'auto'
        });
      }
    },
    [dataAttribute, offset, smooth, targetRef]
  );

  // Scroll to the section if the ID is present in the URL hash
  const scrollToHashSection = useCallback(() => {
    const hash = CSS.escape(window.location.hash.replace('#', ''));

    if (hash) {
      const targetElement = document.querySelector(
        `[data-${dataAttribute}-anchor="${hash}"]`
      ) as HTMLElement;
      if (targetElement) {
        scrollTo(targetElement)();
      }
    }
  }, [dataAttribute, scrollTo]);

  useEffect(() => {
    // Query elements and store them in the ref, avoiding unnecessary re-renders
    if (selfRef.current) {
      anchorElementsRef.current = Array.from(
        selfRef.current.querySelectorAll(`[data-${dataAttribute}-anchor]`)
      );
    }

    anchorElementsRef.current?.forEach((item) => {
      item.addEventListener('click', scrollTo(item as HTMLElement));
    });

    const scrollElement = targetRef?.current === document ? window : targetRef?.current;

    // Attach the scroll event to the correct scrollable element
    scrollElement?.addEventListener('scroll', handleScroll);

    // Check if there's a hash in the URL and scroll to the corresponding section
    setTimeout(() => {
      scrollToHashSection();
    }, 100); // Adding a slight delay to ensure content is fully rendered

    return () => {
      scrollElement?.removeEventListener('scroll', handleScroll);
      anchorElementsRef.current?.forEach((item) => {
        item.removeEventListener('click', scrollTo(item as HTMLElement));
      });
    };
  }, [targetRef, selfRef, handleScroll, dataAttribute, scrollTo, scrollToHashSection]);

  return (
    <div className={className} ref={selfRef}>
      {children}
    </div>
  );
};

export { Scrollspy };
