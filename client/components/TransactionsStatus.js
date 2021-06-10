import React from "react";
import pluralize from "pluralize";
import classNames from "classnames";

import { useTransactionsScope } from "../state/useTransactionsScope";
import { useTransactionsContext } from "../state";

import { EtherscanLink } from "../components/EtherscanLink";

const TransactionStatus = ({
  scopeId,
  transactionHash,
  isConfirmed,
  confirmations,
  error,
  result,
  doneHandler,
  doneBtnText,
}) => {
  const { removeTransaction } = useTransactionsContext();

  let status;
  if (error) {
    status = "error";
  } else if (!isConfirmed) {
    status = "pending";
  } else {
    status = "done";
  }

  let badge;
  switch (status) {
    case "error":
      badge = <span className="badge bg-danger">Failed</span>;
      break;
    case "pending":
      badge = <span className="badge bg-secondary">Pending...</span>;
      break;
    case "done":
      badge = (
        <span className="badge bg-success">
          {confirmations > 0
            ? pluralize(" confirmation", confirmations, true)
            : "done"}
        </span>
      );
      break;
  }

  let cardClassName;
  if (error) {
    cardClassName = "border-danger";
  } else if (!isConfirmed) {
    cardClassName = "";
  } else {
    cardClassName = "border-success";
  }

  return (
    <div className={classNames("card", cardClassName)}>
      <div className="card-body p-2">
        {transactionHash ? (
          <div className="d-flex align-items-center">
            <div style={{ minWidth: "50px" }} className="text-end me-2 fs-6">
              tx
            </div>
            <div>
              <EtherscanLink
                className="fs-6"
                type="transaction"
                id={transactionHash}
              />
            </div>
          </div>
        ) : null}
        <div className="d-flex align-items-center">
          <div style={{ minWidth: "50px" }} className="text-end me-2 fs-6">
            status
          </div>
          {badge}
        </div>
        {status !== "pending" ? (
          <div className="d-flex justify-content-center mt-1">
            {doneBtnText ? (
              <button
                type="button"
                className="btn btn-outline-primary btn-sm me-1"
                onClick={() => doneHandler && doneHandler(result)}
              >
                {doneBtnText}
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() => {
                removeTransaction(scopeId, transactionHash);
                !doneBtnText && doneHandler && doneHandler(result);
              }}
            >
              Got it!
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const TransactionsStatus = ({ scopeId }) => {
  const { transactions } = useTransactionsScope(scopeId);

  return (
    <div className="d-flex flex-wrap align-items-start">
      {transactions.map((transaction) => (
        <div className="mb-2 me-2">
          <TransactionStatus
            key={transaction.transactionHash}
            {...{ ...transaction, scopeId }}
          />
        </div>
      ))}
    </div>
  );
};
