import { useCallback, useState, useEffect, useRef } from "react";
import { useNetwork } from "../utils/networks";

export const useTransactions = () => {
  const [transactionsByScopeId, setTransactionsByScopeId] = useState({});

  const network = useNetwork();
  const eventEmitters = useRef([]);

  useEffect(() => {
    eventEmitters.current.forEach((eventEmitter) =>
      eventEmitter.removeAllListeners()
    );
    eventEmitters.current = [];
    setTransactionsByScopeId({});
  }, [network]);

  const updateTransaction = useCallback(
    (scopeId, transactionHash, transactionUpdate) => {
      if (!transactionHash) {
        return;
      }

      setTransactionsByScopeId((v) => {
        const scope = v[scopeId] ? v[scopeId] : {};
        const transaction = scope[transactionHash]
          ? scope[transactionHash]
          : {};

        return {
          ...v,
          [scopeId]: {
            ...scope,
            [transactionHash]: {
              ...transaction,
              ...transactionUpdate,
            },
          },
        };
      });
    },
    [setTransactionsByScopeId]
  );

  const removeTransaction = useCallback(
    (scopeId, transactionHash) => {
      if (!transactionHash) {
        return;
      }

      setTransactionsByScopeId((v) => {
        if (!v[scopeId]) {
          return v;
        }

        if (!v[scopeId][transactionHash]) {
          return v;
        }

        const { eventEmitter } = v[scopeId][transactionHash];

        eventEmitter.removeAllListeners();

        return {
          ...v,
          [scopeId]: Object.fromEntries(
            Object.entries(v[scopeId]).filter(
              ([key]) => key !== transactionHash
            )
          ),
        };
      });
    },
    [setTransactionsByScopeId]
  );

  const trackTransaction = useCallback(
    (scopeId, transactionEventEmitter, { doneHandler, doneBtnText } = {}) => {
      let transactionHash = null;

      const stopTracking = () => {
        transactionEventEmitter.removeAllListeners();
        eventEmitters.current = eventEmitters.current.filter(
          (ee) => ee !== transactionEventEmitter
        );
      };

      eventEmitters.current.push(transactionEventEmitter);

      return transactionEventEmitter
        .once("transactionHash", (transactionHash_) => {
          transactionHash = transactionHash_;

          updateTransaction(scopeId, transactionHash, {
            isConfirmed: false,
            confirmations: 0,
            transactionHash,
            error: null,
            receipt: null,
            eventEmitter: transactionEventEmitter,
            doneBtnText,
            doneHandler,
          });
        })
        .on("confirmation", (confirmationNumber, receipt) => {
          updateTransaction(scopeId, transactionHash, {
            isConfirmed: true,
            confirmations: confirmationNumber,
          });
          if (confirmationNumber >= 5) {
            stopTracking();
          }
        })
        .on("receipt", (receipt) => {
          updateTransaction(scopeId, transactionHash, {
            receipt,
            isConfirmed: receipt.status,
          });
        })
        .on("error", (error) => {
          updateTransaction(scopeId, transactionHash, {
            error,
          });
          stopTracking();
        });
    },
    [updateTransaction]
  );

  return {
    transactionsByScopeId,
    trackTransaction,
    removeTransaction,
  };
};
