export const createMemoizedSelector = <T, R>(
  fn: (data: T) => R
): ((data: T) => R) => {
  let lastData: T | undefined;
  let lastResult: R | undefined;

  return (data: T): R => {
    if (data === lastData && lastResult !== undefined) {
      return lastResult;
    }

    lastData = data;
    lastResult = fn(data);
    return lastResult;
  };
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
