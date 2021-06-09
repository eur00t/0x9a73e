import { useContractOwner, useAccount } from "../utils/networks";

export const OnlyContractOwner = ({ children }) => {
  const contractOwner = useContractOwner();
  const account = useAccount();

  return contractOwner === account ? children : null;
};
