import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useContractContext } from "../state";
import { useLoading } from "../components/useLoading";
import { Loading } from "../components/Loading";
import { displayHexString } from "../utils/displayHexString";
import { useNetwork } from "../utils/networks";
import { EtherscanLink } from "../components/EtherscanLink";
import { OwnerLabel } from "../components/OwnerLabel";
import { Page } from "../components/Page";
import { PreviewIFrame } from "../components/PreviewIFrame";
import { OnlyMainnet } from "../components/OnlyMainnet";
import { ReadOnlyWarning } from "../components/ReadOnlyWarning";

import BoxArrowUpRight from "../icons/box-arrow-up-right.svg";
import OpenSea from "../icons/opensea-logomark-full-colored.svg";

export const InvocationView = ({ tokenId }) => {
  const { getInvocation } = useContractContext();

  const [invocation, setInvocation] = useState({
    module: {
      name: "",
    },
    seed: "",
    owner: "",
  });

  const retrieve = async () => {
    const invocation = await getInvocation(tokenId);
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

  const { contractAddress, networkId } = useNetwork();

  return (
    <Page>
      <ReadOnlyWarning />
      <Loading isLoading={isLoading}>
        <dl>
          <dt>Lambda Name</dt>
          <dd className="font-monospace">
            <Link
              className="text-decoration-none"
              to={`/modules/details/${moduleName}`}
            >
              {moduleName}
            </Link>
          </dd>
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
          <dd className="font-monospace text-truncate">
            {displayHexString(seed)}
          </dd>
        </dl>

        <div className="mb-2">
          <a
            className="btn btn-outline-primary btn-sm"
            target="_blank"
            href={`/network/${networkId}/tokens/${tokenId}/render`}
          >
            Render Full{" "}
            <BoxArrowUpRight
              className="ms-1"
              style={{ position: "relative", top: "-3px" }}
            />
          </a>
        </div>

        <OnlyMainnet>
          <div className="mb-2">
            <a
              className="btn btn-outline-primary btn-sm"
              target="_blank"
              href={`https://opensea.io/assets/matic/${contractAddress}/${tokenId}`}
            >
              View on OpenSea{" "}
              <OpenSea
                className="ms-1"
                style={{ height: "18px", position: "relative", top: "-1px" }}
              />
            </a>
          </div>
        </OnlyMainnet>

        <PreviewIFrame
          tokenId={tokenId}
          style={{ width: "100%", height: "500px" }}
        />
      </Loading>
    </Page>
  );
};
