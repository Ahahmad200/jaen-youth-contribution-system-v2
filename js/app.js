const memberLoginBtn =
    document.getElementById("memberLoginBtn");

const adminLoginBtn =
    document.getElementById("adminLoginBtn");

const loginSection =
    document.getElementById("loginSection");

const loginTitle =
    document.getElementById("loginTitle");

const loginForm =
    document.getElementById("loginForm");

const loginMessage =
    document.getElementById("loginMessage");


let loginType = "member";


memberLoginBtn.addEventListener("click", () => {

    loginType = "member";

    loginTitle.textContent = "Member Login";

    loginSection.style.display = "block";

    loginMessage.textContent = "";

    loginSection.scrollIntoView({
        behavior: "smooth"
    });
});


adminLoginBtn.addEventListener("click", () => {

    loginType = "admin";

    loginTitle.textContent = "Administrator Login";

    loginSection.style.display = "block";

    loginMessage.textContent = "";

    loginSection.scrollIntoView({
        behavior: "smooth"
    });
});


loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    loginMessage.textContent =
        "Signing in...";


    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });


    if (error) {

        console.error(error);

        loginMessage.textContent =
            "Login failed: " + error.message;

        return;
    }


    const user = data.user;


    const {
        data: member,
        error: memberError
    } = await supabaseClient
        .from("members")
        .select(
            "id, member_id, full_name, role"
        )
        .eq("auth_user_id", user.id)
        .single();


    if (memberError || !member) {

        await supabaseClient.auth.signOut();

        loginMessage.textContent =
            "Your account is not linked to an organization member.";

        return;
    }


    if (
        loginType === "admin" &&
        member.role !== "admin"
    ) {

        await supabaseClient.auth.signOut();

        loginMessage.textContent =
            "This account does not have administrator access.";

        return;
    }


    if (
        loginType === "member" &&
        member.role === "admin"
    ) {

        await supabaseClient.auth.signOut();

        loginMessage.textContent =
            "Please use Administrator Login.";

        return;
    }


    loginMessage.textContent =
        "Login successful!";


    if (member.role === "admin") {

        window.location.href = "admin.html";

    } else {

        window.location.href = "member.html";

    }

});
// ==========================================
// JYBA PUBLIC MEMBERS DIRECTORY
// ==========================================

let publicMembers = [];

async function loadPublicMembers() {

    const memberCount =
        document.getElementById("publicMemberCount");

    const membersList =
        document.getElementById("publicMembersList");

    if (!memberCount || !membersList) {
        return;
    }

    membersList.innerHTML =
        "<p>Loading members...</p>";

    const { data: members, error } =
        await supabaseClient
            .from("members")
            .select("member_id, full_name")
            .eq("role", "member")
            .order("full_name", {
                ascending: true
            });

    if (error) {

        console.error(
            "Error loading public members:",
            error
        );

        memberCount.textContent = "0";

        membersList.innerHTML =
            "<p>Unable to load members.</p>";

        return;
    }

    publicMembers = members || [];

    memberCount.textContent =
        publicMembers.length;

    displayPublicMembers(publicMembers);
}


// Display members
function displayPublicMembers(members) {

    const membersList =
        document.getElementById("publicMembersList");

    if (!membersList) {
        return;
    }

    membersList.innerHTML = "";

    if (members.length === 0) {

        membersList.innerHTML =
            "<p>No members found.</p>";

        return;
    }

    members.forEach((member) => {

        const memberCard =
            document.createElement("div");

        memberCard.className =
            "member-card";

        memberCard.innerHTML = `
            <div class="member-avatar">👤</div>

            <h3>${member.full_name}</h3>

            <p>
                Member ID: ${member.member_id}
            </p>
        `;

        membersList.appendChild(memberCard);
    });
}


// Search members
document
    .getElementById("memberSearchInput")
    ?.addEventListener("input", function () {

        const searchText =
            this.value.toLowerCase().trim();

        const filteredMembers =
            publicMembers.filter((member) => {

                const name =
                    (member.full_name || "")
                    .toLowerCase();

                const memberId =
                    (member.member_id || "")
                    .toLowerCase();

                return (
                    name.includes(searchText) ||
                    memberId.includes(searchText)
                );
            });

        displayPublicMembers(filteredMembers);
    });


// Open members window
document
    .getElementById("viewAllMembersBtn")
    ?.addEventListener("click", function () {

        const modal =
            document.getElementById(
                "membersDirectoryModal"
            );

        if (modal) {
            modal.style.display = "block";
        }
    });


// Close members window
document
    .getElementById("closeMembersModal")
    ?.addEventListener("click", function () {

        const modal =
            document.getElementById(
                "membersDirectoryModal"
            );

        if (modal) {
            modal.style.display = "none";
        }
    });


// Close when clicking outside the window
document
    .getElementById("membersDirectoryModal")
    ?.addEventListener("click", function (event) {

        if (event.target === this) {
            this.style.display = "none";
        }
    });


// Load members when homepage opens
document.addEventListener(
    "DOMContentLoaded",
    function () {
        loadPublicMembers();
    }
);
// ==========================================
// JYBA BACK TO TOP BUTTON
// ==========================================

const backToTopBtn =
    document.getElementById("backToTopBtn");

window.addEventListener("scroll", function () {

    if (!backToTopBtn) {
        return;
    }

    if (window.scrollY > 400) {

        backToTopBtn.style.display = "flex";

    } else {

        backToTopBtn.style.display = "none";

    }

});

backToTopBtn?.addEventListener("click", function () {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});
