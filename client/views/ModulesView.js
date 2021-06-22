import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import classNames from "classnames";
import styled from "styled-components";

import PencilSquare from "../icons/pencil-square.svg";
import { useContractContext } from "../state";
import { useLoading } from "../components/useLoading";
import { Loading } from "../components/Loading";
import { withOwner, OnlyOwner } from "../components/withOwner";
import { ModuleBadges, hasBadges } from "../components/ModuleBadges";
import { InvocationCard } from "../components/InvocationCard";
import { Page } from "../components/Page";
import { MainNetworkWarning } from "../components/MainNetworkWarning";
import { usePagination } from "../components/usePagination";
import { fetchServerMethod } from "../utils/fetchServerMethod";
import { OnlyWriteInjector } from "../components/OnlyWriteInjector";
import { PreviewIFrame } from "../components/PreviewIFrame";
import { useNetwork } from "../utils/networks";
import { ReadOnlyWarning } from "../components/ReadOnlyWarning";

import JSLogo from "../icons/javascript-logo.svg";
import Diagram from "../icons/diagram.svg";
import Images from "../icons/images.svg";
import ShieldLock from "../icons/shield-lock.svg";
import BoxArrowUpRight from "../icons/box-arrow-up-right.svg";

const ModuleCard = withOwner(({ noRender = false, ...module }) => {
  const { name, metadataJSON, tokenId } = module;

  const { description } = useMemo(
    () => JSON.parse(metadataJSON),
    [metadataJSON]
  );

  return (
    <div className="card" style={{ width: "20rem" }}>
      {!noRender ? (
        <PreviewIFrame
          className="card-img-top"
          tokenId={tokenId}
          style={{ width: "100%", height: "20rem" }}
        />
      ) : null}
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

const HeroFeatureBlock = styled.div`
  width: 180px;

  margin-left: 1.5rem;
  margin-right: 1.5rem;
  margin-bottom: 3rem;

  & > div {
    width: 70px;
    height: 70px;

    margin: 0 auto;

    display: flex;
    align-items: center;
    justify-content: center;
  }

  & > div > svg {
    height: 60px;
  }
`;

export const ModulesView = () => {
  const { getAllFeatured, getOwnedModules, getOwnedInvocations } =
    useContractContext();

  const [featuredModules, setFeaturedModules] = useState([]);

  const { networkId } = useNetwork();

  const retrieveFeatured = async () => {
    setFeaturedModules([]);
    const featured = await fetchServerMethod(
      `/protected/network/${networkId}/featured`,
      "GET"
    );
    const result = await getAllFeatured(featured);
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

  const featuredBlockRef = useRef(null);

  return (
    <Page>
      <div>
        <div className="ms-auto me-auto" style={{ marginBottom: "6rem" }}>
          <div className="mt-5 mb-3 text-center display-3">
            Fully On-Chain <span className="text-nowrap">Generative NFTs</span>
          </div>
          <div className="d-flex flex-wrap justify-content-center pt-5">
            <HeroFeatureBlock>
              <div>
                <JSLogo className="ms-auto d-block me-auto pb-3" />
              </div>
              <h6 className="text-center pt-2 pb-1">Familiar Technology</h6>
              <p>Deploy JavaScript lambdas directly on the blockchain.</p>
            </HeroFeatureBlock>

            <HeroFeatureBlock>
              <div>
                <Diagram className="ms-auto d-block me-auto pb-3" />
              </div>
              <h6 className="text-center pt-2 pb-1">Code Reuse</h6>
              <p>
                Leverage dependency mechanism to use less blockchain storage
                space.
              </p>
            </HeroFeatureBlock>

            <HeroFeatureBlock>
              <div>
                <Images className="ms-auto d-block me-auto pb-3" />
              </div>
              <h6 className="text-center pt-2 pb-1">f(x) == NFT</h6>
              <p>
                Transform JS code into mintable{" "}
                <span className="text-nowrap">ERC-721</span> tokens.
              </p>
            </HeroFeatureBlock>

            <HeroFeatureBlock>
              <div>
                <ShieldLock className="ms-auto d-block me-auto pb-3" />
              </div>
              <h6 className="text-center pt-2 pb-1">Standalone</h6>
              <p>
                Get full HTML page from the contract. Everything is on the
                blockchain.
              </p>
            </HeroFeatureBlock>
          </div>
          <div className="d-flex flex-wrap justify-content-center mt-5">
            {featuredModules.length > 0 ? (
              <div
                className="btn btn-lg btn-primary mt-2"
                onClick={() =>
                  window.scrollTo({
                    left: 0,
                    top: featuredBlockRef.current.offsetParent.offsetTop - 15,
                    behavior: "smooth",
                  })
                }
              >
                Browse Featured
              </div>
            ) : null}
            <a
              href="https://lambdanft.medium.com/"
              target="_blank"
              className="btn btn-lg btn-outline-primary ms-2 mt-2"
            >
              Read Blog{" "}
              <BoxArrowUpRight
                className="ms-1"
                style={{ position: "relative", top: "-3px" }}
              />
            </a>
          </div>
        </div>
        <MainNetworkWarning />
        <div>
          <Loading isLoading={isLoadingFeatured}>
            {isLoadingFeatured || featuredModules.length > 0 ? (
              <div>
                <h2 ref={featuredBlockRef} className="mt-3 mb-3">
                  Featured
                </h2>
                <div className="d-flex overflow-auto mb-5 me-n2">
                  {featuredModules.map((module) => (
                    <div key={module.name} className="mb-2 me-2 d-flex">
                      <ModuleCard {...module} />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </Loading>
        </div>
      </div>

      <OnlyWriteInjector>
        <h2>Your λ's</h2>
        <div className="mb-3">{ownedModulesPagination}</div>
        <Loading isLoading={isLoadingOwnedModules}>
          <div className="d-flex flex-wrap items-align-top mb-5">
            {ownedModules.length > 0 ? (
              ownedModules.map((module) => (
                <div key={module.name} className="mb-2 me-2 d-flex">
                  <ModuleCard noRender {...module} />
                </div>
              ))
            ) : (
              <>
                You don't own any lambdas. You can
                <Link to="/modules/create" className="ms-1 me-1">
                  create
                </Link>
                one
              </>
            )}
          </div>
        </Loading>
      </OnlyWriteInjector>

      <OnlyWriteInjector>
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
              <>
                You don't own any mints. Try to get some from mintable lambdas.
              </>
            )}
          </div>
        </Loading>
      </OnlyWriteInjector>

      <ReadOnlyWarning />
    </Page>
  );
};
