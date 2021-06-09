import React from "react";
import styled from "styled-components";
import classNames from "classnames";
import { CSSTransition } from "react-transition-group";

const LoadingContainer = styled.div`
  display: flex;
  z-index: 999;
  opacity: 0;
  background: rgba(255, 255, 255, 0.5);

  &.loading-enter {
    opacity: 0;
  }

  &.loading-enter-active {
    opacity: 1;
    transition: opacity 150ms;
  }

  &.loading-enter-done {
    opacity: 1;
  }

  &.loading-exit {
    opacity: 1;
  }

  &.loading-exit-active {
    opacity: 0;
    transition: opacity 150ms;
  }

  &.loading-exit-done {
    opacity: 0;
  }
`;

const LoadingOverlay = ({ isLoading }) => {
  return (
    <CSSTransition
      in={isLoading}
      timeout={150}
      appear
      mountOnEnter
      unmountOnExit
      classNames="loading"
    >
      <LoadingContainer className="align-items-center justify-content-center position-absolute top-0 start-0 end-0 bottom-0">
        <div className="spinner-border text-primary"></div>
      </LoadingContainer>
    </CSSTransition>
  );
};

export const Loading = ({ isLoading, children, className = "", ...props }) => {
  return (
    <div className={classNames("position-relative", className)} {...props}>
      {children}
      <LoadingOverlay isLoading={isLoading} />
    </div>
  );
};
