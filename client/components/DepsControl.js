import React, { useEffect, useRef, useState } from "react";
import classNames from "classnames";

import { useContractContext } from "../state";
import DashCircleFill from "../icons/dash-circle-fill.svg";

const DepsControlItem = ({
  moduleName,
  disabled,
  skipCheck = false,
  onReady,
  onRemove,
}) => {
  const { checkIfModuleExists } = useContractContext();

  const [exists, setExists] = useState(skipCheck);
  const [ready, setReady] = useState(skipCheck);

  const checkExists = async () => {
    const exists = await checkIfModuleExists(moduleName);
    setExists(exists);
    setReady(true);
    onReady(moduleName, exists);
  };

  useEffect(() => {
    if (!skipCheck) {
      checkExists();
    }
  }, []);

  const doesntExist = !skipCheck && ready && !exists;

  return (
    <div
      className={classNames("badge d-flex align-items-center mb-1 me-1", {
        "bg-secondary": !doesntExist,
        "bg-danger": doesntExist,
      })}
      style={{ height: "24px" }}
    >
      {moduleName}
      {!disabled ? (
        <DashCircleFill
          className="ms-1"
          style={{ cursor: "pointer" }}
          onClick={() => onRemove(moduleName)}
        />
      ) : null}
    </div>
  );
};

export const DepsControl = React.forwardRef(
  ({ value: valueProp, disabled, onChange }, ref) => {
    const transformFromPropValue = (value) =>
      value.map((moduleName) => ({
        moduleName,
        skipCheck: true,
        exists: true,
      }));
    const transformToPropValue = (value) =>
      value.map(({ moduleName }) => moduleName);

    const [value, setValue] = useState(transformFromPropValue(valueProp));
    const addInputRef = useRef();

    useEffect(() => {
      setValue(transformFromPropValue(valueProp));
    }, [valueProp]);

    const updateDOMValue = (value) => {
      ref.current.value = JSON.stringify(value);
    };

    useEffect(() => {
      updateDOMValue(value);
    }, [value]);

    const triggerOnChange = (nextValue) => {
      onChange(transformToPropValue(nextValue));
    };

    const removeItem = (moduleNameRemove) => {
      const nextValue = value.filter(
        ({ moduleName }) => moduleName !== moduleNameRemove
      );

      setValue(nextValue);
      updateDOMValue(nextValue);
      triggerOnChange(nextValue);
    };

    const addItem = (moduleNameAdd) => {
      const nextValue = [
        ...value.filter(({ moduleName }) => moduleName !== moduleNameAdd),
        { moduleName: moduleNameAdd, skipCheck: false },
      ];

      setValue(nextValue);
      updateDOMValue(nextValue);
      triggerOnChange(nextValue);
    };

    const onReady = (moduleNameReady, exists) => {
      const nextValue = value.map((item) => {
        const { moduleName } = item;

        if (moduleName !== moduleNameReady) {
          return item;
        }

        return { ...item, exists };
      });

      setValue(nextValue);
    };

    const addItemDOM = () => {
      if (addInputRef.current.value !== "") {
        addItem(addInputRef.current.value.trim());
        addInputRef.current.value = "";
      }
    };

    return (
      <form
        className="d-flex align-items-center flex-wrap"
        onSubmit={(e) => {
          e.preventDefault();
          addItemDOM();
        }}
      >
        <input type="text" ref={ref} hidden />

        {value.length === 0 && disabled ? <small>none</small> : null}

        {value.map(({ moduleName, skipCheck }) => {
          return (
            <DepsControlItem
              key={moduleName}
              moduleName={moduleName}
              skipCheck={skipCheck}
              disabled={disabled}
              onRemove={removeItem}
              onReady={onReady}
            />
          );
        })}

        {!disabled ? (
          <div className="input-group" style={{ flex: "1 1 180px" }}>
            <input
              ref={addInputRef}
              disabled={disabled}
              type="text"
              className="form-control form-control-sm "
            />
            <div
              className="btn btn-sm btn-outline-secondary"
              onClick={addItemDOM}
            >
              Add
            </div>
          </div>
        ) : null}

        <button type="submit" hidden />
      </form>
    );
  }
);
