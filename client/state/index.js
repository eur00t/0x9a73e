import constate from "constate";

import { useTransactions } from "./useTransactions";
import { useContract } from "./useContract";
import { useTokenContract } from "./useTokenContract";

const useAppState = () => {
  const transactions = useTransactions();
  const { trackTransaction } = transactions;
  const contract = useContract(trackTransaction);
  const tokenContract = useTokenContract(trackTransaction);

  return {
    contract,
    tokenContract,
    transactions,
  };
};

export const [
  AppStateProvider,
  useContractContext,
  useTokenContractContext,
  useTransactionsContext,
] = constate(
  useAppState,
  ({ contract }) => contract,
  ({ tokenContract }) => tokenContract,
  ({ transactions }) => transactions
);
