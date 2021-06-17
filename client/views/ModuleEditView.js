import React, {
  useEffect,
  useCallback,
  useRef,
  useState,
  useMemo,
} from "react";
import AceEditor from "react-ace";
import classNames from "classnames";
import debounce from "debounce";
import { Link } from "react-router-dom";

import { useContractContext } from "../state";
import { useTransactionsPendingChange } from "../state/useTransactionsPendingChange";

import { TransactionButton } from "../components/TransactionButton";
import { useLoading } from "../components/useLoading";
import { Loading } from "../components/Loading";
import { withOwner, OnlyOwner } from "../components/withOwner";
import { useAccount } from "../utils/networks";
import { DEFAULT_MODULE_DATA } from "../utils/defaultModule";
import { makeFullScreen, resetFullScreen } from "../utils/viewport";
import { EMPTY_MODULE_DATA } from "../utils/emptyModule";
import Refresh from "../icons/refresh.svg";
import { DepsControl } from "../components/DepsControl";

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

  const retrievePreview = useCallback(
    async ({ dependencies, code, isInvocable }) => {
      const previewHtml = await getHtmlPreview(dependencies, code, isInvocable);
      setPreviewHtml(previewHtml);
    },
    [getHtmlPreview, setPreviewHtml]
  );

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

const validateModuleDOM = (module, isCreateMode, exists) => {
  const { name, dependenciesRaw, code } = module;

  const errors = [];

  if (!name || name === "") {
    errors.push("The name must not be empty");
  } else {
    if (exists && isCreateMode) {
      errors.push(`Lambda with the name "${name}" already exists`);
    }
  }

  const wrongDependencies = dependenciesRaw.filter(({ exists }) => !exists);
  if (wrongDependencies.length > 0) {
    errors.push(
      `The following dependencies do not exist: ${wrongDependencies
        .map(({ moduleName }) => moduleName)
        .join(", ")}`
    );
  }

  let moduleConstructor;

  try {
    moduleConstructor = eval(code);

    if (typeof moduleConstructor !== "function") {
      errors.push(`Code must eval to a single constructor function`);
    }
  } catch (e) {
    errors.push(`Can't parse code: ${e.message}`);
  }

  return errors;
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
      invocableOnRef.current.checked = isInvocable;
      invocableOffRef.current.checked = !isInvocable;
    }, [isInvocable]);

    useEffect(() => {
      descriptionRef.current.value = description;
    }, [description]);

    useEffect(() => {
      if (code !== "") {
        codeRef.current.editor.programmaticUpdate = true;
        codeRef.current.editor.setValue(code);
        codeRef.current.editor.programmaticUpdate = false;
      }
    }, [code]);

    const recalcEditorSize = () => {
      codeRef.current.editor.container.style.height = `${codeContainerRef.current.offsetHeight}px`;
      codeRef.current.editor.resize();
    };

    useEffect(() => {
      makeFullScreen();
      recalcEditorSize();
      return () => {
        resetFullScreen();
      };
    }, []);

    const getModuleDOM = useCallback(
      () => ({
        name: nameRef.current ? nameRef.current.value : moduleName,
        dependenciesRaw: JSON.parse(depsRef.current.value),
        dependencies: JSON.parse(depsRef.current.value).map(
          ({ moduleName }) => moduleName
        ),
        code: codeRef.current.editor.getValue(),
        metadataJSON: JSON.stringify({
          description: descriptionRef.current.value,
        }),
        isInvocable: invocableOnRef.current.checked,
      }),
      [moduleName, nameRef, depsRef, codeRef, descriptionRef, invocableOnRef]
    );

    const [showErrors, setShowErrors] = useState(false);
    const [validationErrors, setValidationsErrors] = useState([]);

    useEffect(() => {
      recalcEditorSize();
    }, [validationErrors.length]);

    const recalcValidation = () => {
      if (showErrors) {
        setValidationsErrors(
          validateModuleDOM(getModuleDOM(), isCreateMode, exists)
        );
      }
    };

    useEffect(() => {
      recalcValidation();
    }, [showErrors, isCreateMode, exists]);

    const onSetModuleDOM = useCallback(() => {
      const module = getModuleDOM();
      const errors = validateModuleDOM(module, isCreateMode, exists);

      if (errors.length > 0) {
        setValidationsErrors(errors);
        setShowErrors(true);
        return;
      }

      onSetModule(module);
    }, [
      getModuleDOM,
      validateModuleDOM,
      onSetModule,
      setValidationsErrors,
      isCreateMode,
      exists,
    ]);

    const { loadPreview, preview } = usePreview();

    const onLoadPreviewDOM = useCallback(() => {
      const module = getModuleDOM();

      if (showErrors) {
        setValidationsErrors(validateModuleDOM(module, isCreateMode, exists));
      }

      loadPreview(module);
    }, [
      codeRef,
      loadPreview,
      getModuleDOM,
      showErrors,
      validateModuleDOM,
      setValidationsErrors,
      isCreateMode,
      exists,
    ]);

    const onLoadPreviewDOMDebounced = useMemo(
      () => debounce(onLoadPreviewDOM, 1000),
      [debounce, onLoadPreviewDOM]
    );

    const onLoadPreviewAce = () => {
      if (codeRef.current.editor.programmaticUpdate) {
        return;
      }

      onLoadPreviewDOMDebounced();
    };

    const onChangeModuleName = (moduleName) => {
      recalcValidation();

      changeModuleName(moduleName);
    };

    useEffect(() => {
      loadPreview(module);
    }, [module.dependencies, module.code, module.isInvocable]);

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
          className="btn btn-outline-secondary"
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
          className="btn btn-outline-secondary"
          htmlFor="btn-module-non-invocable"
        >
          Non-Mintable
        </label>
      </div>
    );

    return (
      <div
        style={{ flex: 1, overflow: "auto" }}
        className="pt-2 pb-2 d-flex flex-row container"
      >
        <Loading
          style={{ width: "634px" }}
          isLoading={isLoading && !isCreateMode}
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
                    onBlur={() => onChangeModuleName(nameRef.current.value)}
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

          <div className="row align-items-center">
            <label className="col-sm-2 col-form-label col-form-label-sm">
              Deps
            </label>
            <div className="col-sm-10">
              <DepsControl
                ref={depsRef}
                disabled={isFinalized}
                value={dependencies}
                onChange={() => onLoadPreviewDOM()}
              />
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
              onChange={() => onLoadPreviewAce()}
              onFocus={() => recalcEditorSize()}
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
                    text={
                      isCreateMode || (!isCreateMode && !exists)
                        ? "Create Lambda"
                        : "Update Lambda"
                    }
                    onClick={onSetModuleDOM}
                    disabled={
                      isFinalized ||
                      !isOwner ||
                      (showErrors && validationErrors.length > 0)
                    }
                  />
                );
              }}
            </OnlyOwner>

            {validationErrors.length > 0 ? (
              <div>
                {validationErrors.map((str, i) => {
                  return (
                    <div key={i} className="invalid-feedback d-block">
                      {str}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </Loading>
        <div
          style={{ flex: "1 1 0" }}
          className="ms-2 d-none d-lg-flex flex-column"
        >
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
    ...(isCreateMode ? DEFAULT_MODULE_DATA : EMPTY_MODULE_DATA),
    name: moduleName,
    owner: account,
  });

  const retrieve = async () => {
    if (!moduleName || moduleName === "") {
      return;
    }

    setExists(false);

    setModuleData((moduleData) => ({
      ...moduleData,
      name: moduleName,
    }));

    try {
      const module = await getModule(moduleName, true);
      setExists(true);
      if (!isCreateMode) {
        setModuleData(module);
      }
    } catch {
      setExists(false);
    }
  };

  const { isLoading, load } = useLoading(retrieve);

  useEffect(() => {
    load();
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

  const onSetModule = useCallback(
    (module) => {
      if (exists && isCreateMode) {
        return;
      }

      setModule(scopeId, module);
    },
    [exists, isCreateMode, scopeId, setModule]
  );

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
