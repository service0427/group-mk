const getViewPort = (): { width: number; height: number } => {
  let e: any = window;
  let a: string = 'inner';

  if (!('innerWidth' in window)) {
    a = 'client';
    e = document.documentElement || document.body;
  }

  return {
    width: e[a + 'Width'] as number,
    height: e[a + 'Height'] as number
  };
};

const getHeight = (element: HTMLElement): number => {
  if (!element) return 0;

  const styles = window.getComputedStyle(element);

  const height = element.getBoundingClientRect().height; // Actual height of the element
  const marginTop = parseFloat(styles.marginTop);
  const marginBottom = parseFloat(styles.marginBottom);

  const totalHeight = height + marginTop + marginBottom;

  return totalHeight;
};

export { getHeight, getViewPort };
