import { useTransactionsScope } from "./useTransactionsScope";
import { useEffectOnValueChange } from "../utils/useEffectOnValueChange";

export const useTransactionsPendingChange = (scopeId, callback) => {
  const { isPending } = useTransactionsScope(scopeId);

  useEffectOnValueChange(() => {
    callback(isPending);
  }, [isPending]);
};
