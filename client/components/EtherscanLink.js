import React from "react";
import classNames from "classnames";

import { useNetwork } from "../utils/networks";
import BoxArrowUpRight from "../icons/box-arrow-up-right.svg";

export const EtherscanLink = ({
  type,
  id,
  showFullId = false,
  className = "",
  ...props
}) => {
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
    case "address":
      url = `${etherscan}address/${id}`;
      break;
    default:
      return getDefault();
  }

  return (
    <div className="d-flex align-items-center">
      <a
        className={classNames(className, "text-decoration-none text-truncate")}
        target="_blank"
        href={url}
        {...props}
      >
        {!showFullId ? `${id.slice(0, 10)}...` : id}
      </a>
      <BoxArrowUpRight
        className="ms-1 me-1"
        style={{ position: "relative", top: "-2px" }}
      />
    </div>
  );
};
