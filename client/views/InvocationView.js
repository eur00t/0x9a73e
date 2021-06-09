import React, { useEffect, useState } from "react";

import { useContractContext } from "../state";
import { useLoading } from "../components/useLoading";
import { Loading } from "../components/Loading";
import { displayHexString } from "../utils/displayHexString";
import { useNetwork } from "../utils/networks";
import { EtherscanLink } from "../components/EtherscanLink";
import { OwnerLabel } from "../components/OwnerLabel";
import { Page } from "../components/Page";

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

  const { contractAddress } = useNetwork();

  return (
    <Page>
      <Loading isLoading={isLoading}>
        <dl>
          <dt>Module Name</dt>
          <dd className="font-monospace">{moduleName}</dd>
          <dt>ERC721 Token Contract</dt>
          <dd className="font-monospace">
            <EtherscanLink
              className="fs-6"
              type="address"
              id={displayHexString(contractAddress)}
              showFullId
            />
          </dd>
          <dt>ERC721 Token ID</dt>
          <dd className="font-monospace">{tokenId}</dd>
          <dt>
            <OwnerLabel address={owner} />
          </dt>
          <dd className="font-monospace">
            <EtherscanLink
              className="fs-6"
              type="address"
              id={displayHexString(owner)}
              showFullId
            />
          </dd>
          <dt>Seed</dt>
          <dd className="font-monospace">{displayHexString(seed)}</dd>
        </dl>

        <iframe
          srcDoc={html}
          style={{ width: "100%", height: "500px", border: 0 }}
        ></iframe>
      </Loading>
    </Page>
  );
};
