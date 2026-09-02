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
async function loadAdminDashboard() {

    const {
        data: { user },
        error: authError
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
        window.location.href = "index.html";
        return;
    }

    // Get administrator's profile
    const { data: admin, error: adminError } =
        await supabaseClient
            .from("members")
            .select("full_name, member_id, role")
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
    const { count: memberCount, error: memberError } =
        await supabaseClient
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


// Logout
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

        const phone =
            document.getElementById("newMemberPhone").value.trim();

        const message =
            document.getElementById("memberMessage");

        message.textContent = "Adding member...";


        // Make sure the current user is authenticated
        const {
            data: { user },
            error: authError
        } = await supabaseClient.auth.getUser();


        if (authError || !user) {

            message.textContent =
                "Your session has expired. Please log in again.";

            return;
        }


        // Verify that the current user is an administrator
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


        // Add the new member
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

            console.error("Add member error:", error);

            message.textContent =
                "Error: " + error.message;

            return;
        }


        message.textContent =
            "Member added successfully!";


        // Clear the form
        document
            .getElementById("addMemberForm")
            .reset();


        // Refresh dashboard member count
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
            Number(document.getElementById("amount").value);

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


        // Refresh dashboard
            });
async function loadContributionRecords() {

    const list =
        document.getElementById("adminContributionList");

    // Get all contribution records
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
                <td colspan="6">
                    Unable to load contribution records.
                </td>
            </tr>
        `;

        return;
    }

    // Get member information separately
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
                <td colspan="6">
                    Unable to load member information.
                </td>
            </tr>
        `;

        return;
    }

    // Create a quick member lookup
    const memberMap = {};

    members.forEach(member => {
        memberMap[member.id] = member;
    });

    list.innerHTML = "";

    if (!contributions || contributions.length === 0) {

        list.innerHTML = `
            <tr>
                <td colspan="6">
                    No contribution records found.
                </td>
            </tr>
        `;

        return;
    }

    // Display contribution records
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
</td>
        `;

        list.appendChild(row);
    });
}
loadMembers();
loadAdminDashboard();
loadContributionRecords();
// ==========================================
// EDIT CONTRIBUTION
// ==========================================

document.addEventListener("click", async (event) => {

    if (!event.target.classList.contains("editContributionBtn")) {
        return;
    }

    const contributionId =
        event.target.dataset.id;

    const newAmount = prompt(
        "Enter the new contribution amount:"
    );

    if (newAmount === null) {
        return;
    }

    const amount = Number(newAmount);

    if (!amount || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    const { error } =
        await supabaseClient
            .from("contributions")
            .update({
                amount: amount
            })
            .eq("id", contributionId);

    if (error) {

        console.error(
            "Edit contribution error:",
            error
        );

        alert(
            "Unable to update contribution: " +
            error.message
        );

        return;
    }

    alert("Contribution updated successfully!");

    loadContributionRecords();
    loadAdminDashboard();
});
