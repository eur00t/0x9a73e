import React from "react";

export const InvocableBadge = ({
  invocations,
  invocationsNum,
  invocationsMax,
}) => {
  return (
    <span className="badge bg-primary">
      Invocable ({invocationsNum ? invocationsNum : invocations.length}/
      {invocationsMax})
    </span>
  );
};
