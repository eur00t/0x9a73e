import React from "react";
import classNames from "classnames";

import { useTransactionsScope } from "../state/useTransactionsScope";
import { TransactionsStatus } from "../components/TransactionsStatus";

export const TransactionButton = ({ text, scopeId, onClick }) => {
  const { isPending } = useTransactionsScope(scopeId);

  return (
    <div className="d-flex align-items-start">
      <button
        onClick={!isPending ? onClick : null}
        className={classNames("btn btn-outline-primary", {
          disabled: isPending,
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
