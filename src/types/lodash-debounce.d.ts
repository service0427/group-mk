// lodash debounce module 타입 정의
declare module 'lodash/debounce' {
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait?: number,
    options?: {
      leading?: boolean;
      trailing?: boolean;
      maxWait?: number;
    }
  ): T & { cancel(): void; flush(): ReturnType<T> };

  export default debounce;
}