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
  invocationsNum,
  invocationsMax,
  isFinalized,
  isInvocable,
}) => {
  const invocationsLeftNum = invocationsMax - invocationsNum;

  return (
    <>
      {!isFinalized ? (
        <span className="badge bg-warning">not final</span>
      ) : null}

      {isFinalized && isInvocable && invocationsLeftNum > 0 ? (
        <span className="badge bg-success">
          {pluralize("mint", invocationsLeftNum, true)}
          {" left"}
        </span>
      ) : null}

      {isFinalized && isInvocable && invocationsLeftNum === 0 ? (
        <span className="badge bg-success">all minted ({invocationsMax})</span>
      ) : null}
    </>
  );
};
