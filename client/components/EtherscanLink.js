import React, { useEffect, useState } from "react";
import classNames from "classnames";
import copyToClipboard from "copy-to-clipboard";

import { useNetwork } from "../utils/networks";
import BoxArrowUpRight from "../icons/box-arrow-up-right.svg";
import Clipboard from "../icons/clipboard.svg";
import ClipboardCheck from "../icons/clipboard-check.svg";

const CopyToClipboard = ({ value }) => {
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    if (!clicked) {
      return;
    }

    const timerId = setTimeout(() => {
      setClicked(false);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [clicked]);

  const onClick = () => {
    copyToClipboard(value);
    setClicked(true);
  };
  return (
    <div className="p-2 d-flex" onClick={onClick} style={{ cursor: "pointer" }}>
      {clicked ? <ClipboardCheck /> : <Clipboard />}
    </div>
  );
};

export const EtherscanLink = ({
  type,
  id,
  showFullId = false,
  noButtons = false,
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
      {!noButtons ? (
        <>
          <div
            className="p-2 d-flex"
            style={{ position: "relative", top: "-2px" }}
          >
            <BoxArrowUpRight />
          </div>
          <div className="d-flex" style={{ position: "relative", top: "-1px" }}>
            <CopyToClipboard value={id} />
          </div>
        </>
      ) : null}
    </div>
  );
};
