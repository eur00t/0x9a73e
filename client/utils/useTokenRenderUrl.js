import { useNetwork } from "./networks";

export const useTokenRenderUrl = (tokenId) => {
  const { networkId } = useNetwork();

  return `/network/${networkId}/tokens/${tokenId}/render`;
};
