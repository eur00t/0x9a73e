import React, { useEffect, useRef } from "react";
import classNames from "classnames";
import Tooltip from "bootstrap/js/src/tooltip";

import { useTransactionsScope } from "../state/useTransactionsScope";
import { TransactionsStatus } from "./TransactionsStatus";
import { useWeb3Auth } from "./Web3Auth";

export const TransactionButton = ({
  text,
  scopeId,
  onClick,
  className,
  btnClassName = "btn-outline-primary",
  disabled,
}) => {
  const tooltipRef = useRef(null);
  const tooltipContainerRef = useRef(null);
  const { isPending } = useTransactionsScope(scopeId);

  const { isReadOnly } = useWeb3Auth();

  const isDisabled = isReadOnly || disabled || isPending;

  useEffect(() => {
    if (!tooltipRef.current) {
      tooltipRef.current = new Tooltip(tooltipContainerRef.current, {
        title: "Wallet is not connected",
        placement: "right",
      });
    }

    if (isReadOnly) {
      tooltipRef.current.enable();
    } else {
      tooltipRef.current.disable();
    }
  }, [isReadOnly]);

  return (
    <div
      className={classNames("d-flex align-items-start flex-wrap", className)}
    >
      <div ref={tooltipContainerRef} className="me-2 mb-2">
        <button
          onClick={!isDisabled ? onClick : null}
          className={classNames("btn text-nowrap", btnClassName, {
            disabled: isDisabled,
          })}
        >
          {isPending ? (
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
          ) : null}
          {text}
        </button>
      </div>
      <div>
        <TransactionsStatus scopeId={scopeId} />
      </div>
    </div>
  );
};
