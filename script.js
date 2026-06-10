(function loadDashboardScripts() {
  const scripts = ["data.js", "app-utils.js", "app-render.js", "app-detail.js"];

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Unable to load ${src}`));
      document.body.appendChild(script);
    });
  }

  scripts
    .reduce((chain, src) => chain.then(() => loadScript(src)), Promise.resolve())
    .catch((error) => {
      document.body.insertAdjacentHTML(
        "beforeend",
        `<div style="padding:16px;color:#b84f3d;font-family:sans-serif">Dashboard failed to load: ${error.message}</div>`
      );
    });
})();
