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
// ==========================================
// JYBA FINANCIAL PIE CHART
// ==========================================

async function loadJYBAFinancialChart() {

    const canvas = document.getElementById("jybaFinancialChart");

    if (!canvas) {
        return;
    }

    let totalContributions = 0;
    let totalIncome = 0;
    let totalExpenses = 0;

    // ==========================================
    // GET MEMBER CONTRIBUTIONS
    // ==========================================

    const { data: contributions, error: contributionError } =
        await supabaseClient
            .from("contributions")
            .select("amount");

    if (contributionError) {

        console.error(
            "Error loading contributions:",
            contributionError
        );

    } else {

        (contributions || []).forEach(function(item) {

            totalContributions += Number(item.amount) || 0;

        });

    }


    // ==========================================
    // GET ASSOCIATION INCOME & EXPENSES
    // ==========================================

    const { data: transactions, error: transactionError } =
        await supabaseClient
            .from("financial_transactions")
            .select("transaction_type, amount");

    if (transactionError) {

        console.error(
            "Error loading financial transactions:",
            transactionError
        );

    } else {

        (transactions || []).forEach(function(item) {

            const amount = Number(item.amount) || 0;

            if (item.transaction_type === "income") {

                totalIncome += amount;

            }

            if (item.transaction_type === "expense") {

                totalExpenses += amount;

            }

        });

    }


    // ==========================================
    // SHOW VALUES IN CONSOLE
    // ==========================================

    console.log(
        "JYBA Financial Chart:",
        {
            contributions: totalContributions,
            income: totalIncome,
            expenses: totalExpenses
        }
    );


    // ==========================================
    // REMOVE OLD CHART
    // ==========================================

    if (window.jybaFinancialChartInstance) {

        window.jybaFinancialChartInstance.destroy();

    }


    // ==========================================
    // CREATE REAL FINANCIAL PIE CHART
    // ==========================================

    window.jybaFinancialChartInstance = new Chart(
        canvas,
        {

            type: "pie",

            data: {

                labels: [
                    "Member Contributions",
                    "Other Income",
                    "Expenses"
                ],

                datasets: [

                    {

                        data: [
                            totalContributions,
                            totalIncome,
                            totalExpenses
                        ],

                        backgroundColor: [
                            "#1f77b4",
                            "#90ee90",
                            "#ff8c42"
                        ],

                        borderColor: "#ffffff",

                        borderWidth: 3

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        display: true,

                        position: "bottom"

                    },

                    tooltip: {

                        callbacks: {

                            label: function(context) {

                                const value =
                                    Number(context.raw) || 0;

                                return (
                                    context.label +
                                    ": ₦" +
                                    value.toLocaleString()
                                );

                            }

                        }

                    }

                }

            }

        }

    );

}


// ==========================================
// LOAD FINANCIAL CHART
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadJYBAFinancialChart();

    }
);
// ==========================================
// JYBA PUBLIC NEWS
// ==========================================

async function loadPublicNews() {

    const newsList =
        document.getElementById("publicNewsList");

    if (!newsList) return;


    const { data: news, error } =
        await supabaseClient
            .from("news")
            .select(
                "title, content, news_date"
            )
            .eq("published", true)
            .order(
                "news_date",
                { ascending: false }
            );


    if (error) {

        console.error(
            "Error loading public news:",
            error
        );

        newsList.innerHTML = `
            <div class="news-item">

                <div class="news-icon">
                    ⚠️
                </div>

                <div class="news-content">

                    <h3>News unavailable</h3>

                    <p>
                        We are currently unable to load
                        the latest association news.
                    </p>

                </div>

            </div>
        `;

        return;
    }


    newsList.innerHTML = "";


    if (!news || news.length === 0) {

        newsList.innerHTML = `
            <div class="news-item">

                <div class="news-icon">
                    📢
                </div>

                <div class="news-content">

                    <h3>No news yet</h3>

                    <p>
                        There are currently no published
                        announcements.
                    </p>

                </div>

            </div>
        `;

        return;
    }


    news.forEach(function (item) {

        const newsItem =
            document.createElement("div");

        newsItem.className = "news-item";


        const icon =
            document.createElement("div");

        icon.className = "news-icon";
        icon.textContent = "📢";


        const content =
            document.createElement("div");

        content.className = "news-content";


        const title =
            document.createElement("h3");

        title.textContent =
            item.title;


        const date =
            document.createElement("p");

        date.className = "news-date";

        date.textContent =
            "Date: " + item.news_date;


        const newsText =
    document.createElement("p");

const readMoreButton =
    document.createElement("button");

const fullText =
    item.content || "";

const previewLength = 180;

if (fullText.length > previewLength) {

    newsText.textContent =
        fullText.substring(0, previewLength) + "...";

    readMoreButton.textContent =
        "Read More →";

    readMoreButton.type = "button";

    readMoreButton.className =
        "read-more-btn";

    readMoreButton.addEventListener(
        "click",
        function () {

            if (
                readMoreButton.textContent ===
                "Read More →"
            ) {

                newsText.textContent =
                    fullText;

                readMoreButton.textContent =
                    "Read Less ↑";

            } else {

                newsText.textContent =
                    fullText.substring(
                        0,
                        previewLength
                    ) + "...";

                readMoreButton.textContent =
                    "Read More →";

            }

        }
    );

    content.appendChild(title);
    content.appendChild(date);
    content.appendChild(newsText);
    content.appendChild(readMoreButton);

} else {

    newsText.textContent =
        fullText;

    content.appendChild(title);
    content.appendChild(date);
    content.appendChild(newsText);

}
        newsItem.appendChild(icon);
        newsItem.appendChild(content);

        newsList.appendChild(newsItem);

    });

}


// LOAD PUBLIC NEWS
document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadPublicNews();

    }
);
