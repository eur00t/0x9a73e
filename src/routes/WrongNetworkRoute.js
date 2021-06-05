import React from "react";

import { useSupportedNetworks } from "../utils/networks";
import { Page } from "../components/Page";

export const WrongNetworkRoute = () => {
  const networks = useSupportedNetworks();

  return (
    <Page>
      <p>
        This app only works with the following networks: {networks.join(", ")}.
      </p>
    </Page>
  );
};
