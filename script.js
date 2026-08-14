// ==========================================
// SUBSENTRY - APPLICATION DATA
// ==========================================

const subscriptions =
    JSON.parse(
        localStorage.getItem("subscriptions")
    ) || [];


const appState = {

    currency: "INR",

    currentFilter: "all",

    searchQuery: "",

    editingId: null

};


// ==========================================
// DOM ELEMENTS
// ==========================================

const subscriptionForm =
    document.getElementById(
        "subscriptionForm"
    );

const subscriptionNameInput =
    document.getElementById(
        "subscriptionName"
    );

const amountInput =
    document.getElementById(
        "amount"
    );

const billingCycleInput =
    document.getElementById(
        "billingCycle"
    );

const categoryInput =
    document.getElementById(
        "category"
    );

const startDateInput =
    document.getElementById(
        "startDate"
    );

const subscriptionList =
    document.getElementById(
        "subscriptionList"
    );

const totalMonthlySpend =
    document.getElementById(
        "totalMonthlySpend"
    );

const subscriptionCount =
    document.getElementById(
        "subscriptionCount"
    );

const topCategory =
    document.getElementById(
        "topCategory"
    );

const overlapCount =
    document.getElementById(
        "overlapCount"
    );

const categoryBreakdown =
    document.getElementById(
        "categoryBreakdown"
    );

