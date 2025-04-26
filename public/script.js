// public/script.js
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
        showAlert(
          `Short URL: ${window.location.href}api/shorturl/${data.short_url}`,
          "success"
        );
        // Copy to clipboard functionality
        await navigator.clipboard.writeText(
          `${window.location.href}api/shorturl/${data.short_url}`
        );
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

  // Custom alert function
  function showAlert(message, type = "info") {
    const alertBox = document.createElement("div");
    alertBox.className = `fixed top-4 right-4 px-6 py-3 rounded-md shadow-lg text-white ${
      type === "error"
        ? "bg-red-500"
        : type === "success"
        ? "bg-green-500"
        : "bg-blue-500"
    }`;
    alertBox.textContent = message;
    document.body.appendChild(alertBox);

    setTimeout(() => {
      alertBox.classList.add("opacity-0", "transition-opacity", "duration-500");
      setTimeout(() => alertBox.remove(), 500);
    }, 5000);
  }
});
