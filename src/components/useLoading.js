import { useState } from "react";

export const useLoading = (retreive) => {
  const [isLoading, setIsLoading] = useState(false);

  const load = async (...args) => {
    setIsLoading(true);
    try {
      await retreive(...args);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    load,
  };
};
