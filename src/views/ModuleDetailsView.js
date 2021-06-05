import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import pluralize from "pluralize";

import { useContractContext } from "../state";
import { useTransactionsPendingChange } from "../state/useTransactionsPendingChange";
import { useLoading } from "../components/useLoading";
import { Loading } from "../components/Loading";
import { TransactionButton } from "../components/TransactionButton";
import { withOwner, OnlyOwner } from "../components/withOwner";
import { OnlyContractOwner } from "../components/OnlyContractOwner";
import { InvocationCard } from "../components/InvocationCard";
import { displayHexString } from "../utils/displayHexString";
import { EMPTY_MODULE_DATA } from "../utils/emptyModule";
import { useNetwork } from "../utils/networks";
import { EtherscanLink } from "../components/EtherscanLink";
import { OwnerLabel } from "../components/OwnerLabel";
import { Page } from "../components/Page";

const getFeaturedScopeId = (name) => `featured-action-${name}`;
const getInvocableScopeId = (name) => `invocable-action-${name}`;

const ModuleDetails = withOwner((module) => {
  const {
    html,
    name,
    metadataJSON,
    owner,
    dependencies,
    tokenId,
    isFeatured,
    isInvocable,
    invocationsMax,
    invocations,
  } = module;
  const { setFeatured, unsetFeatured, setInvocable, createInvocation } =
    useContractContext();

  const featuredScopeId = getFeaturedScopeId(name);
  const invocableScopeId = getInvocableScopeId(name);

  const [invocationsMaxInputValue, setInvocationsMaxInputValue] = useState(1);

  const { description } = useMemo(
    () => JSON.parse(metadataJSON),
    [metadataJSON]
  );

  const { contractAddress } = useNetwork();

  return (
    <>
      <dl>
        <dt>Name</dt>
        <dd className="font-monospace">{name}</dd>
        <dt>Description</dt>
        <dd>{description}</dd>
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
        <dt>Dependencies</dt>
        <dd className="font-monospace">
          {dependencies.length > 0 ? dependencies.join(", ") : <em>none</em>}
        </dd>
      </dl>

      <OnlyOwner>
        <Link
          className="btn btn-outline-primary btn-sm mb-3"
          to={`/modules/edit/${name}`}
        >
          Edit
        </Link>
      </OnlyOwner>

      {!isInvocable ? (
        <OnlyOwner>
          <div className="d-flex align-items-start mb-3">
            <input
              className="form-control form-control-sm me-1"
              type="number"
              value={invocationsMaxInputValue}
              onChange={(e) => setInvocationsMaxInputValue(e.target.value)}
              style={{ width: "60px" }}
            ></input>

            <TransactionButton
              btnClassName="btn-outline-primary btn-sm"
              scopeId={invocableScopeId}
              text={`Enable ${pluralize(
                " Mint",
                invocationsMaxInputValue,
                true
              )}`}
              onClick={() => {
                setInvocable(invocableScopeId, name, invocationsMaxInputValue);
              }}
            />
          </div>
        </OnlyOwner>
      ) : null}

      {isInvocable ? (
        parseInt(invocationsMax, 10) === invocations.length ? (
          <div className="mb-3">
            <div className="btn btn-outline-primary btn-lg disabled">
              No more mints left
            </div>
          </div>
        ) : (
          <TransactionButton
            className="mb-3"
            btnClassName="btn-primary btn-lg"
            scopeId={invocableScopeId}
            text={`Mint (${invocationsMax - invocations.length} left)`}
            onClick={() => {
              createInvocation(invocableScopeId, name);
            }}
          />
        )
      ) : null}

      <OnlyContractOwner>
        <TransactionButton
          className="mb-3"
          btnClassName="btn-outline-primary btn-sm"
          scopeId={featuredScopeId}
          text={!isFeatured ? "Make Featured" : "Remove from Featured"}
          onClick={() => {
            if (isFeatured) {
              unsetFeatured(featuredScopeId, name);
            } else {
              setFeatured(featuredScopeId, name);
            }
          }}
        />
      </OnlyContractOwner>
      {!isInvocable || invocations.length === 0 ? (
        <iframe
          srcDoc={html}
          style={{ width: "100%", height: "500px", border: 0 }}
        ></iframe>
      ) : (
        <>
          <h3 className="mb-3 mt-5">Mints</h3>
          <div className="d-flex gap-2 flex-wrap">
            {[...invocations].reverse().map(({ tokenId, ...invocation }, i) => (
              <InvocationCard
                key={tokenId}
                tokenId={tokenId}
                module={module}
                noRender={i > 2}
                {...invocation}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}, "ModuleDetails");

export const ModuleDetailsView = ({ moduleName, onModuleChange }) => {
  const [html, setHtml] = useState("");
  const [module, setModule] = useState(EMPTY_MODULE_DATA);

  const { getHtml, getModule } = useContractContext();

  const retrieve = async () => {
    if (!moduleName || moduleName === "") {
      return;
    }

    try {
      const module = await getModule(moduleName);
      const html = await getHtml(module.tokenId);
      setHtml(html);
      setModule(module);
    } catch {
      onModuleChange(null);
    }
  };

  const { isLoading, load } = useLoading(retrieve);

  useEffect(() => {
    load();
  }, [moduleName]);

  const featuredScopeId = getFeaturedScopeId(moduleName);
  const invocableScopeId = getInvocableScopeId(moduleName);

  useTransactionsPendingChange(featuredScopeId, (isPending) => {
    if (isPending === false) {
      load();
    }
  });

  useTransactionsPendingChange(invocableScopeId, (isPending) => {
    if (isPending === false) {
      load();
    }
  });

  return (
    <Page>
      <Loading isLoading={isLoading}>
        <ModuleDetails html={html} {...module} />
      </Loading>
    </Page>
  );
};
