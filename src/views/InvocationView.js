import React, { useEffect, useState } from "react";

import { useContractContext } from "../state";
import { useLoading } from "../components/useLoading";
import { Loading } from "../components/Loading";
import { displayHexString } from "../utils/displayHexString";

export const InvocationView = ({ tokenId }) => {
  const { getHtml, getInvocation } = useContractContext();

  const [html, setHtml] = useState("");
  const [invocation, setInvocation] = useState({
    module: {
      name: "",
    },
    seed: "",
    owner: "",
  });

  const retrieve = async () => {
    const html = await getHtml(tokenId);
    const invocation = await getInvocation(tokenId);
    setHtml(html);
    setInvocation(invocation);
  };

  const { isLoading, load } = useLoading(retrieve);

  useEffect(() => {
    load();
  }, []);

  const {
    module: { name: moduleName },
    owner,
    seed,
  } = invocation;

  return (
    <div>
      <Loading isLoading={isLoading}>
        <dl>
          <dt>Module Name</dt>
          <dd className="font-monospace">{moduleName}</dd>
          <dt>Token ID</dt>
          <dd className="font-monospace">{tokenId}</dd>
          <dt>Owner</dt>
          <dd className="font-monospace">{displayHexString(owner)}</dd>
          <dt>seed</dt>
          <dd className="font-monospace">{displayHexString(seed)}</dd>
        </dl>

        <iframe
          srcDoc={html}
          style={{ width: "100%", height: "500px", border: 0 }}
        ></iframe>
      </Loading>
    </div>
  );
};
