`Extract an int number from a given seed.`;
[];
() => {
  const get256Num = (seed, pos, digits, div) => {
    const str = seed.slice(2 + pos * digits, 2 + pos * digits + 2);

    return parseInt(str, 16) % div;
  };

  return get256Num;
};
