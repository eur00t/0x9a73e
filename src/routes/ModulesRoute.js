import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useContractContext } from "../state";

export const ModulesRoute = () => {
  const { getModules } = useContractContext();

  const [modules, setModules] = useState([]);

  const retreive = async () => {
    setModules([]);
    setModules(await getModules());
  };

  useEffect(() => {
    retreive();
  }, []);

  return (
    <div className="mt-3 d-flex gap-2 flex-wrap">
      {modules.map(({ name, owner, dependencies }) => {
        return (
          <div key={name} className="card" style={{ width: "20rem" }}>
            <div className="card-body">
              <h5 className="card-title">{name}</h5>
              <dl>
                <dt>Owner</dt>
                <dd>{owner}</dd>
                <dt>Dependencies</dt>
                <dd>
                  {dependencies.length > 0 ? (
                    dependencies.join(", ")
                  ) : (
                    <em>none</em>
                  )}
                </dd>
              </dl>
              <div className="d-flex gap-2">
                <Link
                  className="btn btn-outline-primary btn-sm"
                  to={`/modules/details/${name}`}
                >
                  View
                </Link>
                <Link
                  className="btn btn-outline-primary btn-sm"
                  to={`/modules/edit/${name}`}
                >
                  Edit
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
