import { useContractOwner, useAccount } from "../utils/networks";
import { ConditionalVisibility } from "../components/ConditionalVisibility";

export const OnlyContractOwner = ConditionalVisibility(() => {
  const contractOwner = useContractOwner();
  const account = useAccount();

  return contractOwner === account ? true : false;
});
