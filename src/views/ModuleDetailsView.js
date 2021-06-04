import React, { useEffect, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import pluralize from "pluralize";

import { useContractContext } from "../state";
import { useTransactionsPendingChange } from "../state/useTransactionsPendingChange";
import { useLoading } from "../components/useLoading";
import { Loading } from "../components/Loading";
import { TransactionButton } from "../components/TransactionButton";
import { withOwner, OnlyOwner } from "../components/withOwner";
import { OnlyContractOwner } from "../components/OnlyContractOwner";
import { InvocableBadge } from "../components/InvocableBadge";
import { InvocationCard } from "../components/InvocationCard";

const getFeaturedScopeId = (name) => `featured-action-${name}`;
const getInvocableScopeId = (name) => `invocable-action-${name}`;

const ModuleDetails = withOwner((module) => {
  const {
    html,
    name,
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

  return (
    <>
      {isInvocable ? (
        <div className="mb-3">
          <InvocableBadge {...module} />
        </div>
      ) : null}
      <dl>
        <dt>Name</dt>
        <dd>{name}</dd>
        <dt>Token ID</dt>
        <dd>{tokenId}</dd>
        <dt>Owner</dt>
        <dd>{owner}</dd>
        <dt>Dependencies</dt>
        <dd>
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
              btnClassName="btn-sm"
              scopeId={invocableScopeId}
              text={`Allow ${pluralize(
                " Invocation",
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
            <div className="btn btn-outline-primary btn-sm disabled">
              All invocations has been minted
            </div>
          </div>
        ) : (
          <TransactionButton
            className="mb-3"
            btnClassName="btn-sm"
            scopeId={invocableScopeId}
            text={`Mint Invocation (${
              invocationsMax - invocations.length
            } left)`}
            onClick={() => {
              createInvocation(invocableScopeId, name);
            }}
          />
        )
      ) : null}

      <OnlyContractOwner>
        <TransactionButton
          className="mb-3"
          btnClassName="btn-sm"
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
      {!isInvocable ? (
        <iframe
          srcDoc={html}
          style={{ width: "100%", height: "500px", border: 0 }}
        ></iframe>
      ) : (
        <>
          <h3 className="mb-3 mt-3">Recent invocations</h3>
          <div className="d-flex gap-2 flex-wrap">
            {[...invocations]
              .reverse()
              .slice(0, 3)
              .map(({ tokenId }) => (
                <InvocationCard key={tokenId} tokenId={tokenId} />
              ))}
          </div>
        </>
      )}
    </>
  );
}, "ModuleDetails");

export const ModuleDetailsView = ({ moduleName, onModuleChange }) => {
  const [html, setHtml] = useState("");
  const [module, setModule] = useState({
    name: "",
    dependencies: [],
    owner: "",
    invocations: [],
  });

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
    <div className="mt-3">
      <Loading isLoading={isLoading}>
        <ModuleDetails html={html} {...module} />
      </Loading>
    </div>
  );
};