const overlapList =
    document.getElementById(
        "overlapList"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const categoryFilter =
    document.getElementById(
        "categoryFilter"
    );

const nameError =
    document.getElementById(
        "nameError"
    );

const amountError =
    document.getElementById(
        "amountError"
    );

const dateError =
    document.getElementById(
        "dateError"
    );

const cancelEditButton =
    document.getElementById(
        "cancelEditButton"
    );


// ==========================================
// BILLING NORMALIZATION
// ==========================================

function normalizeMonthlyCost(
    amount,
    billingCycle
) {

    if (billingCycle === "weekly") {

        return (amount * 52) / 12;

    }


    if (billingCycle === "monthly") {

        return amount;

    }


    if (billingCycle === "yearly") {

        return amount / 12;

    }


    return 0;
}


// ==========================================
// LOCAL STORAGE
// ==========================================

function saveSubscriptions() {

    localStorage.setItem(
        "subscriptions",
        JSON.stringify(subscriptions)
    );

}


// ==========================================
// FORM VALIDATION
// ==========================================

function validateForm(
    name,
    amount,
    startDate
) {

    let isValid = true;


    nameError.textContent = "";

    amountError.textContent = "";

    dateError.textContent = "";


    if (name === "") {

        nameError.textContent =
            "Please enter a service name.";

        isValid = false;

    }


    if (
        amount <= 0 ||
        Number.isNaN(amount)
    ) {

        amountError.textContent =
            "Amount must be greater than 0.";

        isValid = false;

    }


    if (startDate === "") {

        dateError.textContent =
            "Please select a start date.";

        isValid = false;

    }


    return isValid;
}


// ==========================================
// CALCULATE TOTAL MONTHLY SPEND
// ==========================================

function calculateTotalMonthlySpend() {

    let total = 0;


    subscriptions.forEach(
        function(subscription) {

            if (
                subscription.status ===
                "active"
            ) {

                total +=
                    normalizeMonthlyCost(
                        Number(
                            subscription.amount
                        ),
                        subscription.billingCycle
                    );

            }

        }
    );


    return total;
}


// ==========================================
// CALCULATE CATEGORY TOTALS
// ==========================================

function calculateCategoryTotals() {

    const categoryTotals = {};


    subscriptions.forEach(
        function(subscription) {

            if (
                subscription.status !==
                "active"
            ) {

                return;

            }


            const category =
                subscription.category;


            const monthlyCost =
                normalizeMonthlyCost(
                    Number(
                        subscription.amount
                    ),
                    subscription.billingCycle
                );


            if (
                !categoryTotals[category]
            ) {

                categoryTotals[category] = 0;

            }


            categoryTotals[category] +=
                monthlyCost;

        }
    );


    return categoryTotals;
}


// ==========================================
// FIND TOP CATEGORY
// ==========================================

function calculateTopCategory() {

    const categoryTotals =
        calculateCategoryTotals();


    const categories =
        Object.keys(
            categoryTotals
        );


    if (
        categories.length === 0
    ) {

        return "—";

    }


    let highestCategory =
        categories[0];


    for (
        let i = 1;
        i < categories.length;
        i++
    ) {

        if (
            categoryTotals[
                categories[i]
            ] >
            categoryTotals[
                highestCategory
            ]
        ) {

            highestCategory =
                categories[i];

        }

    }


    return highestCategory;
}


// ==========================================
// OVERLAP DETECTION
// ==========================================

function detectOverlaps() {

    const overlaps = [];


    for (
        let i = 0;
        i < subscriptions.length;
        i++
    ) {

        for (
            let j = i + 1;
            j < subscriptions.length;
            j++
        ) {

            const first =
                subscriptions[i];

            const second =
                subscriptions[j];


            // Only compare active subscriptions

            if (
                first.status !==
                "active" ||
                second.status !==
                "active"
            ) {

                continue;

            }


            let score = 0;

            const reasons = [];


            // SAME CATEGORY

            if (
                first.category ===
                second.category
            ) {

                score += 40;

                reasons.push(
                    "Same category"
                );

            }


            // SERVICE NAME SIMILARITY

            const firstName =
                first.name
                    .toLowerCase()
                    .trim();

            const secondName =
                second.name
                    .toLowerCase()
                    .trim();


            if (
                firstName.includes(
                    secondName
                ) ||
                secondName.includes(
                    firstName
                )
            ) {

                score += 40;

                reasons.push(
                    "Similar service names"
                );

            }


            // BOTH ACTIVE

            score += 20;

            reasons.push(
                "Both subscriptions are active"
            );


            // OVERLAP THRESHOLD

            if (score >= 60) {

                overlaps.push({

                    first:
                        first.name,

                    second:
                        second.name,

                    score:
                        score,

                    reasons:
                        reasons

                });

            }

        }

    }


    return overlaps;
}


// ==========================================
// CALCULATE OVERLAP COUNT
// ==========================================

function calculateOverlapCount() {

    return detectOverlaps().length;

}


// ==========================================
// UPDATE DASHBOARD
// ==========================================

function updateDashboard() {

    const total =
        calculateTotalMonthlySpend();


    totalMonthlySpend.textContent =
        `₹${total.toFixed(2)}`;


    const activeCount =
        subscriptions.filter(
            function(subscription) {

                return (
                    subscription.status ===
                    "active"
                );

            }
        ).length;


    subscriptionCount.textContent =
        activeCount;


    topCategory.textContent =
        calculateTopCategory();


    overlapCount.textContent =
        calculateOverlapCount();

}


// ==========================================
// RENDER CATEGORY BREAKDOWN
// ==========================================

function renderCategoryBreakdown() {

    const categoryTotals =
        calculateCategoryTotals();


    const categories =
        Object.keys(
            categoryTotals
        );


    if (
        categories.length === 0
    ) {

        categoryBreakdown.innerHTML = `

            <div class="empty-state">

                <span>📊</span>

                <p>
                    Add subscriptions to see your
                    spending analysis.
                </p>

            </div>

        `;

        return;
    }


    const total =
        calculateTotalMonthlySpend();


    categories.sort(
        function(a, b) {

            return (
                categoryTotals[b] -
                categoryTotals[a]
            );

        }
    );


    categoryBreakdown.innerHTML =
        "";


    categories.forEach(
        function(category) {

            const amount =
                categoryTotals[
                    category
                ];


            const percentage =
                total === 0
                    ? 0
                    : (
                        amount /
                        total
                    ) * 100;


            const categoryElement =
                document.createElement(
                    "div"
                );


            categoryElement.className =
                "category-item";


            categoryElement.innerHTML = `

                <div class="category-header">

                    <span class="category-name">
                        ${escapeHTML(category)}
                    </span>

                    <span class="category-value">
                        ₹${amount.toFixed(2)}
                    </span>

                </div>


                <div class="category-bar">

                    <div
                        class="category-bar-fill"
                        style="width:${percentage}%">
                    </div>

                </div>

            `;


            categoryBreakdown.appendChild(
                categoryElement
            );

        }
    );
}


// ==========================================
// RENDER OVERLAP ALERTS
// ==========================================

function renderOverlapAlerts() {

    const overlaps =
        detectOverlaps();


    overlapList.innerHTML =
        "";


    if (
        overlaps.length === 0
    ) {

        overlapList.innerHTML = `

            <div class="empty-state">

                <span>✓</span>

                <p>
                    No potential overlaps detected.
                </p>

            </div>

        `;

        return;
    }


    overlaps.forEach(
        function(overlap) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "overlap-card";


            card.innerHTML = `

                <div class="overlap-card-header">

                    <div class="overlap-services">

                        ${escapeHTML(
                            overlap.first
                        )}

                        ↔

                        ${escapeHTML(
                            overlap.second
                        )}

                    </div>


                    <div class="overlap-score">

                        Score
                        ${overlap.score}/100

                    </div>

                </div>


                <div class="overlap-reasons">

                    ${overlap.reasons
                        .map(
                            function(reason) {

                                return `

                                    <span
                                        class="overlap-reason">

                                        ${escapeHTML(
                                            reason
                                        )}

                                    </span>

                                `;

                            }
                        )
                        .join("")}

                </div>

            `;


            overlapList.appendChild(
                card
            );

        }
    );

}


