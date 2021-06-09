import React from "react";
import constate from "constate";

import { getDisplayName } from "../utils/getDisplayName";
import { useAccount } from "../utils/networks";

const [OwnerProvider, useOwner] = constate(({ owner }) => owner);

export const OnlyOwner = ({ children, fallback = null }) => {
  const owner = useOwner();
  const account = useAccount();

  if (typeof children === "function") {
    return children(owner === account);
  } else {
    return owner === account ? children : fallback;
  }
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
