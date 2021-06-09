`Compute a HSL color based on a given seed.`;
false;
["get-num-from-seed"];
(get256Num) => {
  return (seed) => {
    const [h, s, l] = [
      get256Num(seed, 0, 2, 360),
      get256Num(seed, 1, 2, 100),
      get256Num(seed, 2, 2, 100),
    ];

    return [h, s, l];
  };
};
