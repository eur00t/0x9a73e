export const ConditionalVisibility =
  (predicateHook) =>
  ({ children, on = true, ...props }) => {
    const conditionValue = predicateHook(props);

    return on
      ? conditionValue
        ? children
        : null
      : !conditionValue
      ? children
      : null;
  };
