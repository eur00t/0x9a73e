import { useWeb3React } from "@web3-react/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { abi } from "../erc20_abi.json";

import { useNetwork } from "../utils/networks";
import { wrapFuncCancelable } from "../utils/wrapFuncCancelable";
import { useLocalStorageState } from "../utils/useLocalStorageState";

export const useTokenContract = (trackTransaction) => {
  const { account, library: web3 } = useWeb3React();
  const [contractId, setContractId] = useLocalStorageState(
    "token-contract-id",
    null
  );
  const [transfers, setTransfers] = useState([]);

  const network = useNetwork();

  let contract = useMemo(
    () =>
      network && web3 && account && contractId
        ? new web3.eth.Contract(abi, contractId, {
            from: account,
          })
        : null,
    [web3, account, contractId]
  );

  const balanceOf = useCallback(
    wrapFuncCancelable(
      async (account) => await contract.methods.balanceOf(account).call()
    ),
    [contract]
  );

  const transferEventsEmitter = useRef(null);

  const handleTransferEvent = (e) => {
    setTransfers((transfers) => [
      e,
      ...transfers.filter(
        ({ transactionHash }) => transactionHash !== e.transactionHash
      ),
    ]);
  };

  useEffect(() => {
    if (transferEventsEmitter.current) {
      transferEventsEmitter.current.in.removeAllListeners();
      transferEventsEmitter.current.out.removeAllListeners();
    }

    if (contract && account) {
      const emitter = {
        in: contract.events.Transfer({
          filter: {
            to: account,
          },
        }),
        out: contract.events.Transfer({
          filter: {
            from: account,
          },
        }),
      };

      emitter.in.on("data", handleTransferEvent);
      emitter.out.on("data", handleTransferEvent);

      transferEventsEmitter.current = emitter;
    }
  }, [contract, account]);

  const getTransfers = useCallback(
    wrapFuncCancelable(async (account) =>
      []
        .concat(
          ...(await Promise.all([
            contract.getPastEvents("Transfer", {
              filter: {
                from: account,
              },
              fromBlock: 0,
              toBlock: "latest",
            }),
            contract.getPastEvents("Transfer", {
              filter: {
                to: account,
              },
              fromBlock: 0,
              toBlock: "latest",
            }),
          ]))
        )
        .sort(
          ({ blockNumber: blockNumberA }, { blockNumber: blockNumberB }) =>
            blockNumberB - blockNumberA
        )
    ),
    [contract]
  );

  const fetchTransfers = async () => {
    setTransfers([]);
    if (contract && account) {
      const transfers = await getTransfers(account);
      setTransfers(transfers);
    }
  };

  useEffect(async () => {
    fetchTransfers();
  }, [contract, account]);

  const transfer = useCallback(
    wrapFuncCancelable((scopeId, recipient, amount) =>
      trackTransaction(
        scopeId,
        contract.methods.transfer(recipient, amount).send(),
        {
          doneModalText: `Successfully transfered ${amount} tokens to ${recipient}`,
        }
      )
    ),
    [contract, trackTransaction]
  );

  return {
    contractId,
    setContractId,
    transfers,
    balanceOf,
    getTransfers,
    transfer,
  };
};
