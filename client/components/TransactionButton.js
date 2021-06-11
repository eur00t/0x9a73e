import React from "react";
import classNames from "classnames";

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
  const { isPending } = useTransactionsScope(scopeId);

  const { isReadOnly } = useWeb3Auth();

  const isDisabled = isReadOnly || disabled || isPending;

  return (
    <div className={classNames("d-flex align-items-start", className)}>
      <button
        onClick={!isDisabled ? onClick : null}
        className={classNames("btn", btnClassName, {
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
      <div className="ms-3">
        <TransactionsStatus scopeId={scopeId} />
      </div>
    </div>
  );
};
