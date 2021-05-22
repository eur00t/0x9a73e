import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useAppStateContext } from "../state";

export const ModuleDetailsView = ({ moduleName, onModuleChange }) => {
  const moduleIdRef = useRef();

  const [html, setHtml] = useState("");
  const [module, setModule] = useState({
    name: "",
    dependencies: [],
    owner: "",
  });

  const { getHtml, getModule } = useAppStateContext();

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

  useEffect(() => {
    retrieve();
  }, [moduleName]);

  return (
    <div className="mt-3">
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
    </div>
  );
};
