import React, { useEffect, useState } from "react";
import ethAddress from "ethereum-address";
import { useWeb3React } from "@web3-react/core";

import { useTokenContractContext } from "../state";
import { TransactionButton } from "../components/TransactionButton";
import { useLocalStorageState } from "../utils/useLocalStorageState";
import { useTransactionsPendingChange } from "../state/useTransactionsPendingChange";
import { EtherscanLink } from "../components/EtherscanLink";
import { ReadOnlyWarning } from "../components/ReadOnlyWarning";
import { OnlyWriteInjector } from "../components/OnlyWriteInjector";

const ContractIdInput = ({ initialValue, onSet }) => {
  const [id, setId] = useState(initialValue ?? "");

  return (
    <div className="input-group" style={{ width: "410px" }}>
      <input
        type="text"
        className="form-control form-control-sm"
        onChange={(e) => setId(e.target.value)}
        value={id}
      />
      <div
        className="btn btn-sm btn-outline-secondary"
        onClick={() => {
          if (ethAddress.isAddress(id)) {
            onSet(id);
          }
        }}
      >
        Set
      </div>
    </div>
  );
};

const getScopeId = (contractId) => `erc20-token-${contractId}`;

const SendForm = ({ balance }) => {
  const { contractId, transfer } = useTokenContractContext();

  const scopeId = getScopeId(contractId);

  const [sendAmount, setSendAmount] = useLocalStorageState(
    "token-send-amount",
    "0"
  );
  const [sendAddress, setSendAddress] = useLocalStorageState(
    "token-send-address",
    ""
  );

  return (
    <>
      <div className="mb-3 row">
        <label className="col-sm-2 col-form-label">Address</label>
        <div className="col-sm-10">
          <input
            type="text"
            className="form-control"
            value={sendAddress}
            onChange={(e) => setSendAddress(e.target.value)}
          />
        </div>
      </div>
      <div className="mb-3 row">
        <label className="col-sm-2 col-form-label">Amount</label>
        <div className="col-sm-10">
          <input
            type="number"
            className="form-control"
            value={sendAmount}
            onChange={(e) => {
              setSendAmount(e.target.value);
            }}
          />
        </div>
      </div>
      <TransactionButton
        btnClassName="btn-outline-primary btn-sm"
        scopeId={scopeId}
        text="Send Tokens"
        onClick={() => {
          const sendAmountParsed = parseInt(sendAmount, 10);

          if (
            ethAddress.isAddress(sendAddress) &&
            !isNaN(sendAmountParsed) &&
            sendAmountParsed > 0 &&
            sendAmountParsed <= balance
          ) {
            transfer(scopeId, sendAddress, sendAmountParsed);
          }
        }}
      />
    </>
  );
};

export const WalletView = () => {
  const { contractId, setContractId, balanceOf, transfers } =
    useTokenContractContext();
  const { account } = useWeb3React();

  const scopeId = getScopeId(contractId);

  const [balance, setBalance] = useState(0);

  const fetchBalance = async () => {
    if (contractId) {
      const balance = await balanceOf(account);
      setBalance(balance);
    }
  };

  useEffect(async () => {
    fetchBalance();
  }, [contractId]);

  useTransactionsPendingChange(scopeId, (isPending) => {
    if (isPending === false) {
      fetchBalance();
    }
  });

  return (
    <div className="container">
      <ReadOnlyWarning />
      <OnlyWriteInjector>
        <div className="pb-5">
          <h3>Token Contract Address</h3>
          <ContractIdInput
            initialValue={contractId}
            onSet={(id) => setContractId(id)}
          />
        </div>
      </OnlyWriteInjector>
      <div className="pb-5">
        <h3>Account</h3>
        <div>{account}</div>
      </div>
      <div className="pb-5">
        <h3>Balance</h3>
        <div>{balance}</div>
      </div>
      <div className="pb-5">
        <h3>Send Tokens To</h3>
        <SendForm balance={balance} />
      </div>
      <div className="pb-5">
        <h3>Transfers</h3>
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>#</th>
              <th>In/Out</th>
              <th>Account</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map(
              ({ transactionHash, returnValues: { from, to, value } }) => {
                return (
                  <tr key={transactionHash}>
                    <td>
                      <EtherscanLink
                        noButtons
                        className="fs-6"
                        type="transaction"
                        id={transactionHash}
                      />
                    </td>
                    <td>{from === account ? "Out" : "In"}</td>
                    <td>
                      <EtherscanLink
                        noButtons
                        className="fs-6"
                        type="address"
                        id={from === account ? to : from}
                      />
                    </td>
                    <td>{value}</td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
