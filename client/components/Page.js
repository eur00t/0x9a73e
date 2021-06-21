import React, { useEffect } from "react";

import { Footer } from "../components/Footer";

export const Page = ({ children, noFooter = false }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <div className="container pb-3 pt-3">{children}</div>
      {!noFooter ? <Footer /> : null}
    </>
  );
};
