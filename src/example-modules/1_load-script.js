[];
() => {
  return (scriptSrc) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = scriptSrc;
      script.onload = () => {
        resolve();
      };
      script.onerror = () => {
        reject();
      };
      document.body.appendChild(script);
    });
  };
};
