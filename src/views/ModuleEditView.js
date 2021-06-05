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
  ({
    scopeId,
    module,
    moduleName,
    navigateModule,
    onSetModule,
    onLoadPreview,
    exists,
  }) => {
    const nameRef = useRef();
    const depsRef = useRef();
    const codeRef = useRef();
    const codeContainerRef = useRef();
    const descriptionRef = useRef();
    const mintableRef = useRef();

    const { dependencies, code, metadataJSON, isInvocable } = module;
    const { description } = useMemo(
      () => JSON.parse(metadataJSON),
      [metadataJSON]
    );

    useEffect(() => {
      if (!nameRef.current) {
        return;
      }

      nameRef.current.value = moduleName;
    }, [moduleName]);

    useEffect(() => {
      if (!depsRef.current) {
        return;
      }

      depsRef.current.value = JSON.stringify(dependencies);
    }, [dependencies]);

    useEffect(() => {
      if (!descriptionRef.current) {
        return;
      }

      descriptionRef.current.value = description;
    }, [description]);

    useEffect(() => {
      if (code !== "") {
        codeRef.current.editor.setValue(code);
      }
    }, [code]);

    useEffect(() => {
      codeRef.current.editor.container.style.height = `${codeContainerRef.current.offsetHeight}px`;
      codeRef.current.editor.resize();
    }, [code, exists]);

    const getModuleDOM = () => ({
      name: nameRef.current.value,
      deps: JSON.parse(depsRef.current.value),
      code: codeRef.current.editor.getValue(),
      metadataJSON: JSON.stringify({
        description: descriptionRef.current.value,
      }),
    });

    const onSetModuleDOM = () => {
      onSetModule(getModuleDOM());
    };

    const onLoadPreviewDOM = () => {
      onLoadPreview(
        getModuleDOM(),
        exists ? isInvocable : mintableRef.current.checked
      );
    };

    return (
      <>
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
                <input
                  className="form-control"
                  ref={depsRef}
                  type="text"
                ></input>
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea ref={descriptionRef} className="form-control"></textarea>
          </div>
        </>

        <div className="d-flex align-items-center mt-3 mb-3">
          {exists ? (
            <Link
              className="btn btn-outline-primary btn-sm me-1"
              to={`/modules/details/${moduleName}`}
            >
              View
            </Link>
          ) : null}
          <div
            className="btn btn-outline-primary btn-sm"
            onClick={onLoadPreviewDOM}
          >
            Load Preview
          </div>

          {!exists ? (
            <div className="form-check ms-3">
              <input
                ref={mintableRef}
                className="form-check-input"
                id="module-edit-mintable"
                type="checkbox"
                value=""
                onChange={() => {}}
              />
              <label
                className="form-check-label"
                htmlFor="module-edit-mintable"
              >
                Mintable
              </label>
            </div>
          ) : null}
        </div>

        <label className="form-label">Code</label>
        <div
          className="mb-3"
          ref={codeContainerRef}
          style={{ flex: "1 1 auto", overflow: "auto" }}
        >
          <AceEditor
            ref={codeRef}
            mode="javascript"
            theme="monokai"
            name="UNIQUE_ID_OF_DIV"
            editorProps={{ $blockScrolling: true }}
            setOptions={{
              useWorker: false,
              tabSize: 2,
              useSoftTabs: true,
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
  const { setModule, getModule, getHtmlPreview } = useContractContext();

  const scopeId = `module-edit-view-${moduleName}`;

  const [exists, setExists] = useState(false);
  const account = useAccount();

  const [moduleData, setModuleData] = useState({
    ...EMPTY_MODULE_DATA,
    name: moduleName,
  });

  const [previewHtml, setPreviewHtml] = useState("");

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

  const retrievePreview = async ({ deps, code }, isInvocable) => {
    const previewHtml = await getHtmlPreview(deps, code, isInvocable);
    setPreviewHtml(previewHtml);
  };

  const { isLoading: isLoadingPreview, load: loadPreview } =
    useLoading(retrievePreview);

  return (
    <div style={{ flex: 1, overflow: "auto" }} className="m-1 d-flex flex-row">
      <Loading
        style={{ width: "634px" }}
        isLoading={isLoading}
        className="d-flex flex-column"
      >
        <ModuleEdit
          {...{
            owner: moduleData.owner,
            scopeId,
            module: moduleData,
            moduleName,
            exists,
            onSetModule,
            onLoadPreview: loadPreview,
            navigateModule,
          }}
        />
      </Loading>
      <div style={{ flex: "1 1 0" }} className="ms-2 d-flex flex-column">
        <label className="form-label d-flex align-items-center">Preview</label>
        <div style={{ flex: "1 1 0" }}>
          <Loading
            style={{ width: "100%", height: "100%" }}
            isLoading={isLoadingPreview}
          >
            <iframe
              srcDoc={previewHtml}
              style={{ width: "100%", height: "100%" }}
            ></iframe>
          </Loading>
        </div>
      </div>
    </div>
  );
};
