import constate from "constate";

import { useTransactions } from "./useTransactions";
import { useContract } from "./useContract";

const useAppState = () => {
  const transactions = useTransactions();
  const { trackTransaction } = transactions;
  const contract = useContract(trackTransaction);

  return {
    contract,
    transactions,
  };
};

export const [AppStateProvider, useContractContext, useTransactionsContext] =
  constate(
    useAppState,
    ({ contract }) => contract,
    ({ transactions }) => transactions
  );
