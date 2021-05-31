import { useState } from "react";

export const useLoading = (retreive) => {
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      await retreive();
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    load,
  };
};
