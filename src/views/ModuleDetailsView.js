import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useContractContext } from "../state";
import { useTransactionsPendingChange } from "../state/useTransactionsPendingChange";
import { useLoading } from "../components/useLoading";
import { Loading } from "../components/Loading";
import { TransactionButton } from "../components/TransactionButton";
import { withOwner, OnlyOwner } from "../components/withOwner";
import { OnlyContractOwner } from "../components/OnlyContractOwner";

const getFeaturedScopeId = (name) => `featured-action-${name}`;

const ModuleDetails = withOwner((module) => {
  const { html, name, owner, dependencies, isFeatured } = module;
  const { setFeatured, unsetFeatured } = useContractContext();

  const featuredScopeId = getFeaturedScopeId(name);

  return (
    <>
      <dl>
        <dt>Name</dt>
        <dd>{name}</dd>
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

      <iframe
        srcDoc={html}
        style={{ width: "100%", height: "500px", border: 0 }}
      ></iframe>
    </>
  );
}, "ModuleDetails");

export const ModuleDetailsView = ({ moduleName, onModuleChange }) => {
  const [html, setHtml] = useState("");
  const [module, setModule] = useState({
    name: "",
    dependencies: [],
    owner: "",
  });

  const { getHtml, getModule } = useContractContext();

  const retrieve = async () => {
    if (!moduleName || moduleName === "") {
      return;
    }

    try {
      const html = await getHtml(moduleName);
      const module = await getModule(moduleName);
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

  useTransactionsPendingChange(featuredScopeId, (isPending) => {
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
