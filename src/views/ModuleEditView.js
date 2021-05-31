import React, { useEffect, useRef, useState } from "react";
import AceEditor from "react-ace";
import { Link } from "react-router-dom";

import { useContractContext } from "../state";
import { useTransactionsPendingChange } from "../state/useTransactionsPendingChange";

import { TransactionButton } from "../components/TransactionButton";
import { useLoading } from "../components/useLoading";
import { Loading } from "../components/Loading";
import { withOwner, OnlyOwner } from "../components/withOwner";
import { useAccount } from "../utils/networks";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-monokai";

const ModuleEdit = withOwner(
  ({ scopeId, module, moduleName, navigateModule, onSetModule, exists }) => {
    const nameRef = useRef();
    const depsRef = useRef();
    const codeRef = useRef();

    useEffect(() => {
      nameRef.current.value = moduleName;
    }, [moduleName]);

    useEffect(() => {
      depsRef.current.value = JSON.stringify(module.dependencies);
    }, [module.dependencies]);

    useEffect(() => {
      if (module.code !== "") {
        codeRef.current.editor.setValue(module.code);
      }
    }, [module.code]);

    const onSetModuleDOM = () => {
      onSetModule({
        name: nameRef.current.value,
        deps: JSON.parse(depsRef.current.value),
        code: codeRef.current.editor.getValue(),
      });
    };

    return (
      <>
        <div className="row">
          <div className="col">
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input
                className="form-control"
                ref={nameRef}
                onBlur={() => navigateModule(nameRef.current.value)}
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
          <OnlyOwner>
            <TransactionButton
              scopeId={scopeId}
              text={exists ? "update module" : "create module"}
              onClick={onSetModuleDOM}
            />
          </OnlyOwner>
        </div>
      </>
    );
  },
  "ModuleEdit"
);

const EMPTY_MODULE_DATA = { name: "", dependencies: [], code: "", owner: "" };

export const ModuleEditView = ({ moduleName, onModuleChange }) => {
  const { setModule, getModule } = useContractContext();

  const scopeId = `module-edit-view-${moduleName}`;

  const [exists, setExists] = useState(false);
  const account = useAccount();

  const [moduleData, setModuleData] = useState({
    ...EMPTY_MODULE_DATA,
    name: moduleName,
  });

  const retrieve = async () => {
    if (!moduleName || moduleName === "") {
      return;
    }

    try {
      const module = await getModule(moduleName);
      setModuleData(module);
      setExists(true);
    } catch {
      setExists(false);
      setModuleData((moduleData) => ({
        ...moduleData,
        name: moduleName,
        owner: account,
      }));
    }
  };

  const { isLoading, load } = useLoading(retrieve);

  useEffect(() => {
    setExists(false);

    if (!moduleName) {
      setModuleData(EMPTY_MODULE_DATA);
    } else {
      load();
    }
  }, [moduleName]);

  useTransactionsPendingChange(scopeId, (isPending) => {
    if (isPending === false) {
      load();
    }
  });

  const onSetModule = (module) => {
    setModule(scopeId, module);
  };

  const navigateModule = (nextModuleName) => {
    if (nextModuleName !== "" && nextModuleName !== moduleName) {
      onModuleChange(nextModuleName);
    }
  };

  return (
    <div className="mt-3">
      <Loading isLoading={isLoading}>
        <ModuleEdit
          {...{
            owner: moduleData.owner,
            scopeId,
            module: moduleData,
            moduleName,
            exists,
            onSetModule,
            navigateModule,
          }}
        />
      </Loading>
    </div>
  );
};
