import React from "react";
import pluralize from "pluralize";

export const InvocableBadge = ({
  invocations,
  invocationsNum,
  invocationsMax,
}) => {
  const invocationsLeftNum =
    invocationsMax -
    (invocationsNum ? parseInt(invocationsNum, 10) : invocations.length);

  return (
    <>
      {invocationsLeftNum > 0 ? (
        <span className="badge bg-secondary">
          {pluralize(
            "mint",
            invocationsMax -
              (invocationsNum
                ? parseInt(invocationsNum, 10)
                : invocations.length),
            true
          )}
          {" left"}
        </span>
      ) : (
        <span className="badge bg-success">all minted ({invocationsMax})</span>
      )}
    </>
  );
};
