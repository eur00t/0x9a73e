import React from "react";
import { useParams, useHistory } from "react-router-dom";

import { ModuleEditView } from "../views/ModuleEditView";

export const ModuleEditRoute = ({ isCreateMode }) => {
  const { moduleName = "" } = useParams();
  const history = useHistory();

  const onCreateDone = (moduleName) => {
    history.push(`/modules/edit/${moduleName}`);
  };

  return (
    <ModuleEditView
      key={isCreateMode}
      isCreateMode={isCreateMode}
      moduleName={moduleName}
      onCreateDone={onCreateDone}
    />
  );
};
