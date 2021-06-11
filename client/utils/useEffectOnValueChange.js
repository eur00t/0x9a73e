import { useEffect, useRef } from "react";

export const useEffectOnValueChange = (callback, [value]) => {
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      callback(prevValue.current);
    }
    prevValue.current = value;
  }, [value]);
};
