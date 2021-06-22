import React, { useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";

import { fetchServerMethod } from "../utils/fetchServerMethod";
import { useNetwork } from "../utils/networks";

export const FeaturedControl = ({ moduleName }) => {
  const { account, library } = useWeb3React();

  const [isFeatured, setIsFeatured] = useState(false);

  const { networkId } = useNetwork();

  const retreive = async () => {
    try {
      await fetchServerMethod(
        `/protected/network/${networkId}/featured/${moduleName}`,
        "GET"
      );
      setIsFeatured(true);
    } catch (e) {
      setIsFeatured(false);
    }
  };

  useEffect(() => {
    if (moduleName === "") {
      return;
    }

    retreive();
  }, [moduleName]);

  const updateFeatured = async () => {
    const { nonce } = await fetchServerMethod("/protected/nonce", "GET");

    const signature = await library.currentProvider.request({
      method: "personal_sign",
      params: [JSON.stringify({ nonce }), account],
      from: account,
    });

    if (isFeatured) {
      await fetchServerMethod(
        `/protected/network/${networkId}/featured/${moduleName}`,
        "DELETE",
        {
          signature,
        }
      );
      setIsFeatured(false);
    } else {
      await fetchServerMethod(
        `/protected/network/${networkId}/featured`,
        "POST",
        {
          signature,
          moduleName,
        }
      );
      setIsFeatured(true);
    }
  };

  return (
    <div className="btn btn-outline-primary btn-sm" onClick={updateFeatured}>
      {isFeatured ? "Remove Featured" : "Make Featured"}
    </div>
  );
};
