import React from "react";
import { useHistory, useParams } from "react-router-dom";
import { ModuleDetailsView } from "../views/ModuleDetailsView";

export const ModuleDetailsRoute = () => {
  const { moduleName = "" } = useParams();
  const history = useHistory();

  const onModuleChange = (nextModuleName) => {
    if (!nextModuleName) {
      history.push(`/modules/details`);
    } else {
      history.push(`/modules/details/${nextModuleName}`);
    }
  };

  return (
    <ModuleDetailsView
      moduleName={moduleName}
      onModuleChange={onModuleChange}
    />
  );
};
