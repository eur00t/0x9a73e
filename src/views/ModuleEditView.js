import React, { useEffect, useRef, useState, useMemo } from "react";
import AceEditor from "react-ace";
import classNames from "classnames";
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
      style={{
        width: "100%",
        height: "100%",
        border: "1px solid #ced4da",
        borderRadius: "0.2rem",
      }}
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
    const invocableOnRef = useRef();
    const invocableOffRef = useRef();

    const { dependencies, code, metadataJSON, isInvocable, isFinalized } =
      module;
    const { description } = useMemo(
      () => JSON.parse(metadataJSON),
      [metadataJSON]
    );

    useEffect(() => {
      depsRef.current.value = JSON.stringify(dependencies);
    }, [dependencies]);

    useEffect(() => {
      invocableOnRef.current.checked = isInvocable;
      invocableOffRef.current.checked = !isInvocable;
    }, [isInvocable]);

    useEffect(() => {
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
    }, []);

    const getModuleDOM = () => ({
      name: nameRef.current ? nameRef.current.value : moduleName,
      dependencies: JSON.parse(depsRef.current.value),
      code: codeRef.current.editor.getValue(),
      metadataJSON: JSON.stringify({
        description: descriptionRef.current.value,
      }),
      isInvocable: invocableOnRef.current.checked,
    });

    const onSetModuleDOM = () => {
      const module = getModuleDOM();

      if (module.name === "" || (exists && isCreateMode)) {
        return;
      }

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

    const isInvocableSelect = (
      <div
        className="btn-group btn-group-sm ms-auto"
        style={{ whiteSpace: "nowrap" }}
      >
        <input
          ref={invocableOnRef}
          type="radio"
          className="btn-check"
          name="btn-module-is-invocable"
          id="btn-module-invocable"
          autoComplete="off"
          disabled={isFinalized}
          onChange={() => onLoadPreviewDOM()}
        />
        <label
          className="btn btn-outline-primary"
          htmlFor="btn-module-invocable"
        >
          Mintable
        </label>
        <input
          ref={invocableOffRef}
          type="radio"
          className="btn-check"
          name="btn-module-is-invocable"
          id="btn-module-non-invocable"
          autoComplete="off"
          disabled={isFinalized}
          onChange={() => onLoadPreviewDOM()}
        />
        <label
          className="btn btn-outline-primary"
          htmlFor="btn-module-non-invocable"
        >
          Non-Mintable
        </label>
      </div>
    );

    return (
      <div
        style={{ flex: 1, overflow: "auto" }}
        className="p-2 d-flex flex-row"
      >
        <Loading
          style={{ width: "634px" }}
          isLoading={isLoading}
          className="d-flex flex-column"
        >
          <div className="row mb-2">
            <label className="col-sm-2 col-form-label col-form-label-sm">
              Name
            </label>
            <div className="col-sm-10">
              <div className="d-flex align-items-center">
                {isCreateMode ? (
                  <input
                    className={classNames("form-control form-control-sm me-2", {
                      "is-invalid": exists,
                    })}
                    ref={nameRef}
                    onBlur={() => changeModuleName(nameRef.current.value)}
                    type="text"
                    disabled={isFinalized}
                  ></input>
                ) : (
                  <strong className="fs-6">{moduleName}</strong>
                )}

                {isInvocableSelect}
              </div>
            </div>
          </div>

          <div className="row mb-2">
            <label className="col-sm-2 col-form-label col-form-label-sm">
              Description
            </label>
            <div className="col-sm-10">
              <textarea
                ref={descriptionRef}
                className="form-control form-control-sm"
                style={{ resize: "none" }}
                disabled={isFinalized}
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
                onBlur={() => onLoadPreviewDOM()}
                disabled={isFinalized}
              ></input>
            </div>
          </div>

          <div
            className="mb-2 mt-2"
            ref={codeContainerRef}
            style={{ flex: "1 1 auto", overflow: "auto" }}
          >
            <AceEditor
              ref={codeRef}
              mode="javascript"
              theme="monokai"
              name="UNIQUE_ID_OF_DIV"
              editorProps={{ $blockScrolling: true }}
              debounceChangePeriod={1000}
              onChange={() => onLoadPreviewDOM()}
              setOptions={{
                useWorker: false,
                tabSize: 2,
                useSoftTabs: true,
                showPrintMargin: false,
              }}
              width="100%"
              readOnly={isFinalized}
            />
          </div>

          <div className="d-flex">
            <OnlyOwner>
              {(isOwner) => {
                return (
                  <TransactionButton
                    scopeId={scopeId}
                    text={exists ? "Update Module" : "Create Module"}
                    onClick={onSetModuleDOM}
                    disabled={isFinalized || !isOwner}
                  />
                );
              }}
            </OnlyOwner>
          </div>
        </Loading>
        <div style={{ flex: "1 1 0" }} className="ms-2 d-flex flex-column">
          <div className="d-flex align-items-center mb-2 ms-auto">
            <div
              className="btn btn-outline-primary btn-sm"
              onClick={onLoadPreviewDOM}
            >
              <Refresh />
            </div>

            {exists ? (
              <Link
                className="btn btn-outline-primary btn-sm ms-2"
                to={`/modules/details/${moduleName}`}
              >
                View
              </Link>
            ) : null}
          </div>
          <div style={{ flex: "1 1 0" }}>{preview}</div>
        </div>
      </div>
    );
  },
  "ModuleEdit"
);

export const ModuleEditView = ({
  isCreateMode,
  onCreateDone,
  moduleName: moduleNameRoute,
}) => {
  const { setModule, getModule } = useContractContext();

  const [moduleName, setModuleName] = useState(moduleNameRoute);
  const scopeId = `module-edit-view-${moduleName}`;

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
      if (!isCreateMode) {
        setModuleData(module);
      }
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
    if (isPending === false && isCreateMode) {
      onCreateDone(moduleName);
      return;
    }

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
