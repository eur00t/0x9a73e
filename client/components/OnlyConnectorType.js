import { useWeb3Auth } from "../components/Web3Auth";

export const OnlyConnectorType = ({ type, children }) => {
  const { isRpc, isInjected } = useWeb3Auth();

  if (type === "rpc" && isRpc) {
    return children;
  }

  if (type === "injected" && isInjected) {
    return children;
  }

  return null;
};
