import React, { useEffect, useRef, useState, useMemo } from "react";
import AceEditor from "react-ace";
import { Link } from "react-router-dom";

import { useContractContext } from "../state";
import { useTransactionsPendingChange } from "../state/useTransactionsPendingChange";

import { TransactionButton } from "../components/TransactionButton";
import { useLoading } from "../components/useLoading";
import { Loading } from "../components/Loading";
import { withOwner, OnlyOwner } from "../components/withOwner";
import { useAccount } from "../utils/networks";
import { EMPTY_MODULE_DATA } from "../utils/emptyModule";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-monokai";

const ModuleEdit = withOwner(
  ({ scopeId, module, moduleName, navigateModule, onSetModule, exists }) => {
    const nameRef = useRef();
    const depsRef = useRef();
    const codeRef = useRef();
    const descriptionRef = useRef();

    const { dependencies, code, metadataJSON } = module;
    const { description } = useMemo(
      () => JSON.parse(metadataJSON),
      [metadataJSON]
    );

    useEffect(() => {
      nameRef.current.value = moduleName;
    }, [moduleName]);

    useEffect(() => {
      depsRef.current.value = JSON.stringify(dependencies);
    }, [dependencies]);

    useEffect(() => {
      descriptionRef.current.value = description;
    }, [description]);

    useEffect(() => {
      if (code !== "") {
        codeRef.current.editor.setValue(code);
      }
    }, [code]);

    const onSetModuleDOM = () => {
      onSetModule({
        name: nameRef.current.value,
        deps: JSON.parse(depsRef.current.value),
        code: codeRef.current.editor.getValue(),
        metadataJSON: JSON.stringify({
          description: descriptionRef.current.value,
        }),
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

        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea ref={descriptionRef} className="form-control"></textarea>
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
          <OnlyOwner
            fallback={
              <>
                <div className="btn btn-outline-primary disabled">
                  {exists ? "Update Module" : "Create Module"}
                </div>
                {exists ? (
                  <small className="ms-3">
                    Only owners can update their modules.
                  </small>
                ) : null}
              </>
            }
          >
            <TransactionButton
              scopeId={scopeId}
              text={exists ? "Update Module" : "Create Module"}
              onClick={onSetModuleDOM}
            />
          </OnlyOwner>
        </div>
      </>
    );
  },
  "ModuleEdit"
);

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
    <div>
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
