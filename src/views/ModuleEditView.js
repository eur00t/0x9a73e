import React, { useEffect, useRef, useState } from "react";
import AceEditor from "react-ace";
import { Link } from "react-router-dom";

import { useAppStateContext } from "../state";
import { useTransactionsScope } from "../state/useTransactionsScope";
import { useEffectOnValueChange } from "../utils/useEffectOnValueChange";
import { TransactionButton } from "../components/TransactionButton";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-monokai";

export const ModuleEditView = ({ moduleName, onModuleChange }) => {
  const { setModule, getModule } = useAppStateContext();

  const nameRef = useRef();
  const depsRef = useRef();
  const codeRef = useRef();

  const scopeId = `module-edit-view-${moduleName}`;

  const { isPending } = useTransactionsScope(scopeId);

  const onSetModule = () => {
    setModule(scopeId, {
      name: nameRef.current.value,
      deps: JSON.parse(depsRef.current.value),
      code: codeRef.current.editor.getValue(),
    });
  };

  const [exists, setExists] = useState(false);

  const retrieve = async () => {
    if (!moduleName || moduleName === "") {
      return;
    }

    try {
      const module = await getModule(moduleName);
      setControls(module);
      setExists(true);
    } catch {
      setExists(false);
    }
  };

  const setControls = ({ name, dependencies, code }) => {
    nameRef.current.value = name;
    depsRef.current.value = JSON.stringify(dependencies);
    codeRef.current.editor.setValue(code);
  };

  useEffect(() => {
    setControls({ name: moduleName, dependencies: [], code: "" });
  }, []);

  useEffect(() => {
    nameRef.current.value = moduleName;
    setExists(false);
    retrieve();
  }, [moduleName]);

  useEffectOnValueChange(() => {
    if (isPending === false) {
      retrieve();
    }
  }, [isPending]);

  const navigateModule = () => {
    const nextModuleName = nameRef.current.value;

    if (nextModuleName !== "" && nextModuleName !== moduleName) {
      onModuleChange(nextModuleName);
    }
  };

  return (
    <div className="mt-3">
      <div className="row">
        <div className="col">
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input
              className="form-control"
              ref={nameRef}
              onBlur={navigateModule}
              type="text"
            ></input>
          </div>
        </div>
        <div className="col">
          <div className="mb-3">
            <label className="form-label">Deps</label>
            <input className="form-control" ref={depsRef} type="text"></input>
          </div>
        </div>
      </div>

      {exists ? (
        <Link
          className="btn btn-outline-primary btn-sm mb-3"
          to={`/modules/details/${moduleName}`}
        >
          View
        </Link>
      ) : null}

      <div className="mb-3">
        <label className="form-label">Code</label>
        <AceEditor
          ref={codeRef}
          mode="javascript"
          theme="monokai"
          name="UNIQUE_ID_OF_DIV"
          editorProps={{ $blockScrolling: true }}
          setOptions={{
            useWorker: false,
          }}
          width="100%"
        />
      </div>

      <div className="mb-3">
        <TransactionButton
          scopeId={scopeId}
          text={exists ? "update module" : "create module"}
          onClick={onSetModule}
        />
      </div>
    </div>
  );
};
