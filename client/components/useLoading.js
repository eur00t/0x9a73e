import { useState, useCallback } from "react";

export const useLoading = (retreive) => {
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(
    (...args) => {
      setIsLoading(true);
      const request = retreive(...args);

      const loadingDone = () => {
        setIsLoading(false);
      };

      request.then(loadingDone, loadingDone);

      return request;
    },
    [setIsLoading, retreive]
  );

  return {
    isLoading,
    load,
  };
};
