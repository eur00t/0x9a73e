import React from "react";
import { Link } from "react-router-dom";

import { PreviewIFrame } from "../components/PreviewIFrame";

export const InvocationCard = ({
  tokenId,
  module: { name: moduleName },
  noTitle = false,
  noRender = false,
}) => {
  return (
    <div className="card" style={{ width: "20rem" }}>
      {!noRender ? (
        <PreviewIFrame
          className="card-img-top"
          tokenId={tokenId}
          style={{ width: "100%", height: "20rem" }}
        />
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
