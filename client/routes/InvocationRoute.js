import React from "react";
import { useParams } from "react-router-dom";

import { InvocationView } from "../views/InvocationView";

export const InvocationRoute = () => {
  const { tokenId = "" } = useParams();

  return <InvocationView tokenId={tokenId} />;
};
