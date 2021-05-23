import React from "react";

import { useSupportedNetworks } from "../utils/networks";

export const WrongNetworkRoute = () => {
  const networks = useSupportedNetworks();

  return (
    <div className="mt-3">
      <p>
        This app only works with the following networks: {networks.join(", ")}.
      </p>
    </div>
  );
};
