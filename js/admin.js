// ==========================================
// LOAD MEMBERS
// ==========================================

async function loadMembers() {

    const { data: members, error } =
        await supabaseClient
            .from("members")
            .select("id, member_id, full_name")
            .eq("role", "member")
            .order("full_name");

    if (error) {
        console.error("Error loading members:", error);
        return;
    }

    const select =
        document.getElementById("memberSelect");

    select.innerHTML =
        '<option value="">Select a member</option>';

    members.forEach(member => {

        const option =
            document.createElement("option");

        option.value = member.id;

        option.textContent =
            `${member.full_name} (${member.member_id})`;

        select.appendChild(option);
    });
}


// ==========================================
// LOAD ADMIN DASHBOARD
// ==========================================

async function loadAdminDashboard() {

    const {
        data: { user },
        error: authError
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
        window.location.href = "index.html";
        return;
    }

    // Get administrator profile
    const { data: admin, error: adminError } =
        await supabaseClient
            .from("members")
            .select("id, full_name, member_id, role")
            .eq("auth_user_id", user.id)
            .single();

    if (
        adminError ||
        !admin ||
        admin.role !== "admin"
    ) {
        await supabaseClient.auth.signOut();
        window.location.href = "index.html";
        return;
    }

    document.getElementById("adminName").textContent =
        admin.full_name;

    document.getElementById("adminMemberId").textContent =
        admin.member_id;


    // Count members
    const {
        count: memberCount,
        error: memberError
    } = await supabaseClient
        .from("members")
        .select("id", {
            count: "exact",
            head: true
        });

    if (!memberError) {

        document.getElementById("totalMembers").textContent =
            memberCount ?? 0;
    }


    // Get contribution records
    const {
        data: contributions,
        error: contributionError
    } = await supabaseClient
        .from("contributions")
        .select("amount");

    if (!contributionError) {

        document.getElementById("totalRecords").textContent =
            contributions.length;

        const total = contributions.reduce(
            (sum, record) =>
                sum + Number(record.amount || 0),
            0
        );

        document.getElementById("totalContributions").textContent =
            total.toLocaleString();
    }
}


// ==========================================
// LOGOUT
// ==========================================

document
    .getElementById("logoutBtn")
    .addEventListener("click", async () => {

        await supabaseClient.auth.signOut();

        window.location.href = "index.html";
    });


// ==========================================
// ADD NEW MEMBER
// ==========================================

document
    .getElementById("addMemberForm")
    .addEventListener("submit", async (event) => {

        event.preventDefault();

        const memberId =
            document.getElementById("newMemberId").value.trim();

        const fullName =
            document.getElementById("newMemberName").value.trim();

        const email =
    document.getElementById("newMemberEmail").value.trim();

const password =
    document.getElementById("newMemberPassword").value;

const phone =
    document.getElementById("newMemberPhone").value.trim();

        const message =
            document.getElementById("memberMessage");

        message.textContent =
            "Adding member...";


        // Check login
        const {
            data: { user },
            error: authError
        } = await supabaseClient.auth.getUser();

        if (authError || !user) {

            message.textContent =
                "Your session has expired. Please log in again.";

            return;
        }


        // Verify administrator
        const {
            data: admin,
            error: adminError
        } = await supabaseClient
            .from("members")
            .select("id, role")
            .eq("auth_user_id", user.id)
            .single();

        if (
            adminError ||
            !admin ||
            admin.role !== "admin"
        ) {

            message.textContent =
                "Administrator permission required.";

            return;
        }


        // Add member
        const {
            error
        } = await supabaseClient
            .from("members")
            .insert({
                member_id: memberId,
                full_name: fullName,
                email: email || null,
                phone: phone || null,
                role: "member"
            });

        if (error) {

            console.error(
                "Add member error:",
                error
            );

            message.textContent =
                "Error: " + error.message;

            return;
        }


        message.textContent =
            "Member added successfully!";


        // Clear form
        document
            .getElementById("addMemberForm")
            .reset();


        // Refresh dashboard
        loadMembers();
        loadAdminDashboard();
    });


// ==========================================
// RECORD CONTRIBUTION
// ==========================================

