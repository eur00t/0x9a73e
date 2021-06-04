import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useContractContext } from "../state";
import { useLoading } from "../components/useLoading";
import { Loading } from "../components/Loading";

export const InvocationCard = ({ tokenId }) => {
  const { getHtml } = useContractContext();

  const [html, setHtml] = useState("");

  const retrieve = async () => {
    const html = await getHtml(tokenId);
    setHtml(html);
  };

  const { isLoading, load } = useLoading(retrieve);

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="card" style={{ width: "20rem" }}>
      <div className="card-body">
        <Loading isLoading={isLoading}>
          <iframe
            srcDoc={html}
            style={{ width: "100%", height: "20rem", border: 0 }}
          ></iframe>
          <div className="d-flex gap-2">
            <Link
              className="btn btn-outline-primary btn-sm"
              to={`/modules/invocation/${tokenId}`}
            >
              Open
            </Link>
          </div>
        </Loading>
      </div>
    </div>
  );
};
