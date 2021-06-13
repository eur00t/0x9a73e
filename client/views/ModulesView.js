import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import classNames from "classnames";

import PencilSquare from "../icons/pencil-square.svg";
import { useContractContext } from "../state";
import { useLoading } from "../components/useLoading";
import { Loading } from "../components/Loading";
import { withOwner, OnlyOwner } from "../components/withOwner";
import { ModuleBadges, hasBadges } from "../components/ModuleBadges";
import { InvocationCard } from "../components/InvocationCard";
import { Page } from "../components/Page";
import { MainNetworkWarning } from "../components/MainNetworkWarning";
import { useWeb3Auth } from "../components/Web3Auth";
import { usePagination } from "../components/usePagination";

const ModuleCard = withOwner((module) => {
  const { name, metadataJSON } = module;

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
            {(isOwner) => {
              return (
                <Link
                  className={classNames(
                    "btn btn-sm d-flex align-items-center ms-auto",
                    { invisible: !isOwner }
                  )}
                  to={`/modules/edit/${name}`}
                >
                  <PencilSquare />
                </Link>
              );
            }}
          </OnlyOwner>
        </div>
        {hasBadges(module) ? (
          <div className="d-flex mb-2">
            <ModuleBadges {...module} />
          </div>
        ) : null}
        <p className="card-text mb-3">{description}</p>
        <div className="d-flex mt-auto align-items-end">
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

  const { isReadOnly } = useWeb3Auth();

  const retrieveFeatured = async () => {
    setFeaturedModules([]);
    const result = await getAllFeatured();
    setFeaturedModules(result);
  };

  const { isLoading: isLoadingFeatured, load: loadFeatured } =
    useLoading(retrieveFeatured);

  useEffect(() => {
    loadFeatured();
  }, []);

  const {
    isLoading: isLoadingOwnedModules,
    result: ownedModules,
    pagination: ownedModulesPagination,
  } = usePagination({ getPage: getOwnedModules, pageSize: 10 });

  const {
    isLoading: isLoadingOwnedInvocations,
    result: ownedInvocations,
    pagination: ownedInvocationsPagination,
  } = usePagination({ getPage: getOwnedInvocations, pageSize: 10 });

  return (
    <Page>
      <MainNetworkWarning />
      <Loading isLoading={isLoadingFeatured}>
        {isLoadingFeatured || featuredModules.length > 0 ? (
          <>
            <h2>Featured</h2>
            <div className="d-flex flex-wrap mb-5">
              {featuredModules.map((module) => (
                <div key={module.name} className="mb-2 me-2 d-flex">
                  <ModuleCard {...module} />
                </div>
              ))}
            </div>
          </>
        ) : null}
      </Loading>

      <h2>Your Modules</h2>
      <div className="mt-3">{ownedModulesPagination}</div>
      <Loading isLoading={isLoadingOwnedModules}>
        <div className="d-flex flex-wrap items-align-top mb-5">
          {ownedModules.length > 0 ? (
            ownedModules.map((module) => (
              <div key={module.name} className="mb-2 me-2 d-flex">
                <ModuleCard {...module} />
              </div>
            ))
          ) : (
            <>
              You don't own any modules. Try to
              <Link to="/modules/create" className="ms-1 me-1">
                create
              </Link>
              one
            </>
          )}
        </div>
      </Loading>

      <h2 className="mt-5">Your Mints</h2>
      <div className="mt-3">{ownedInvocationsPagination}</div>
      <Loading isLoading={isLoadingOwnedInvocations}>
        <div className="d-flex flex-wrap">
          {ownedInvocations.length > 0 ? (
            ownedInvocations.map((invocation) => (
              <div key={invocation.tokenId} className="mb-2 me-2 d-flex">
                <InvocationCard {...invocation} />
              </div>
            ))
          ) : (
            <>You don't own any mints. Try to get some from mintable modules.</>
          )}
        </div>
      </Loading>
    </Page>
  );
};
