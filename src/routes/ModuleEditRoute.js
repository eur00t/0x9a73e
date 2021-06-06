import React from "react";
import { useParams } from "react-router-dom";

import { ModuleEditView } from "../views/ModuleEditView";

export const ModuleEditRoute = ({ isCreateMode }) => {
  const { moduleName = "" } = useParams();

  return (
    <ModuleEditView
      key={isCreateMode}
      isCreateMode={isCreateMode}
      moduleName={moduleName}
    />
  );
};
