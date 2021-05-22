import React, { useEffect, useRef, useState } from "react";

import { useAppStateContext } from "../state";

export const ModuleDetailsView = ({ moduleName, onModuleChange }) => {
  const moduleIdRef = useRef();

  const [html, setHtml] = useState("");

  const { getHtml } = useAppStateContext();

  const retrieve = async () => {
    if (!moduleName || moduleName === "") {
      return;
    }

    try {
      const html = await getHtml(moduleName);
      setHtml(html);
    } catch {
      onModuleChange(null);
    }
  };

  useEffect(() => {
    retrieve();
    moduleIdRef.current.value = moduleName;
  }, [moduleName]);

  const navigateModule = () => {
    const nextModuleName = moduleIdRef.current.value;

    if (nextModuleName !== "" && nextModuleName !== moduleName) {
      onModuleChange(nextModuleName);
    }
  };

  return (
    <div className="mt-3">
      <div className="mb-3">
        <label className="form-label">Module</label>
        <input
          ref={moduleIdRef}
          defaultValue={moduleName}
          type="text"
          className="form-control"
        ></input>
      </div>
      <div className="mb-3">
        <button className="btn btn-outline-primary" onClick={navigateModule}>
          get module html
        </button>
      </div>

      <iframe
        srcDoc={html}
        style={{ width: "100%", height: "500px", border: 0 }}
      ></iframe>
    </div>
  );
};
