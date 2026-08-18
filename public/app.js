(() => {
  const productId = "preset-pack";
  const fileId = "preset-files";
  const accountButton = document.querySelector("#account-button");
  const microLoginButton = document.querySelector("#micro-login-button");
  const buyButton = document.querySelector("#buy-button");
  const downloadButton = document.querySelector("#download-button");
  const accountDownload = document.querySelector("#account-download");
  const accountEmail = document.querySelector("#account-email");
  const signOutButton = document.querySelector("#sign-out-button");
  const accountPanel = document.querySelector("#account-panel");
  const accountCopy = document.querySelector("#account-copy");
  const status = document.querySelector("#product-status");
  let currentUser = null;
  let ownsProduct = false;

  const setStatus = (message, error = false) => {
    status.textContent = message;
    status.classList.toggle("error", error);
  };

  const purchaseIsActive = (purchase) =>
    purchase.product_id === productId && ["paid", "active"].includes(purchase.status);

  async function refresh() {
    try {
      const current = await Micro.currentUser();
      currentUser = current.user || null;
      accountButton.textContent = currentUser ? "Your library" : "Sign in";
      microLoginButton.classList.toggle("hidden", Boolean(currentUser));
      accountPanel.classList.toggle("hidden", !currentUser);
      if (!currentUser) {
        ownsProduct = false;
        downloadButton.classList.add("hidden");
        accountDownload.classList.add("hidden");
        accountEmail.classList.add("hidden");
        buyButton.textContent = "Get the collection — €19";
        buyButton.disabled = false;
        return;
      }
      accountCopy.textContent = `${currentUser.email} · Purchases and downloads are verified by Micro.`;
      const ledger = await Micro.purchases();
      ownsProduct = (ledger.purchases || []).some(purchaseIsActive);
      downloadButton.classList.toggle("hidden", !ownsProduct);
      accountDownload.classList.toggle("hidden", !ownsProduct);
      accountEmail.classList.toggle("hidden", !ownsProduct);
      buyButton.textContent = ownsProduct ? "Purchased" : "Get the collection — €19";
      buyButton.disabled = ownsProduct;
      if (ownsProduct) setStatus("Quiet Light is in your library. Your download is ready.");
    } catch (error) {
      setStatus(error.message || "Could not load your library.", true);
    }
  }

  async function openAccount() {
    if (currentUser) {
      accountPanel.scrollIntoView({behavior: "smooth"});
      return;
    }
    await Micro.auth.open({mode: "sign-in"});
    await refresh();
  }

  async function purchase() {
    buyButton.disabled = true;
    setStatus("Preparing secure checkout…");
    try {
      await Micro.purchase(productId);
      await refresh();
    } catch (error) {
      setStatus(error.message || "Checkout could not be started.", true);
      buyButton.disabled = false;
    }
  }

  async function download() {
    setStatus("Checking your access…");
    try {
      await Micro.download(fileId);
    } catch (error) {
      setStatus("The download is not available yet. Please try again shortly.", true);
    }
  }

  accountButton.addEventListener("click", openAccount);
  microLoginButton.addEventListener("click", () => Micro.auth.loginWithMicro({returnTo: "/"}));
  buyButton.addEventListener("click", purchase);
  downloadButton.addEventListener("click", download);
  accountDownload.addEventListener("click", download);
  accountEmail.addEventListener("click", async () => {
    accountEmail.disabled = true;
    setStatus("Queuing a reminder to your verified account…");
    try {
      const response = await fetch("/email-library", {
        method: "POST",
        credentials: "same-origin",
        headers: {"content-type": "application/json"},
        body: "{}"
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || result.error || "Email could not be queued.");
      setStatus("Library reminder queued. Micro selected your verified account address.");
    } catch (error) {
      setStatus(error.message || "Email could not be queued.", true);
    } finally {
      accountEmail.disabled = false;
    }
  });
  signOutButton.addEventListener("click", async () => {
    await Micro.signOut();
    await refresh();
    setStatus("Signed out. Your purchase remains attached to your account.");
  });
  window.addEventListener("micro:auth-changed", refresh);
  window.addEventListener("pageshow", refresh);
})();
