export const DEFAULT_MODULE_DATA = {
  name: "",
  dependencies: ["get-seed-color-hsl"],
  code: `(getHsl) => {
  return (seed) => {
    if (seed === "0x00") {
      seed = "0x992135";
    }

    const [h, s, l] = getHsl(seed);

    document.write(\`
      <span style="color: hsl(\${h}, \${s}%, 50%)">
        Hello, World!
      </span>
    \`);
  }
}
`,
  owner: "",
  metadataJSON: JSON.stringify({ description: "" }),
  isInvocable: true,
  isFinalized: false,
  invocations: [],
};
