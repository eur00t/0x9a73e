export const makeFullScreen = () => {
  document.body.style.height = "100%";
  document.documentElement.style.height = "100%";
  document.getElementById("app").style.height = "100%";
};

export const resetFullScreen = () => {
  document.body.style.height = "auto";
  document.documentElement.style.height = "auto";
  document.getElementById("app").style.height = "auto";
};
