import { useWeb3Auth } from "../components/Web3Auth";
import { ConditionalVisibility } from "../components/ConditionalVisibility";

export const OnlyInjectedAvailable = ConditionalVisibility(() => {
  const { isInjectedAvailable } = useWeb3Auth();

  if (isInjectedAvailable) {
    return true;
  }

  return false;
});
