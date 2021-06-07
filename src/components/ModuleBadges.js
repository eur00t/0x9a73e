import React from "react";
import pluralize from "pluralize";

export const hasBadges = ({ isFinalized, isInvocable }) => {
  if (!isFinalized) {
    return true;
  }

  if (isFinalized && isInvocable) {
    return true;
  }

  return false;
};

export const ModuleBadges = ({
  invocations,
  invocationsNum,
  invocationsMax,
  isFinalized,
  isInvocable,
}) => {
  const invocationsLeftNum =
    invocationsMax -
    (invocationsNum ? parseInt(invocationsNum, 10) : invocations.length);

  return (
    <>
      {!isFinalized ? (
        <span className="badge bg-warning">not final</span>
      ) : null}

      {isFinalized && isInvocable && invocationsLeftNum > 0 ? (
        <span className="badge bg-success">
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
      ) : null}

      {isFinalized && isInvocable && invocationsLeftNum === 0 ? (
        <span className="badge bg-success">all minted ({invocationsMax})</span>
      ) : null}
    </>
  );
};
