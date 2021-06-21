import { useWeb3Auth } from "../components/Web3Auth";
import { ConditionalVisibility } from "../components/ConditionalVisibility";

export const OnlyWriteInjector = ConditionalVisibility(() => {
  const { isReadOnly } = useWeb3Auth();

  if (!isReadOnly) {
    return true;
  }

  return false;
});
