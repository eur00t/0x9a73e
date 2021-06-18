export const compareModuleData = (m1, m2) => {
  if (m1.code !== m2.code) {
    return false;
  }

  if (m1.metadataJSON !== m2.metadataJSON) {
    return false;
  }

  if (m1.dependencies.length !== m2.dependencies.length) {
    return false;
  }

  if (m1.dependencies.some((dep1, i) => dep1 !== m2.dependencies[i])) {
    return false;
  }

  if (m1.isInvocable !== m2.isInvocable) {
    return false;
  }

  return true;
};
