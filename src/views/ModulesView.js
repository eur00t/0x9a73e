import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import PencilSquare from "../icons/pencil-square.svg";

import { useContractContext } from "../state";
import { useLoading } from "../components/useLoading";
import { Loading } from "../components/Loading";
import { withOwner, OnlyOwner } from "../components/withOwner";
import { InvocableBadge } from "../components/InvocableBadge";
import { InvocationCard } from "../components/InvocationCard";
import { Page } from "../components/Page";

const ModuleCard = withOwner((module) => {
  const { name, isInvocable, metadataJSON } = module;

  const { description } = useMemo(
    () => JSON.parse(metadataJSON),
    [metadataJSON]
  );

  return (
    <div className="card" style={{ width: "20rem" }}>
      <div className="card-body d-flex flex-column">
        <div className="card-title font-monospace fw-bold d-flex align-items-center">
          {name}
          <OnlyOwner>
            <Link
              className="btn btn-sm d-flex align-items-center ms-auto"
              to={`/modules/edit/${name}`}
            >
              <PencilSquare />
            </Link>
          </OnlyOwner>
        </div>
        <p className="card-text mb-3">{description}</p>
        {isInvocable ? (
          <div className="mb-3">
            <InvocableBadge {...module} />
          </div>
        ) : null}
        <div className="d-flex gap-2 mt-auto">
          <Link
            className="btn btn-outline-primary btn-sm"
            to={`/modules/details/${name}`}
          >
            Open
          </Link>
        </div>
      </div>
    </div>
  );
}, "ModuleCard");

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
    <Page>
      <Loading isLoading={isLoading}>
        {featuredModules.length > 0 ? (
          <>
            <h2>Featured</h2>
            <div className="d-flex gap-2 flex-wrap mb-5">
              {featuredModules.map((module) => (
                <ModuleCard key={module.name} {...module} />
              ))}
            </div>
          </>
        ) : null}

        <h2>Your Modules</h2>
        <div className="d-flex gap-2 flex-wrap items-align-top mb-5">
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

        <h2 className="mt-5">Your Mints</h2>
        <div className="d-flex gap-2 flex-wrap">
          {ownedInvocations.length > 0 ? (
            ownedInvocations.map((invocation) => (
              <InvocationCard key={invocation.tokenId} {...invocation} />
            ))
          ) : (
            <>You don't own any mints. Try to get some from mintable modules.</>
          )}
        </div>
      </Loading>
    </Page>
  );
};
