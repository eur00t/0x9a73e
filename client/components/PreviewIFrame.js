import React, { useState } from "react";
import classNames from "classnames";

import { useTokenRenderUrl } from "../utils/useTokenRenderUrl";
import { Loading } from "../components/Loading";

export const PreviewIFrame = ({
  tokenId,
  className = "",
  style = {},
  ...props
}) => {
  const tokenRenderUrl = useTokenRenderUrl(tokenId);

  const [isLoading, setIsLoading] = useState(true);

  const loadingDone = () => setIsLoading(false);

  return (
    <Loading
      isLoading={isLoading}
      className={classNames(className)}
      style={style}
    >
      <iframe
        onLoad={loadingDone}
        onError={loadingDone}
        src={tokenId ? tokenRenderUrl : null}
        style={{ border: 0, width: "100%", height: "100%" }}
        {...props}
      />
    </Loading>
  );
};
