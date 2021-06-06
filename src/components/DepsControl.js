import React, { useEffect, useRef, useState } from "react";
import classNames from "classnames";

import { useContractContext } from "../state";
import DashCircleFill from "../icons/dash-circle-fill.svg";

const DepsControlItem = ({
  moduleName,
  disabled,
  skipCheck = false,
  onRemove,
}) => {
  const { checkIfModuleExists } = useContractContext();

  const [exists, setExists] = useState(skipCheck);
  const [ready, setReady] = useState(skipCheck);

  const checkExists = async () => {
    console.log("checking");
    const exists = await checkIfModuleExists(moduleName);
    setExists(exists);
    setReady(true);
  };

  useEffect(() => {
    if (!skipCheck) {
      checkExists();
    }
  }, []);

  const doesntExist = !skipCheck && ready && !exists;

  return (
    <div
      className={classNames("badge d-flex align-items-center", {
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
      value.map((moduleName) => ({ moduleName, skipCheck: true }));
    const transformToPropValue = (value) =>
      value.map(({ moduleName }) => moduleName);

    const [value, setValue] = useState(transformFromPropValue(valueProp));
    const addInputRef = useRef();

    useEffect(() => {
      setValue(transformFromPropValue(valueProp));
    }, [valueProp]);

    useEffect(() => {
      const propValue = transformToPropValue(value);

      ref.current.value = JSON.stringify(propValue);
      onChange(propValue);
    }, [value]);

    const removeItem = (moduleNameRemove) => {
      setValue((value) =>
        value.filter(({ moduleName }) => moduleName !== moduleNameRemove)
      );
    };

    const addItem = (moduleNameAdd) => {
      setValue((value) => [
        ...value.filter(({ moduleName }) => moduleName !== moduleNameAdd),
        { moduleName: moduleNameAdd, skipCheck: false },
      ]);
    };

    const addItemDOM = () => {
      if (addInputRef.current.value !== "") {
        addItem(addInputRef.current.value);
        addInputRef.current.value = "";
      }
    };

    return (
      <form
        className="d-flex align-items-center gap-1 flex-wrap"
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
