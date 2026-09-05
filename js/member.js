// ==========================================
// LOAD MEMBER DASHBOARD
// ==========================================

async function loadMemberDashboard() {

    const {
        data: { user },
        error: authError
    } = await supabaseClient.auth.getUser();


    if (authError || !user) {

        window.location.href = "index.html";

        return;
    }


    // ==========================================
    // FIND LOGGED-IN MEMBER
    // ==========================================

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


    // ==========================================
    // DISPLAY MEMBER INFORMATION
    // ==========================================

    document.getElementById("memberName").textContent =
        member.full_name;

    document.getElementById("memberId").textContent =
        member.member_id;


    // ==========================================
    // PRINTABLE STATEMENT MEMBER INFORMATION
    // ==========================================

    document.getElementById("statementMemberName").textContent =
        member.full_name;

    document.getElementById("statementMemberId").textContent =
        member.member_id;

    document.getElementById("statementDate").textContent =
        new Date().toLocaleDateString();


    // ==========================================
    // GET MEMBER CONTRIBUTIONS
    // ==========================================

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

        document.getElementById(
            "contributionList"
        ).innerHTML = `
            <tr>
                <td colspan="4">
                    Unable to load contributions.
                </td>
            </tr>
        `;

        return;
    }


    // ==========================================
    // CALCULATE TOTAL CONTRIBUTION
    // ==========================================

    const total = contributions.reduce(
        (sum, contribution) =>
            sum + Number(contribution.amount || 0),
        0
    );


    // Normal dashboard total
    document.getElementById("memberTotal").textContent =
        total.toLocaleString();


    // Printable statement total
    document.getElementById(
        "statementMemberTotal"
    ).textContent =
        total.toLocaleString();


    // ==========================================
    // DISPLAY CONTRIBUTION HISTORY
    // ==========================================

    const list =
        document.getElementById("contributionList");

    list.innerHTML = "";


    if (contributions.length === 0) {

        list.innerHTML = `
            <tr>
                <td colspan="4">
                    No contribution records found.
                </td>
            </tr>
        `;

        return;
    }


    contributions.forEach(contribution => {

        const row =
            document.createElement("tr");


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
// MONTH FILTER
// ==========================================

document
    .getElementById("monthFilter")
    .addEventListener("change", function () {

        const selectedMonth =
            this.value;


        const rows =
            document.querySelectorAll(
                "#contributionList tr"
            );


        rows.forEach(row => {

            const monthCell =
                row.querySelector("td");


            if (!monthCell) {
                return;
            }


            const contributionMonth =
                monthCell.textContent.trim();


            if (
                !selectedMonth ||
                contributionMonth.startsWith(
                    selectedMonth
                )
            ) {

                row.style.display = "";

            } else {

                row.style.display = "none";

            }

        });

    });


// ==========================================
// PRINT CONTRIBUTION STATEMENT
// ==========================================

document
    .getElementById("printStatementBtn")
    .addEventListener("click", function () {

        window.print();

    });


// ==========================================
// LOAD MEMBER DASHBOARD
// ==========================================

loadMemberDashboard();


// ==========================================
// LOAD ASSOCIATION BALANCE
// ==========================================

async function loadAssociationBalance() {

    const balanceElement =
        document.getElementById(
            "associationBalance"
        );


    if (!balanceElement) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient.rpc(
        "get_association_balance"
    );


    if (error) {

        console.error(
            "Error loading association balance:",
            error
        );

        balanceElement.textContent =
            "Unable to load";

        return;
    }


    const balance =
        Number(data || 0);


    // Normal dashboard balance
    balanceElement.textContent =
        balance.toLocaleString();


    // Printable statement balance
    const statementBalanceElement =
        document.getElementById(
            "statementAssociationBalance"
        );


    if (statementBalanceElement) {

        statementBalanceElement.textContent =
            balance.toLocaleString();

    }

}


// ==========================================
// LOAD ASSOCIATION BALANCE
// ==========================================

loadAssociationBalance();
