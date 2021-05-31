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
  const { getOwnedModules, getAllFeatured } = useContractContext();

  const [ownedModules, setOwnedModules] = useState([]);
  const [featuredModules, setFeaturedModules] = useState([]);

  const retrieveOwned = async () => {
    setOwnedModules([]);
    setOwnedModules(await getOwnedModules());
  };

  const retrieveFeatured = async () => {
    setFeaturedModules([]);
    const d = await getAllFeatured();
    setFeaturedModules(d);
  };

  const retrieve = async () => {
    await Promise.all([retrieveOwned(), retrieveFeatured()]);
  };

  const { isLoading, load } = useLoading(retrieve);

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mt-3">
      <Loading isLoading={isLoading}>
        {featuredModules.length > 0 ? (
          <>
            <h2>Featured Modules</h2>
            <div className="d-flex gap-2 flex-wrap">
              {featuredModules.map((module) => (
                <ModuleCard key={module.name} {...module} />
              ))}
            </div>
          </>
        ) : null}

        <h2 className="mt-3">Own Modules</h2>
        <div className="d-flex gap-2 flex-wrap">
          {ownedModules.length > 0 ? (
            ownedModules.map((module) => (
              <ModuleCard key={module.name} {...module} />
            ))
          ) : (
            <>
              You don't own any modules. Try to
              <Link to="/modules/edit">create</Link>one
            </>
          )}
        </div>
      </Loading>
    </div>
  );
};
