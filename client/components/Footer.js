import React from "react";
import styled from "styled-components";

import { ReadOnlyWarning } from "../components/ReadOnlyWarning";

const FooterContainer = styled.div`
  & a {
    text-decoration: none;
    color: #495057;
  }
`;

export const Footer = ({}) => (
  <FooterContainer className="bg-light py-5 mt-5">
    <div className="container py-5">
      <div className="row">
        <div className="col-lg-3 mb-3">
          <a
            className="d-inline-flex align-items-center mb-2 link-dark text-decoration-none"
            href="/"
          >
            <span className="fs-5">λNFT</span>
          </a>
          <ul className="list-unstyled small text-muted">
            <li className="mb-2 text-truncate">
              Version {process.env.GIT_COMMIT}
            </li>
          </ul>
        </div>
        <div className="col-6 col-lg-2 offset-lg-1 mb-3">
          <h5>Links</h5>
          <ul className="list-unstyled">
            <li className="mb-2">
              <a target="_blank" href="https://twitter.com/lambdanft">
                Twitter
              </a>
            </li>
            <li className="mb-2">
              <a target="_blank" href="https://medium.com/@lambdanft">
                Blog
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <ReadOnlyWarning />
  </FooterContainer>
);
