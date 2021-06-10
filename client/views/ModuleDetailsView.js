import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import pluralize from "pluralize";
import classNames from "classnames";

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
import { ModuleBadges, hasBadges } from "../components/ModuleBadges";

const getFeaturedScopeId = (name) => `featured-action-${name}`;
const getInvocableScopeId = (name) => `invocable-action-${name}`;
const getFinalizeScopeId = (name) => `finalize-action-${name}`;

const ModuleDetails = withOwner((module) => {
  const {
    html,
    name,
    metadataJSON,
    owner,
    dependencies,
    allDependencies = [],
    tokenId,
    isFeatured,
    isInvocable,
    isFinalized,
    invocationsMax,
    invocations,
  } = module;
  const {
    setFeatured,
    unsetFeatured,
    setInvocable,
    createInvocation,
    finalize,
  } = useContractContext();

  const notFinalizedDependencies = useMemo(
    () => allDependencies.filter(({ isFinalized }) => !isFinalized),
    [allDependencies]
  );

  const areDependenciesMutable = notFinalizedDependencies.length > 0;

  const featuredScopeId = getFeaturedScopeId(name);
  const invocableScopeId = getInvocableScopeId(name);
  const finalizeScopeId = getFinalizeScopeId(name);

  const [invocationsMaxInputValue, setInvocationsMaxInputValue] = useState(1);

  const { description } = useMemo(
    () => JSON.parse(metadataJSON),
    [metadataJSON]
  );

  const { contractAddress } = useNetwork();

  return (
    <>
      {hasBadges(module) ? (
        <div className="mb-3">
          <ModuleBadges {...module} />
        </div>
      ) : null}

      {areDependenciesMutable ? (
        <div className="alert alert-warning" style={{ maxWidth: "500px" }}>
          <h4 className="alert-heading">Mutable</h4>
          <p>
            Some of the module's dependencies has not been finalized. This means
            that their owners can update them at their will. If you are going to
            mint this module, the output you get can change.
          </p>
          <hr />
          <p className="mb-0">
            The following dependencies are not final:{" "}
            <strong>
              {notFinalizedDependencies.map(({ name }) => name).join(", ")}
            </strong>
            .
          </p>
        </div>
      ) : null}

      {!areDependenciesMutable && isInvocable && isFinalized ? (
        <div className="alert alert-success" style={{ maxWidth: "500px" }}>
          <h4 className="alert-heading">Immutable</h4>
          <p>
            This module and all its dependencies have been finalized and can't
            be changed. It's secure on blockchain.
          </p>
        </div>
      ) : null}

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
          <TransactionButton
            btnClassName="btn-outline-primary btn-sm"
            className="mb-3"
            scopeId={finalizeScopeId}
            text={isFinalized ? "Module Is Finalized" : "Finalize"}
            onClick={
              isFinalized
                ? null
                : () => {
                    finalize(finalizeScopeId, name);
                  }
            }
            disabled={isFinalized}
          />
        </OnlyOwner>
      ) : null}

      {isInvocable && !isFinalized ? (
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

      {isInvocable && isFinalized ? (
        parseInt(invocationsMax, 10) === invocations.length ? (
          <div className="mb-3">
            <div className="btn btn-outline-primary btn-lg disabled">
              No more mints left
            </div>
          </div>
        ) : (
          <TransactionButton
            className="mb-3"
            btnClassName={classNames("btn-primary btn-lg", {
              "btn-primary": !areDependenciesMutable,
              "btn-warning": areDependenciesMutable,
            })}
            scopeId={invocableScopeId}
            text={
              !areDependenciesMutable
                ? `Mint (${invocationsMax - invocations.length} left)`
                : `Mint Mutable (${invocationsMax - invocations.length} left)`
            }
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
          <div className="d-flex flex-wrap">
            {[...invocations].reverse().map(({ tokenId, ...invocation }, i) => (
              <div className="mb-2 me-2">
                <InvocationCard
                  key={tokenId}
                  tokenId={tokenId}
                  module={module}
                  noRender={i > 2}
                  {...invocation}
                />
              </div>
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
  const finalizeScopeId = getFinalizeScopeId(moduleName);

  const reloadOnDone = (isPending) => {
    if (isPending === false) {
      load();
    }
  };

  useTransactionsPendingChange(featuredScopeId, reloadOnDone);
  useTransactionsPendingChange(invocableScopeId, reloadOnDone);
  useTransactionsPendingChange(finalizeScopeId, reloadOnDone);

  return (
    <Page>
      <Loading isLoading={isLoading}>
        <ModuleDetails html={html} {...module} />
      </Loading>
    </Page>
  );
};
