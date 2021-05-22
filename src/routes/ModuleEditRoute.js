import React from "react";
import { useHistory, useParams } from "react-router-dom";

import { ModuleEditView } from "../views/ModuleEditView";

export const ModuleEditRoute = () => {
  const { moduleName = "" } = useParams();
  const history = useHistory();

  const onModuleChange = (nextModuleName) => {
    if (!nextModuleName) {
      history.push(`/modules/edit`);
    } else {
      history.push(`/modules/edit/${nextModuleName}`);
    }
  };

  return (
    <ModuleEditView moduleName={moduleName} onModuleChange={onModuleChange} />
  );
};
