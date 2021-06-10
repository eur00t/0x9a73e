import React from "react";
import { Link } from "react-router-dom";

import { useTokenRenderUrl } from "../utils/useTokenRenderUrl";

export const InvocationCard = ({
  tokenId,
  module: { name: moduleName },
  noTitle = false,
  noRender = false,
}) => {
  const tokenRenderUrl = useTokenRenderUrl(tokenId);

  return (
    <div className="card" style={{ width: "20rem" }}>
      {!noRender ? (
        <iframe
          src={tokenRenderUrl}
          className="card-img-top"
          style={{ width: "100%", height: "20rem", border: 0 }}
        ></iframe>
      ) : null}

      <div className="card-body">
        {!noTitle ? (
          <div className="card-title font-monospace fw-bold">
            {moduleName}#{tokenId}
          </div>
        ) : null}

        <div className="d-flex">
          <Link
            className="btn btn-outline-primary btn-sm"
            to={`/modules/invocation/${tokenId}`}
          >
            Open
          </Link>
        </div>
      </div>
    </div>
  );
};
