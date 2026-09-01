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
                contribution_date: contributionDate,
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

loadMembers();

loadAdminDashboard();

    });
loadAdminDashboard();
