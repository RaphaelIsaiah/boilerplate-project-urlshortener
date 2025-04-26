document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  // Form submission handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const urlInput = form.url;

    // Visual feedback during submission
    button.disabled = true;
    button.classList.add("opacity-75", "cursor-not-allowed");
    button.innerHTML = "Shortening...";

    // API Request
    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.value }),
      });

      // Response handling
      const data = await response.json();

      if (data.error) {
        showAlert(`Error: ${data.error}`, "error");
      } else {
        const shortUrl = `${window.location.href}api/shorturl/${data.short_url}`;
        const resultContainer = document.getElementById("result-container");
        const outputField = document.getElementById("short-url-output");

        resultContainer.classList.remove("hidden");
        outputField.value = shortUrl;

        // Auto-copy to clipboard
        await navigator.clipboard.writeText(shortUrl);
        showAlert("Copied to clipboard!", "info");
      }
    } catch (error) {
      showAlert("Network error. Please try again.", "error");
    } finally {
      // Reset button
      button.disabled = false;
      button.classList.remove("opacity-75", "cursor-not-allowed");
      button.innerHTML = "Shorten URL";
    }
  });

  // Click handler for copy button
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("copy-btn")) {
      e.target.textContent = "Copied!";
      setTimeout(() => {
        e.target.textContent = "Copy";
      }, 2000);
      const outputField = document.getElementById("short-url-output");
      if (!outputField) return;

      navigator.clipboard
        .writeText(outputField.value)
        .then(() => {
          showAlert("Copied to clipboard!", "info");
        })
        .catch((err) => {
          showAlert("Failed to copy!", "error");
        });
    }
  });

  // Alert function
  function showAlert(message, type = "info") {
    const alertBox = document.createElement("div");
    alertBox.className = `fixed top-4 right-4 px-6 py-3 rounded-md shadow-lg text-white ${
      type === "error"
        ? "bg-red-500"
        : type === "success"
        ? "bg-green-500"
        : "bg-blue-500"
    } max-w-xs sm:max-w-md w-[calc(100%-2rem)] mx-4 sm:mx-0 break-words`;
    alertBox.textContent = message;
    document.body.appendChild(alertBox);

    setTimeout(() => {
      alertBox.classList.add("opacity-0", "transition-opacity", "duration-500");
      setTimeout(() => alertBox.remove(), 500);
    }, 1000);
  }
});
