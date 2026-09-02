async function loadMemberDashboard() {

    const {
        data: { user },
        error: authError
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
        window.location.href = "index.html";
        return;
    }


    // Find the logged-in member
    const {
        data: member,
        error: memberError
    } = await supabaseClient
        .from("members")
        .select("id, member_id, full_name, role")
        .eq("auth_user_id", user.id)
        .single();


    if (
        memberError ||
        !member ||
        member.role !== "member"
    ) {
        await supabaseClient.auth.signOut();
        window.location.href = "index.html";
        return;
    }


    // Display member information
    document.getElementById("memberName").textContent =
        member.full_name;

    document.getElementById("memberId").textContent =
        member.member_id;


    // Get this member's contributions
    const {
        data: contributions,
        error: contributionError
    } = await supabaseClient
        .from("contributions")
        .select(
            "contribution_month, amount, payment_date, notes"
        )
        .eq("member_id", member.id)
        .order("contribution_month", {
            ascending: false
        });


    if (contributionError) {

        console.error(
            "Contribution error:",
            contributionError
        );

        document.getElementById("contributionList").textContent =
            "Unable to load contributions.";

        return;
    }


    // Calculate total
    const total = contributions.reduce(
        (sum, contribution) =>
            sum + Number(contribution.amount || 0),
        0
    );


    document.getElementById("memberTotal").textContent =
        total.toLocaleString();


    // Display contribution history
    const list =
        document.getElementById("contributionList");

    list.innerHTML = "";


    if (contributions.length === 0) {

        list.textContent =
            "No contribution records found.";

        return;
    }


    contributions.forEach(contribution => {

    const row = document.createElement("tr");

    row.innerHTML = `
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
    `;

    list.appendChild(row);
});
}


// Logout
document
    .getElementById("logoutBtn")
    .addEventListener("click", async () => {

        await supabaseClient.auth.signOut();

        window.location.href = "index.html";
    });

document
    .getElementById("monthFilter")
    .addEventListener("change", function () {

        const selectedMonth = this.value;

        const rows =
            document.querySelectorAll(
                "#contributionList tr"
            );

        rows.forEach(row => {

            const monthCell = row
                .querySelector("td");

            if (!monthCell) return;

            const contributionMonth =
                monthCell.textContent.trim();

            if (
                !selectedMonth ||
                contributionMonth.startsWith(selectedMonth)
            ) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        });
    });
loadMemberDashboard();