document
    .getElementById("contributionForm")
    .addEventListener("submit", async (event) => {

        event.preventDefault();

        const memberId =
            document.getElementById("memberSelect").value;

        const contributionDate =
            document.getElementById("contributionDate").value;

        const amount =
            Number(
                document.getElementById("amount").value
            );

        const paymentDate =
            document.getElementById("paymentDate").value;

        const notes =
            document.getElementById("notes").value.trim();

        const message =
            document.getElementById("contributionMessage");

        message.textContent =
            "Recording contribution...";


        // Check login
        const {
            data: { user },
            error: authError
        } = await supabaseClient.auth.getUser();

        if (authError || !user) {

            message.textContent =
                "Your session has expired. Please log in again.";

            return;
        }


        // Verify administrator
        const {
            data: admin,
            error: adminError
        } = await supabaseClient
            .from("members")
            .select("id, role")
            .eq("auth_user_id", user.id)
            .single();

        if (
            adminError ||
            !admin ||
            admin.role !== "admin"
        ) {

            message.textContent =
                "Administrator permission required.";

            return;
        }


        // Validate member
        if (!memberId) {

            message.textContent =
                "Please select a member.";

            return;
        }


        // Validate amount
        if (!amount || amount <= 0) {

            message.textContent =
                "Please enter a valid contribution amount.";

            return;
        }


        // Save contribution
        const {
            error
        } = await supabaseClient
            .from("contributions")
            .insert({
                member_id: memberId,
                contribution_month: contributionDate,
                amount: amount,
                payment_date: paymentDate,
                recorded_by: admin.id,
                notes: notes || null
            });

        if (error) {

            console.error(
                "Contribution error:",
                error
            );

            message.textContent =
                "Error: " + error.message;

            return;
        }


        message.textContent =
            "Contribution recorded successfully!";


        // Clear form
        document
            .getElementById("contributionForm")
            .reset();


        // Refresh dashboard and records
        loadAdminDashboard();
        loadContributionRecords();
    });


// ==========================================
// LOAD ALL CONTRIBUTION RECORDS
// ==========================================

