import { useWeb3Auth } from "../components/Web3Auth";
import { ConditionalVisibility } from "../components/ConditionalVisibility";

export const OnlyConnectorType = ConditionalVisibility(({ type }) => {
  const { isRpc, isInjected } = useWeb3Auth();

  if (type === "rpc" && isRpc) {
    return true;
  }

  if (type === "injected" && isInjected) {
    return true;
  }

  return false;
});
