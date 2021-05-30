import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useContractContext } from "../state";
import { useLoading } from "../components/useLoading";
import { Loading } from "../components/Loading";
import { withOwner, OnlyOwner } from "../components/withOwner";

const ModuleDetails = withOwner((module) => {
  const { html, name, owner, dependencies } = module;

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

  return (
    <div className="mt-3">
      <Loading isLoading={isLoading}>
        <ModuleDetails html={html} {...module} />
      </Loading>
    </div>
  );
};
