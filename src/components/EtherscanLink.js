import React from "react";

import { useNetwork } from "../utils/networks";

export const EtherscanLink = ({ type, id, ...props }) => {
  const { etherscan } = useNetwork();

  const getDefault = () => <span>{id.slice(0, 10)}...</span>;

  if (!etherscan) {
    return getDefault();
  }

  let url;

  switch (type) {
    case "transaction":
      url = `${etherscan}tx/${id}`;
      break;
    default:
      return getDefault();
  }

  return (
    <a target="_blank" href={url} {...props}>
      {id.slice(0, 10)}...
    </a>
  );
};
