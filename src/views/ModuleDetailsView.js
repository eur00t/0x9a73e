import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useContractContext } from "../state";
import { useLoading } from "../components/useLoading";
import { Loading } from "../components/Loading";

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
        <dl>
          <dt>Name</dt>
          <dd>{module.name}</dd>
          <dt>Owner</dt>
          <dd>{module.owner}</dd>
          <dt>Dependencies</dt>
          <dd>
            {module.dependencies.length > 0 ? (
              module.dependencies.join(", ")
            ) : (
              <em>none</em>
            )}
          </dd>
        </dl>

        <Link
          className="btn btn-outline-primary btn-sm mb-3"
          to={`/modules/edit/${module.name}`}
        >
          Edit
        </Link>

        <iframe
          srcDoc={html}
          style={{ width: "100%", height: "500px", border: 0 }}
        ></iframe>
      </Loading>
    </div>
  );
};
