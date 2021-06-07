import { useState, useCallback } from "react";

export const useLoading = (retreive) => {
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(
    async (...args) => {
      setIsLoading(true);
      try {
        await retreive(...args);
      } finally {
        setIsLoading(false);
      }
    },
    [setIsLoading, retreive]
  );

  return {
    isLoading,
    load,
  };
};