// ==========================================
// FILTER SUBSCRIPTIONS
// ==========================================

function getFilteredSubscriptions() {

    return subscriptions.filter(
        function(subscription) {

            const matchesSearch =
                subscription.name
                    .toLowerCase()
                    .includes(
                        appState.searchQuery
                    );


            const matchesCategory =
                appState.currentFilter ===
                "all" ||
                subscription.category ===
                appState.currentFilter;


            return (
                matchesSearch &&
                matchesCategory
            );

        }
    );

}


// ==========================================
// RENDER SUBSCRIPTIONS
// ==========================================

function renderSubscriptions() {

    const filteredSubscriptions =
        getFilteredSubscriptions();


    subscriptionList.innerHTML =
        "";


    if (
        filteredSubscriptions.length ===
        0
    ) {

        subscriptionList.innerHTML = `

            <div class="empty-state">

                <span>💳</span>

                <h3>
                    No subscriptions found
                </h3>

                <p>
                    Try changing your search
                    or category filter.
                </p>

            </div>

        `;

        return;
    }


    filteredSubscriptions.forEach(
        function(subscription) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "subscription-card";


            const monthlyCost =
                normalizeMonthlyCost(
                    Number(
                        subscription.amount
                    ),
                    subscription.billingCycle
                );


            card.innerHTML = `

                <div class="subscription-info">

                    <div class="subscription-icon">

                        ${escapeHTML(
                            subscription.name
                                .charAt(0)
                                .toUpperCase()
                        )}

                    </div>


                    <div>

                        <div class="subscription-name">

                            ${escapeHTML(
                                subscription.name
                            )}

                        </div>


                        <div class="subscription-meta">

                            ${escapeHTML(
                                subscription.category
                            )}

                            •

                            ${escapeHTML(
                                subscription.billingCycle
                            )}

                        </div>

                    </div>

                </div>


                <div class="subscription-cost">

                    <strong>
                        ₹${monthlyCost.toFixed(2)}
                    </strong>

                    <span>
                        per month
                    </span>

                </div>


                <div class="subscription-actions">

                    <button
                        class="action-button"
                        onclick="editSubscription(${subscription.id})">

                        Edit

                    </button>


                    <button
                        class="action-button delete-button"
                        onclick="deleteSubscription(${subscription.id})">

                        Delete

                    </button>

                </div>

            `;


            subscriptionList.appendChild(
                card
            );

        }
    );

}


// ==========================================
// EDIT SUBSCRIPTION
// ==========================================

function editSubscription(id) {

    const subscription =
        subscriptions.find(
            function(subscription) {

                return subscription.id ===
                    id;

            }
        );


    if (!subscription) {

        return;

    }


    appState.editingId =
        id;


    subscriptionNameInput.value =
        subscription.name;


    amountInput.value =
        subscription.amount;


    billingCycleInput.value =
        subscription.billingCycle;


    categoryInput.value =
        subscription.category;


    startDateInput.value =
        subscription.startDate;


    nameError.textContent =
        "";

    amountError.textContent =
        "";

    dateError.textContent =
        "";


    document.querySelector(
        ".primary-button"
    ).textContent =
        "Update Subscription";


    cancelEditButton.style.display =
        "block";


    document.querySelector(
        ".form-panel"
    ).scrollIntoView({

        behavior: "smooth",

        block: "start"

    });

}


