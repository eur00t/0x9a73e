import React from "react";
import styled from "styled-components";
import { CSSTransition } from "react-transition-group";

const ModalContainer = styled.div`
  display: block;
`;

export const Modal = ({ show, onClose, children }) => {
  let header;
  let body;
  let footer;

  React.Children.forEach(children, (element) => {
    switch (element.type) {
      case Modal.Header:
        header = element;
        break;
      case Modal.Body:
        body = element;
        break;
      case Modal.Footer:
        footer = element;
        break;
    }
  });

  return (
    <>
      <CSSTransition
        in={show}
        timeout={150}
        appear
        mountOnEnter
        unmountOnExit
        classNames={{
          enterActive: "show",
          enterDone: "show",
        }}
      >
        <ModalContainer className="modal fade">
          <div className="modal-dialog">
            <div className="modal-content">
              {React.cloneElement(header, { onClose })}
              {React.cloneElement(body, { onClose })}
              {React.cloneElement(footer, { onClose })}
            </div>
          </div>
        </ModalContainer>
      </CSSTransition>
      <CSSTransition
        in={show}
        timeout={150}
        appear
        mountOnEnter
        unmountOnExit
        classNames={{
          enterActive: "show",
          enterDone: "show",
        }}
      >
        <div className="modal-backdrop fade"></div>
      </CSSTransition>
    </>
  );
};

Modal.Header = ({ children, onClose }) => {
  return (
    <div className="modal-header">
      <h5 className="modal-title">{children}</h5>
      <button type="button" className="btn-close" onClick={onClose}></button>
    </div>
  );
};

Modal.Body = ({ children, onClose }) => {
  const content =
    typeof children === "function" ? children({ onClose }) : children;

  return <div className="modal-body">{content}</div>;
};

Modal.Footer = ({ children, onClose }) => {
  const content =
    typeof children === "function" ? children({ onClose }) : children;

  return <div className="modal-footer">{content}</div>;
};