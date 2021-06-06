export const EMPTY_MODULE_DATA = {
  name: "",
  dependencies: [],
  code: `() => {
  document.write("Hello, World!")
}
`,
  owner: "",
  metadataJSON: JSON.stringify({ description: "" }),
  isInvocable: false,
  isFinalized: false,
};
