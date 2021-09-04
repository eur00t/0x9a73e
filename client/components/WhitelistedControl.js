import React, { useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";

import { fetchServerMethod } from "../utils/fetchServerMethod";
import { useNetwork } from "../utils/networks";

export const WhitelistedControl = ({ moduleName }) => {
  const { account, library } = useWeb3React();

  const [isWhitelisted, setIsWhitelisted] = useState(false);

  const { networkId } = useNetwork();

  const retreive = async () => {
    try {
      await fetchServerMethod(
        `/protected/network/${networkId}/whitelisted/${moduleName}`,
        "GET"
      );
      setIsWhitelisted(true);
    } catch (e) {
      setIsWhitelisted(false);
    }
  };

  useEffect(() => {
    if (moduleName === "") {
      return;
    }

    retreive();
  }, [moduleName]);

  const updateWhitelisted = async () => {
    const { nonce } = await fetchServerMethod("/protected/nonce", "GET");

    const signature = await library.currentProvider.request({
      method: "personal_sign",
      params: [JSON.stringify({ nonce }), account],
      from: account,
    });

    if (isWhitelisted) {
      await fetchServerMethod(
        `/protected/network/${networkId}/whitelisted/${moduleName}`,
        "DELETE",
        {
          signature,
        }
      );
      setIsWhitelisted(false);
    } else {
      await fetchServerMethod(
        `/protected/network/${networkId}/whitelisted`,
        "POST",
        {
          signature,
          moduleName,
        }
      );
      setIsWhitelisted(true);
    }
  };

  return (
    <div className="btn btn-outline-primary btn-sm" onClick={updateWhitelisted}>
      {isWhitelisted ? "Remove Whitelisted" : "Make Whitelisted"}
    </div>
  );
};
