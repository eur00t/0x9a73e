import React from "react";
import constate from "constate";

import { getDisplayName } from "../utils/getDisplayName";
import { useAccount } from "../utils/networks";

const [OwnerProvider, useOwner] = constate(({ owner }) => owner);

export const OnlyOwner = ({ children }) => {
  const owner = useOwner();
  const account = useAccount();

  return owner === account ? children : null;
};

export const withOwner = (Component, displayName) => {
  const WithOwner = (props) => {
    const { owner } = props;

    return (
      <OwnerProvider owner={owner}>
        <Component {...props} />
      </OwnerProvider>
    );
  };

  WithOwner.displayName =
    displayName ?? `withOwner(${getDisplayName(Component)})`;

  return WithOwner;
};