// ==========================================
// CANCEL EDIT
// ==========================================

function cancelEdit() {

    appState.editingId =
        null;


    subscriptionForm.reset();


    nameError.textContent =
        "";

    amountError.textContent =
        "";

    dateError.textContent =
        "";


    document.querySelector(
        ".primary-button"
    ).textContent =
        "+ Add Subscription";


    cancelEditButton.style.display =
        "none";

}


cancelEditButton.addEventListener(
    "click",
    cancelEdit
);


// ==========================================
// DELETE SUBSCRIPTION
// ==========================================

function deleteSubscription(id) {

    const index =
        subscriptions.findIndex(
            function(subscription) {

                return subscription.id ===
                    id;

            }
        );


    if (index === -1) {

        return;

    }


    const subscription =
        subscriptions[index];


    const confirmed =
        confirm(
            `Delete ${subscription.name}?`
        );


    if (!confirmed) {

        return;

    }


    subscriptions.splice(
        index,
        1
    );


    saveSubscriptions();


    renderSubscriptions();

    updateDashboard();

    renderCategoryBreakdown();

    renderOverlapAlerts();

}


// ==========================================
// ADD / UPDATE SUBSCRIPTION
// ==========================================

subscriptionForm.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const name =
            subscriptionNameInput.value
                .trim();


        const amount =
            Number(
                amountInput.value
            );


        const billingCycle =
            billingCycleInput.value;


        const category =
            categoryInput.value;


        const startDate =
            startDateInput.value;


        // VALIDATE

        if (
            !validateForm(
                name,
                amount,
                startDate
            )
        ) {

            return;

        }


        // ==================================
        // UPDATE EXISTING
        // ==================================

        if (
            appState.editingId !== null
        ) {

            const subscription =
                subscriptions.find(
                    function(subscription) {

                        return (
                            subscription.id ===
                            appState.editingId
                        );

                    }
                );


            if (subscription) {

                subscription.name =
                    name;

                subscription.amount =
                    amount;

                subscription.billingCycle =
                    billingCycle;

                subscription.category =
                    category;

                subscription.startDate =
                    startDate;

                subscription.normalizedMonthlyCost =
                    normalizeMonthlyCost(
                        amount,
                        billingCycle
                    );

            }


            appState.editingId =
                null;

        }


        // ==================================
        // ADD NEW
        // ==================================

        else {

            const subscription = {

                id: Date.now(),

                name: name,

                amount: amount,

                billingCycle:
                    billingCycle,

                category:
                    category,

                startDate:
                    startDate,

                status:
                    "active",

                normalizedMonthlyCost:
                    normalizeMonthlyCost(
                        amount,
                        billingCycle
                    )

            };


            subscriptions.push(
                subscription
            );

        }


        // SAVE

        saveSubscriptions();


        // UPDATE UI

        renderSubscriptions();

        updateDashboard();

        renderCategoryBreakdown();

        renderOverlapAlerts();


        // RESET FORM

        subscriptionForm.reset();


        nameError.textContent =
            "";

        amountError.textContent =
            "";

        dateError.textContent =
            "";


        document.querySelector(
            ".primary-button"
        ).textContent =
            "+ Add Subscription";


        cancelEditButton.style.display =
            "none";


        console.log(
            "Subscriptions:",
            subscriptions
        );

    }
);


// ==========================================
// SEARCH
// ==========================================

searchInput.addEventListener(
    "input",
    function(event) {

        appState.searchQuery =
            event.target.value
                .trim()
                .toLowerCase();


        renderSubscriptions();

    }
);


// ==========================================
// CATEGORY FILTER
// ==========================================

categoryFilter.addEventListener(
    "change",
    function(event) {

        appState.currentFilter =
            event.target.value;


        renderSubscriptions();

    }
);


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ==========================================
// INITIAL RENDER
// ==========================================

renderSubscriptions();

updateDashboard();

renderCategoryBreakdown();

renderOverlapAlerts();