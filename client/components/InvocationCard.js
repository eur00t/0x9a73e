import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useContractContext } from "../state";
import { useLoading } from "../components/useLoading";
import { Loading } from "../components/Loading";

export const InvocationCard = ({
  tokenId,
  module: { name: moduleName },
  noTitle = false,
  noRender = false,
}) => {
  const { getHtml } = useContractContext();

  const [html, setHtml] = useState("");

  const retrieve = async () => {
    const html = await getHtml(tokenId);
    setHtml(html);
  };

  const { isLoading, load } = useLoading(retrieve);

  useEffect(() => {
    !noRender && load();
  }, []);

  return (
    <div className="card" style={{ width: "20rem" }}>
      <Loading isLoading={isLoading}>
        {!noRender ? (
          <iframe
            srcDoc={html}
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
      </Loading>
    </div>
  );
};
