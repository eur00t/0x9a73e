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
import Refresh from "../icons/refresh.svg";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-monokai";

const Preview = ({ isLoadingPreview, previewHtml }) => {
  return (
    <Loading
      style={{ width: "100%", height: "100%" }}
      isLoading={isLoadingPreview}
    >
      <iframe
        srcDoc={previewHtml}
        style={{ width: "100%", height: "100%" }}
      ></iframe>
    </Loading>
  );
};

const usePreview = () => {
  const { getHtmlPreview } = useContractContext();

  const [previewHtml, setPreviewHtml] = useState("");

  const retrievePreview = async ({ dependencies, code, isInvocable }) => {
    const previewHtml = await getHtmlPreview(dependencies, code, isInvocable);
    setPreviewHtml(previewHtml);
  };

  const { isLoading: isLoadingPreview, load: loadPreview } =
    useLoading(retrievePreview);

  const preview = (
    <Preview isLoadingPreview={isLoadingPreview} previewHtml={previewHtml} />
  );

  return {
    preview,
    loadPreview,
  };
};

const ModuleEdit = withOwner(
  ({
    isLoading,
    isCreateMode,
    scopeId,
    module,
    moduleName,
    changeModuleName,
    onSetModule,
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
      if (!depsRef.current || isCreateMode) {
        return;
      }

      depsRef.current.value = JSON.stringify(dependencies);
    }, [dependencies, isCreateMode]);

    useEffect(() => {
      if (!descriptionRef.current || isCreateMode) {
        return;
      }

      descriptionRef.current.value = description;
    }, [description, isCreateMode]);

    useEffect(() => {
      if (!codeRef.current || isCreateMode) {
        return;
      }

      if (code !== "") {
        codeRef.current.editor.setValue(code);
      }
    }, [code, isCreateMode]);

    useEffect(() => {
      codeRef.current.editor.container.style.height = `${codeContainerRef.current.offsetHeight}px`;
      codeRef.current.editor.resize();
    }, [isCreateMode]);

    const getModuleDOM = () => ({
      name: nameRef.current ? nameRef.current.value : moduleName,
      dependencies: JSON.parse(depsRef.current.value),
      code: codeRef.current.editor.getValue(),
      metadataJSON: JSON.stringify({
        description: descriptionRef.current.value,
      }),
      isInvocable: exists ? isInvocable : mintableRef.current.checked,
    });

    const onSetModuleDOM = () => {
      onSetModule(getModuleDOM());
    };

    const { loadPreview, preview } = usePreview();

    const onLoadPreviewDOM = () => {
      loadPreview(getModuleDOM());
    };

    useEffect(() => {
      if (exists) {
        loadPreview(module);
      }
    }, [exists]);

    return (
      <div
        style={{ flex: 1, overflow: "auto" }}
        className="p-1 d-flex flex-row"
      >
        <Loading
          style={{ width: "634px" }}
          isLoading={isLoading}
          className="d-flex flex-column"
        >
          <div className="d-flex align-items-top">
            <div style={{ flex: "1 1 0" }}>
              {isCreateMode ? (
                <div className="row mb-2">
                  <label className="col-sm-2 col-form-label col-form-label-sm">
                    Name
                  </label>
                  <div className="col-sm-10">
                    <input
                      className="form-control form-control-sm"
                      ref={nameRef}
                      onBlur={() => changeModuleName(nameRef.current.value)}
                      type="text"
                    ></input>
                  </div>
                </div>
              ) : null}

              <div className="row mb-2">
                <label className="col-sm-2 col-form-label col-form-label-sm">
                  Description
                </label>
                <div className="col-sm-10">
                  <textarea
                    ref={descriptionRef}
                    className="form-control form-control-sm"
                    style={{ resize: "none" }}
                  ></textarea>
                </div>
              </div>

              <div className="row">
                <label className="col-sm-2 col-form-label col-form-label-sm">
                  Deps
                </label>
                <div className="col-sm-10">
                  <input
                    className="form-control form-control-sm"
                    ref={depsRef}
                    type="text"
                  ></input>
                </div>
              </div>
            </div>
          </div>

          <div
            className="mb-3 mt-3"
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
        </Loading>
        <div style={{ flex: "1 1 0" }} className="ms-2 d-flex flex-column">
          <label className="d-flex align-items-center">
            <div className="btn me-2" onClick={onLoadPreviewDOM}>
              <Refresh />
            </div>

            {exists ? (
              <Link
                className="btn btn-outline-primary btn-sm me-2"
                to={`/modules/details/${moduleName}`}
              >
                View
              </Link>
            ) : null}

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
          </label>
          <div style={{ flex: "1 1 0" }}>{preview}</div>
        </div>
      </div>
    );
  },
  "ModuleEdit"
);

export const ModuleEditView = ({
  isCreateMode,
  moduleName: moduleNameRoute,
}) => {
  const { setModule, getModule, getHtmlPreview } = useContractContext();

  const scopeId = `module-edit-view-${!isCreateMode ? moduleName : "create"}`;

  const [moduleName, setModuleName] = useState(moduleNameRoute);

  useEffect(() => {
    setModuleName(moduleNameRoute);
  }, [moduleNameRoute]);

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

  const changeModuleName = (nextModuleName) => {
    if (nextModuleName !== "" && nextModuleName !== moduleName) {
      setModuleName(nextModuleName);
    }
  };

  return (
    <ModuleEdit
      {...{
        isLoading,
        isCreateMode,
        owner: moduleData.owner,
        scopeId,
        module: moduleData,
        moduleName,
        exists,
        onSetModule,
        changeModuleName,
      }}
    />
  );
};
