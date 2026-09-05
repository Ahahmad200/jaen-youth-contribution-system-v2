// ==========================================
// ADMIN DASHBOARD NAVIGATION
// ==========================================

function showAdminSection(sectionId) {
    const sections = document.querySelectorAll(".admin-section");

    sections.forEach((section) => {
        section.style.display = "none";
    });

    const selectedSection = document.getElementById(sectionId);

    if (selectedSection) {
        selectedSection.style.display = "block";
    }

    const buttons = document.querySelectorAll(".admin-nav button");

    buttons.forEach((button) => {
        button.classList.remove("active");
    });

    const activeButton = document.querySelector(
        `.admin-nav button[onclick="showAdminSection('${sectionId}')"]`
    );

    if (activeButton) {
        activeButton.classList.add("active");
    }
}

// Show Overview when the dashboard opens
document.addEventListener("DOMContentLoaded", () => {
    showAdminSection("overviewSection");
});