async function loadContributionRecords() {

    const list =
        document.getElementById("adminContributionList");

    // Get contributions
    const {
        data: contributions,
        error: contributionError
    } = await supabaseClient
        .from("contributions")
        .select(
            "id, member_id, contribution_month, amount, payment_date, notes"
        )
        .order("contribution_month", {
            ascending: false
        });

    if (contributionError) {

        console.error(
            "Error loading contributions:",
            contributionError
        );

        list.innerHTML = `
            <tr>
                <td colspan="7">
                    Unable to load contribution records.
                </td>
            </tr>
        `;

        return;
    }


    // Get members
    const {
        data: members,
        error: memberError
    } = await supabaseClient
        .from("members")
        .select("id, member_id, full_name");


    if (memberError) {

        console.error(
            "Error loading members:",
            memberError
        );

        list.innerHTML = `
            <tr>
                <td colspan="7">
                    Unable to load member information.
                </td>
            </tr>
        `;

        return;
    }


    // Create member lookup
    const memberMap = {};

    members.forEach(member => {

        memberMap[member.id] = member;
    });


    list.innerHTML = "";


    if (
        !contributions ||
        contributions.length === 0
    ) {

        list.innerHTML = `
            <tr>
                <td colspan="7">
                    No contribution records found.
                </td>
            </tr>
        `;

        return;
    }


    // Display records
    contributions.forEach(contribution => {

        const member =
            memberMap[contribution.member_id];

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>
                ${member?.full_name || "Unknown"}
            </td>

            <td>
                ${member?.member_id || "N/A"}
            </td>

            <td>
                ${contribution.contribution_month}
            </td>

            <td>
                ₦${Number(
                    contribution.amount || 0
                ).toLocaleString()}
            </td>

            <td>
                ${contribution.payment_date || "N/A"}
            </td>

            <td>
                ${contribution.notes || "—"}
            </td>

            <td>

                <button
                    class="editContributionBtn"
                    data-id="${contribution.id}"
                >
                    Edit
                </button>

                <button
                    class="deleteContributionBtn"
                    data-id="${contribution.id}"
                >
                    Delete
                </button>

            </td>
        `;

        list.appendChild(row);
    });
}


// ==========================================
// EDIT CONTRIBUTION
// ==========================================

document.addEventListener(
    "click",
    async (event) => {

        if (
            !event.target.classList.contains(
                "editContributionBtn"
            )
        ) {
            return;
        }

        const contributionId =
            event.target.dataset.id;

        // Get the selected contribution
        const {
            data: contribution,
            error
        } = await supabaseClient
            .from("contributions")
            .select(
                "id, contribution_month, amount, payment_date, notes"
            )
            .eq("id", contributionId)
            .single();

        if (error || !contribution) {

            console.error(
                "Error loading contribution:",
                error
            );

            alert(
                "Unable to load contribution."
            );

            return;
        }

        // Put the existing values into the form
        document.getElementById(
            "editContributionId"
        ).value = contribution.id;

        document.getElementById(
            "editContributionMonth"
        ).value = contribution.contribution_month;

        document.getElementById(
            "editAmount"
        ).value = contribution.amount;

        document.getElementById(
            "editPaymentDate"
        ).value = contribution.payment_date || "";

        document.getElementById(
            "editNotes"
        ).value = contribution.notes || "";

        // Show the edit window
        document.getElementById(
            "editContributionModal"
        ).style.display = "block";
    }
);


// ==========================================
// CANCEL EDIT
// ==========================================

document
    .getElementById("cancelEditBtn")
    .addEventListener("click", () => {

        document.getElementById(
            "editContributionModal"
        ).style.display = "none";
    });


// ==========================================
// SAVE EDITED CONTRIBUTION
// ==========================================

document
    .getElementById("editContributionForm")
    .addEventListener("submit", async (event) => {

        event.preventDefault();

        const contributionId =
            document.getElementById(
                "editContributionId"
            ).value;

        const contributionMonth =
            document.getElementById(
                "editContributionMonth"
            ).value;

        const amount =
            Number(
                document.getElementById(
                    "editAmount"
                ).value
            );

        const paymentDate =
            document.getElementById(
                "editPaymentDate"
            ).value;

        const notes =
            document.getElementById(
                "editNotes"
            ).value.trim();

        const message =
            document.getElementById(
                "editMessage"
            );

        if (!contributionMonth) {

            message.textContent =
                "Please select the contribution month.";

            return;
        }

        if (!amount || amount <= 0) {

            message.textContent =
                "Please enter a valid amount.";

            return;
        }

        if (!paymentDate) {

            message.textContent =
                "Please select the payment date.";

            return;
        }

        message.textContent =
            "Saving changes...";

        const {
            error
        } = await supabaseClient
            .from("contributions")
            .update({
                contribution_month:
                    contributionMonth,

                amount:
                    amount,

                payment_date:
                    paymentDate,

                notes:
                    notes || null
            })
            .eq("id", contributionId);

        if (error) {

            console.error(
                "Update contribution error:",
                error
            );

            message.textContent =
                "Error: " + error.message;

            return;
        }

        message.textContent =
            "Changes saved successfully!";

        alert(
            "Contribution updated successfully!"
        );

        // Close window
        document.getElementById(
            "editContributionModal"
        ).style.display = "none";

        // Refresh records and totals
        loadContributionRecords();
        loadAdminDashboard();
    });


// ==========================================
// DELETE CONTRIBUTION
// ==========================================

document.addEventListener(
    "click",
    async (event) => {

        if (
            !event.target.classList.contains(
                "deleteContributionBtn"
            )
        ) {
            return;
        }


        const contributionId =
            event.target.dataset.id;


        const confirmed =
            confirm(
                "Are you sure you want to delete this contribution record?"
            );


        if (!confirmed) {
            return;
        }


        const {
            error
        } = await supabaseClient
            .from("contributions")
            .delete()
            .eq("id", contributionId);


        if (error) {

            console.error(
                "Delete contribution error:",
                error
            );

            alert(
                "Unable to delete contribution: " +
                error.message
            );

            return;
        }


        alert(
            "Contribution deleted successfully!"
        );


        loadContributionRecords();
        loadAdminDashboard();
    }
);


// ==========================================
// START ADMIN DASHBOARD
// ==========================================
// ==========================================
// LOAD MEMBER MANAGEMENT TABLE
// ==========================================

async function loadMemberManagement() {

    const list =
        document.getElementById("adminMemberList");


    // Get all members
    const {
        data: members,
        error: memberError
    } = await supabaseClient
        .from("members")
        .select(
            "id, member_id, full_name, email, phone"
        )
        .eq("role", "member")
        .order("full_name");


    if (memberError) {

        console.error(
            "Error loading member management:",
            memberError
        );

        list.innerHTML = `
            <tr>
                <td colspan="6">
                    Error: ${memberError.message}
                </td>
            </tr>
        `;

        return;
    }


    // Get all contributions
    const {
        data: contributions,
        error: contributionError
    } = await supabaseClient
        .from("contributions")
        .select("member_id, amount");


    if (contributionError) {

        console.error(
            "Error loading member contributions:",
            contributionError
        );

        list.innerHTML = `
            <tr>
                <td colspan="6">
                    Error loading contribution totals:
                    ${contributionError.message}
                </td>
            </tr>
        `;

        return;
    }


    // Calculate total contribution for each member
    const memberTotals = {};


    contributions.forEach(contribution => {

        const memberId =
            contribution.member_id;


        if (!memberTotals[memberId]) {

            memberTotals[memberId] = 0;
        }


        memberTotals[memberId] +=
            Number(contribution.amount || 0);

    });


    // Clear table
    list.innerHTML = "";


    // No members
    if (!members || members.length === 0) {

        list.innerHTML = `
            <tr>
                <td colspan="6">
                    No members found.
                </td>
            </tr>
        `;

        return;
    }


    // Display members
    members.forEach(member => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${member.full_name || "N/A"}
            </td>

            <td>
                ${member.member_id || "N/A"}
            </td>

            <td>
                ${member.email || "N/A"}
            </td>

            <td>
                ${member.phone || "N/A"}
            </td>

            <td>
                ₦${(
                    memberTotals[member.id] || 0
                ).toLocaleString()}
            </td>

            <td>
    <button
        class="editMemberBtn"
        data-id="${member.id}"
    >
        Edit
    </button>
</td>

        `;


        list.appendChild(row);

    });

}
// ==========================================
// OPEN EDIT MEMBER WINDOW
// ==========================================

