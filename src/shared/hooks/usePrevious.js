import { useRef, useEffect } from 'react';

/**
 * usePrevious hook to track previous render value
 */
export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

export default usePrevious;
