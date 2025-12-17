import { updateGlobalStatCards } from "./firebaseService.js";

// ============================================
// 1. FORM SUBMISSION HANDLER
// ============================================
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("manual-input-form");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const formData = new FormData(form);
        const csrfToken = document.querySelector(
            'meta[name="csrf-token"]'
        )?.content;

        try {
            const response = await fetch("/submit-manual-input", {
                method: "POST",
                body: formData,
                headers: {
                    "X-CSRF-TOKEN": csrfToken,
                    Accept: "application/json",
                },
            });

            const data = await response.json();
            const messageDiv = document.getElementById("response-message");

            if (response.ok) {
                // Success message
                messageDiv.innerHTML = `
                    <div class="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                        ✓ ${data.message || "Data berhasil disimpan!"}
                    </div>
                `;
                form.reset();

                // Emit event for other components
                window.dispatchEvent(
                    new CustomEvent("data-sampah-updated", { detail: data })
                );

                // Update global stats dengan delay untuk memastikan database sudah ter-update
                setTimeout(() => {
                    updateGlobalStatCards();
                }, 500);

                // Clear message after 3 seconds
                setTimeout(() => {
                    messageDiv.innerHTML = "";
                }, 3000);
            } else {
                // Error message
                messageDiv.innerHTML = `
                    <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        ✗ ${
                            data.message ||
                            "Terjadi kesalahan saat menyimpan data."
                        }
                    </div>
                `;
            }
        } catch (error) {
            console.error("Error:", error);
            const messageDiv = document.getElementById("response-message");
            messageDiv.innerHTML = `
                <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    ✗ Terjadi kesalahan: ${error.message}
                </div>
            `;
        }
    });

    // Update date on page load
    updateCurrentDate("current-date");
});

// ============================================
// 2. UPDATE CURRENT DATE
// ============================================
function updateCurrentDate(elementId) {
    const dateElement = document.getElementById(elementId);
    if (dateElement) {
        const today = new Date();
        const options = {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        };
        dateElement.textContent = today.toLocaleDateString("id-ID", options);
    }
}

// ============================================
// 3. LISTEN TO MQTT DATA UPDATE EVENTS
// ============================================
window.addEventListener("data-sampah-updated", function (event) {
    updateGlobalStatCards();
});

// Export functions if needed
export { updateCurrentDate };
