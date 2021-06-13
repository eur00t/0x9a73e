export const mapN = (n, func) => {
  const res = [];

  for (let i = 0; i < n; i += 1) {
    res.push(func(i));
  }

  return res;
};
