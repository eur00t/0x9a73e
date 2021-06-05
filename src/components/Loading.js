import React from "react";
import { Transition } from "react-transition-group";
import classNames from "classnames";

const LoadingOverlay = ({ isLoading }) => {
  const duration = 100;

  const style = {
    background: "rgba(255, 255, 255, 0.5)",
    transition: `opacity ${duration}ms ease-in-out`,
    opacity: 0,
    display: "flex",
    zIndex: 999,
  };

  const transitionStyles = {
    entering: { opacity: 1 },
    entered: { opacity: 1 },
    exiting: { opacity: 0 },
    exited: { opacity: 0, display: "none" },
  };

  return (
    <Transition in={isLoading} timeout={duration}>
      {(state) => (
        <div
          style={{ ...style, ...transitionStyles[state] }}
          className="align-items-center justify-content-center position-absolute top-0 start-0 end-0 bottom-0"
        >
          <div className="spinner-border text-primary"></div>
        </div>
      )}
    </Transition>
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