document.addEventListener("click", async (event) => {

    if (!event.target.classList.contains("editMemberBtn")) {
        return;
    }

    const memberId = event.target.dataset.id;

    const {
        data: member,
        error
    } = await supabaseClient
        .from("members")
        .select("id, member_id, full_name, email, phone")
        .eq("id", memberId)
        .single();

    if (error || !member) {

        console.error("Error loading member:", error);

        alert("Unable to load member.");

        return;
    }

    // Put member information into the edit form
    document.getElementById("editMemberId").value =
        member.id;

    document.getElementById("editMemberCode").value =
        member.member_id || "";

    document.getElementById("editMemberName").value =
        member.full_name || "";

    document.getElementById("editMemberEmail").value =
        member.email || "";

    document.getElementById("editMemberPhone").value =
        member.phone || "";

    // Open the edit window
    document.getElementById(
        "editMemberModal"
    ).style.display = "block";

});
// ==========================================
// SAVE EDITED MEMBER
// ==========================================

document
    .getElementById("editMemberForm")
    .addEventListener("submit", async (event) => {

        event.preventDefault();

        const memberId =
            document.getElementById("editMemberId").value;

        const memberCode =
            document.getElementById("editMemberCode").value.trim();

        const fullName =
            document.getElementById("editMemberName").value.trim();

        const email =
            document.getElementById("editMemberEmail").value.trim();

        const phone =
            document.getElementById("editMemberPhone").value.trim();

        const message =
            document.getElementById("editMemberMessage");

        message.textContent =
            "Saving changes...";


        // Validate
        if (!memberCode || !fullName) {

            message.textContent =
                "Member ID and Full Name are required.";

            return;
        }


        // Update member
        const {
            error
        } = await supabaseClient
            .from("members")
            .update({
                member_id: memberCode,
                full_name: fullName,
                email: email || null,
                phone: phone || null
            })
            .eq("id", memberId);


        if (error) {

            console.error(
                "Update member error:",
                error
            );

            message.textContent =
                "Error: " + error.message;

            return;
        }


        message.textContent =
            "Member updated successfully!";

        alert(
            "Member updated successfully!"
        );


        // Close edit window
        document.getElementById(
            "editMemberModal"
        ).style.display = "none";


        // Refresh member information
        loadMemberManagement();
        loadMembers();
        loadAdminDashboard();

    });
// ==========================================
// CANCEL MEMBER EDIT
// ==========================================

document
    .getElementById("cancelMemberEditBtn")
    .addEventListener("click", () => {

        document.getElementById(
            "editMemberModal"
        ).style.display = "none";

    });
loadMembers();
loadAdminDashboard();
loadContributionRecords();
loadMemberManagement();
