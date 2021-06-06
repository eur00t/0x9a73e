`Applies basic styling to prepare the page for full-sized <canvas> element.`;
false;
[];
() => {
  const css = `html,
body {
  padding: 0;
  margin: 0;
}

canvas {
  display: block;
}
`;

  const style = document.createElement("style");
  style.appendChild(document.createTextNode(css));

  document.head.appendChild(style);
};
