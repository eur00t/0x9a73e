`Invocable module which displays a given seed for each invocation.`;
[];
() => {
  const get256Num = (seed, pos, div) => {
    const str = seed.slice(2 + pos * 2, 2 + pos * 2 + 2);

    return parseInt(str, 16) % div;
  };

  return (seed) => {
    let seedText = seed;
    if (seed === "0") {
      seed = "0x992135";
      seedText = "<seed value will be shown here>";
    }

    const styleEl = document.createElement("style");
    document.head.appendChild(styleEl);
    const styleSheet = styleEl.sheet;

    const [h, s, l] = [
      get256Num(seed, 0, 360),
      get256Num(seed, 1, 100),
      get256Num(seed, 2, 100),
    ];

    styleSheet.insertRule(`
      html, body {
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
    `);

    styleSheet.insertRule(`
      body {
        display: flex;
        align-items: center;
        justify-content: center;

        background: hsl(${h}, ${s}%, ${l}%);
        border: 10px solid hsl(${h}, ${s}%, 20%);
        font-family: monospace;
        font-weight: bold;
        color: ${l > 50 ? "black" : "white"};
      }
    `);

    styleSheet.insertRule(`
      body > div {
        max-width: 80%;
        text-overflow: ellipsis;
        overflow: hidden;
      }
    `);

    const div = document.createElement("div");

    div.innerText = seedText;

    document.body.appendChild(div);
  };
};
