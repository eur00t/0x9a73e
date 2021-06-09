import React from "react";
import { useWeb3React } from "@web3-react/core";

export const OwnerLabel = ({ address }) => {
  const { account } = useWeb3React();

  return <>{address === account ? "Owner (You)" : "Owner"}</>;
};
