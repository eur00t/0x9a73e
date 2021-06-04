import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useContractContext } from "../state";
import { useLoading } from "../components/useLoading";
import { Loading } from "../components/Loading";
import { withOwner, OnlyOwner } from "../components/withOwner";
import { InvocableBadge } from "../components/InvocableBadge";

const ModuleCard = withOwner((module) => {
  const { name, owner, dependencies, isInvocable } = module;

  return (
    <div className="card" style={{ width: "20rem" }}>
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
        {isInvocable ? (
          <div className="mt-3">
            <InvocableBadge {...module} />
          </div>
        ) : null}
      </div>
    </div>
  );
}, "ModuleCard");

const InvocationListCard = ({
  tokenId,
  seed,
  module: { name: moduleName },
}) => {
  return (
    <div className="card" style={{ width: "20rem" }}>
      <div className="card-body">
        <h5 className="card-title">{moduleName}</h5>
        <dl>
          <dt>Seed</dt>
          <dd>{seed}</dd>
        </dl>
        <div className="d-flex gap-2">
          <Link
            className="btn btn-outline-primary btn-sm"
            to={`/modules/invocation/${tokenId}`}
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
};

export const ModulesView = () => {
  const { getAllFeatured, getOwnedModules, getOwnedInvocations } =
    useContractContext();

  const [featuredModules, setFeaturedModules] = useState([]);
  const [ownedModules, setOwnedModules] = useState([]);
  const [ownedInvocations, setOwnedInvocations] = useState([]);

  const retrieveFeatured = async () => {
    setFeaturedModules([]);
    const result = await getAllFeatured();
    setFeaturedModules(result);
  };

  const retrieveOwnedModules = async () => {
    setOwnedModules([]);
    const result = await getOwnedModules();
    setOwnedModules(result);
  };

  const retrieveOwnedInvocations = async () => {
    setOwnedInvocations([]);
    const result = await getOwnedInvocations();
    setOwnedInvocations(result);
  };

  const retrieve = async () => {
    await Promise.all([
      retrieveFeatured(),
      retrieveOwnedModules(),
      retrieveOwnedInvocations(),
    ]);
  };

  const { isLoading, load } = useLoading(retrieve);

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mt-3 mb-3">
      <Loading isLoading={isLoading}>
        {featuredModules.length > 0 ? (
          <>
            <h2>Featured</h2>
            <div className="d-flex gap-2 flex-wrap">
              {featuredModules.map((module) => (
                <ModuleCard key={module.name} {...module} />
              ))}
            </div>
          </>
        ) : null}

        <h2 className="mt-5">Your Modules</h2>
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

        <h2 className="mt-5">Your Invocations</h2>
        <div className="d-flex gap-2 flex-wrap">
          {ownedInvocations.length > 0 ? (
            ownedInvocations.map((invocation) => (
              <InvocationListCard key={invocation.tokenId} {...invocation} />
            ))
          ) : (
            <>
              You don't own any invocations. Try to mint some from invocable
              modules.
            </>
          )}
        </div>
      </Loading>
    </div>
  );
};
