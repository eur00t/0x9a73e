import { useWeb3Auth } from "../components/Web3Auth";

export const OnlyInjectedAvailable = ({ children }) => {
  const { isInjectedAvailable } = useWeb3Auth();

  if (isInjectedAvailable) {
    return children;
  }

  return null;
};
