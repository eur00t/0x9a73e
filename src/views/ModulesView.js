import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useContractContext } from "../state";
import { useLoading } from "../components/useLoading";
import { Loading } from "../components/Loading";
import { withOwner, OnlyOwner } from "../components/withOwner";

const ModuleCard = withOwner((module) => {
  const { name, owner, dependencies } = module;

  return (
    <div key={name} className="card" style={{ width: "20rem" }}>
      <div className="card-body">
        <h5 className="card-title">{name}</h5>
        <dl>
          <dt>Owner</dt>
          <dd>{owner}</dd>
          <dt>Dependencies</dt>
          <dd>
            {dependencies.length > 0 ? dependencies.join(", ") : <em>none</em>}
          </dd>
        </dl>
        <div className="d-flex gap-2">
          <Link
            className="btn btn-outline-primary btn-sm"
            to={`/modules/details/${name}`}
          >
            View
          </Link>
          <OnlyOwner>
            <Link
              className="btn btn-outline-primary btn-sm"
              to={`/modules/edit/${name}`}
            >
              Edit
            </Link>
          </OnlyOwner>
        </div>
      </div>
    </div>
  );
}, "ModuleCard");

export const ModulesView = () => {
  const { getModules } = useContractContext();

  const [modules, setModules] = useState([]);

  const retrieve = async () => {
    setModules([]);
    setModules(await getModules());
  };

  const { isLoading, load } = useLoading(retrieve);

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mt-3">
      <Loading isLoading={isLoading}>
        <div className="d-flex gap-2 flex-wrap">
          {modules.map((module) => (
            <ModuleCard key={module.name} {...module} />
          ))}
        </div>
      </Loading>
    </div>
  );
};
