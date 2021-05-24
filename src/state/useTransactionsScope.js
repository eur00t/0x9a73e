import { useTransactionsContext } from "./index";

export const useTransactionsScope = (scopeId) => {
  const { transactionsByScopeId } = useTransactionsContext();

  const transactions = Object.values(transactionsByScopeId[scopeId] ?? {});

  const isPending = transactions.some(({ isConfirmed }) => !isConfirmed);

  return {
    isPending,
    transactions,
  };
};
