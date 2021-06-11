import { useWeb3Auth } from "../components/Web3Auth";

export const OnlyWriteInjector = ({ children }) => {
  const { isReadOnly } = useWeb3Auth();

  if (!isReadOnly) {
    return children;
  }

  return null;
};
