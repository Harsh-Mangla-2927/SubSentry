"use strict";

/* =========================================================
   SUBSENTRY — PERSONALIZED ACTION CENTER
   ========================================================= */

(function () {

    let selectedSubscription = null;

    let initialized = false;


    /* =====================================================
       SAFE DATA HELPERS
       ===================================================== */

    function getSubscriptionsSafe() {

        if (
            typeof getSubscriptions === "function"
        ) {
            return getSubscriptions() || [];
        }

        return [];
    }


    function saveSubscriptionsSafe(
        subscriptions
    ) {

        if (
            typeof saveSubscriptions === "function"
        ) {

            saveSubscriptions(
                subscriptions
            );

            return true;
        }

        return false;
    }


    function getMonthlyValue(
        subscription
    ) {

        if (!subscription) {
            return 0;
        }


        if (
            typeof normalizeMonthlyAmount ===
            "function"
        ) {

            return Number(
                normalizeMonthlyAmount(
                    subscription.amount,
                    subscription.billingCycle
                )
            ) || 0;
        }


        return Number(
            subscription.amount
        ) || 0;
    }


    function formatMoney(
        value
    ) {

        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2
            }
        ).format(
            Number(value) || 0
        );
    }


    function escapeHTML(
        value
    ) {

        return String(
            value ?? ""
        )
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


    function getMonthlyBurn(
        subscriptions
    ) {

        return subscriptions.reduce(
            function (
                total,
                subscription
            ) {

                return total +
                    getMonthlyValue(
                        subscription
                    );

            },
            0
        );
    }


    function getCategoryTotals(
        subscriptions
    ) {

        const totals = {};


        subscriptions.forEach(
            function (
                subscription
            ) {

                const category =
                    subscription.category ||
                    "Other";


                const monthly =
                    getMonthlyValue(
                        subscription
                    );


                totals[category] =
                    (
                        totals[category] ||
                        0
                    ) + monthly;

            }
        );


        return totals;
    }


    /* =====================================================
       GENERATE SMART ACTIONS
       ===================================================== */

    function generateActions() {

        const subscriptions =
            getSubscriptionsSafe();


        if (
            !subscriptions.length
        ) {

            return [];
        }


        const actions = [];


        const monthlyBurn =
            getMonthlyBurn(
                subscriptions
            );


        /* =================================================
           OVERLAP ACTION
           ================================================= */

        let overlaps = [];


        if (
            typeof detectOverlaps ===
            "function"
        ) {

            try {

                overlaps =
                    detectOverlaps() || [];

            } catch (
                error
            ) {

                console.warn(
                    "SubSentry: overlap detection unavailable.",
                    error
                );

                overlaps = [];
            }
        }


        if (
            overlaps.length
        ) {

            const overlap =
                overlaps[0];


            const first =
                overlap.first ||
                null;


            const second =
                overlap.second ||
                null;


            if (
                first &&
                second
            ) {

                const combined =
                    Number(
                        overlap.combined
                    ) ||
                    (
                        getMonthlyValue(
                            first
                        ) +
                        getMonthlyValue(
                            second
                        )
                    );


                actions.push({

                    id:
                        "overlap",

                    type:
                        "danger",

                    icon:
                        "!",

                    label:
                        "Review",

                    title:
                        `Review ${
                            first.name ||
                            "Subscription"
                        } + ${
                            second.name ||
                            "Subscription"
                        }`,

                    description:
                        `Potential ${
                            overlap.category ||
                            "category"
                        } overlap detected between these active subscriptions.`,

                    value:
                        `${formatMoney(
                            combined
                        )}/month combined`,

                    primarySubscription:
                        first,

                    secondarySubscription:
                        second,

                    combined:
                        combined,

                    priority:
                        100
                });
            }
        }


        /* =================================================
           CATEGORY ACTION
           ================================================= */

        const categoryTotals =
            getCategoryTotals(
                subscriptions
            );


        const categoryEntries =
            Object.entries(
                categoryTotals
            )
            .sort(
                function (
                    a,
                    b
                ) {

                    return b[1] - a[1];

                }
            );


        if (
            categoryEntries.length &&
            monthlyBurn > 0
        ) {

            const topCategory =
                categoryEntries[0];


            const percentage =
                (
                    topCategory[1] /
                    monthlyBurn
                ) * 100;


            if (
                percentage >= 25
            ) {

                actions.push({

                    id:
                        "category",

                    type:
                        percentage >= 35
                            ? "warning"
                            : "info",

                    icon:
                        percentage >= 35
                            ? "!"
                            : "i",

                    label:
                        "Spending",

                    title:
                        `${
                            topCategory[0]
                        } spending is ${
                            percentage.toFixed(0)
                        }%`,

                    description:
                        "This category represents a significant share of your normalized monthly subscription burn.",

                    value:
                        `${formatMoney(
                            topCategory[1]
                        )}/month`,

                    category:
                        topCategory[0],

                    priority:
                        percentage >= 35
                            ? 80
                            : 65
                });
            }
        }


        /* =================================================
           LARGEST SUBSCRIPTION / SAVINGS
           ================================================= */

        const sortedSubscriptions =
            [...subscriptions]
            .sort(
                function (
                    a,
                    b
                ) {

                    return (
                        getMonthlyValue(b) -
                        getMonthlyValue(a)
                    );

                }
            );


        if (
            sortedSubscriptions.length
        ) {

            const largest =
                sortedSubscriptions[0];


            const monthly =
                getMonthlyValue(
                    largest
                );


            const annual =
                monthly * 12;


            actions.push({

                id:
                    "savings",

                type:
                    "success",

                icon:
                    "✓",

                label:
                    "Savings",

                title:
                    `Review ${
                        largest.name ||
                        "your largest subscription"
                    }`,

                description:
                    "Removing this subscription would create a meaningful recurring saving if you no longer need the service.",

                value:
                    `${formatMoney(
                        annual
                    )}/year potential saving`,

                subscription:
                    largest,

                priority:
                    60
            });
        }


        /* =================================================
           ANNUAL COMMITMENT
           ================================================= */

        const annualCost =
            monthlyBurn * 12;


        if (
            annualCost > 0
        ) {

            actions.push({

                id:
                    "annual",

                type:
                    "info",

                icon:
                    "₹",

                label:
                    "Commitment",

                title:
                    "Your yearly commitment",

                description:
                    "Your current recurring subscriptions represent a significant annual financial commitment.",

                value:
                    `${formatMoney(
                        annualCost
                    )}/year`,

                priority:
                    40
            });
        }


        return actions
            .sort(
                function (
                    a,
                    b
                ) {

                    return (
                        b.priority -
                        a.priority
                    );

                }
            )
            .slice(
                0,
                4
            );
    }


    /* =====================================================
       CREATE ACTION CARD
       ===================================================== */

    function createActionCard(
        action,
        index
    ) {

        const card =
            document.createElement(
                "article"
            );


        card.className =
            `action-card ${action.type}`;


        let buttons = "";


        if (
            action.primarySubscription
        ) {

            buttons = `

                <button
                    type="button"
                    class="action-card-button action-review-button"
                    data-action-index="${index}"
                    data-action-type="review-overlap"
                >
                    Review
                </button>

                <button
                    type="button"
                    class="action-card-button action-simulate-button"
                    data-action-index="${index}"
                    data-action-type="simulate-overlap"
                >
                    Simulate
                </button>

            `;

        } else if (
            action.subscription
        ) {

            buttons = `

                <button
                    type="button"
                    class="action-card-button action-review-button"
                    data-action-index="${index}"
                    data-action-type="review-subscription"
                >
                    Review
                </button>

                <button
                    type="button"
                    class="action-card-button action-simulate-button"
                    data-action-index="${index}"
                    data-action-type="simulate"
                >
                    Simulate
                </button>

            `;

        } else if (
            action.category
        ) {

            buttons = `

                <button
                    type="button"
                    class="action-card-button action-review-button"
                    data-action-index="${index}"
                    data-action-type="review-category"
                >
                    Review
                </button>

            `;
        }


        card.innerHTML = `

            <div class="action-card-top">

                <div class="action-card-type">

                    <span class="action-card-icon">
                        ${escapeHTML(
                            action.icon
                        )}
                    </span>

                    ${escapeHTML(
                        action.label
                    )}

                </div>

            </div>


            <h3>
                ${escapeHTML(
                    action.title
                )}
            </h3>


            <p class="action-card-description">
                ${escapeHTML(
                    action.description
                )}
            </p>


            <div class="action-card-value">
                ${escapeHTML(
                    action.value
                )}
            </div>


            ${
                buttons
                    ? `
                        <div class="action-card-actions">
                            ${buttons}
                        </div>
                    `
                    : ""
            }

        `;


        return card;
    }


    /* =====================================================
       RENDER ACTION CENTER
       ===================================================== */

    function renderActionCenter() {

        const grid =
            document.getElementById(
                "actionCenterGrid"
            );


        const empty =
            document.getElementById(
                "actionCenterEmpty"
            );


        if (
            !grid ||
            !empty
        ) {

            return;
        }


        const actions =
            generateActions();


        window.subsentryActions =
            actions;


        grid.innerHTML =
            "";


        if (
            !actions.length
        ) {

            grid.style.display =
                "none";


            empty.style.display =
                "block";


            return;
        }


        empty.style.display =
            "none";


        grid.style.display =
            "grid";


        actions.forEach(
            function (
                action,
                index
            ) {

                grid.appendChild(
                    createActionCard(
                        action,
                        index
                    )
                );

            }
        );
    }


    /* =====================================================
       ACTION CENTER CLICK HANDLER
       ===================================================== */

    function setupActionCenterClicks() {

        const grid =
            document.getElementById(
                "actionCenterGrid"
            );


        if (
            !grid
        ) {

            return;
        }


        if (
            grid.dataset.actionEventsBound ===
            "true"
        ) {

            return;
        }


        grid.dataset.actionEventsBound =
            "true";


        grid.addEventListener(
            "click",
            function (
                event
            ) {

                const button =
                    event.target.closest(
                        "[data-action-type]"
                    );


                if (
                    !button ||
                    !grid.contains(
                        button
                    )
                ) {

                    return;
                }


                event.preventDefault();


                event.stopPropagation();


                const index =
                    Number(
                        button.dataset.actionIndex
                    );


                const type =
                    button.dataset.actionType;


                const actions =
                    window.subsentryActions ||
                    [];


                const action =
                    actions[index];


                if (
                    !action
                ) {

                    return;
                }


                if (
                    type ===
                    "review-subscription"
                ) {

                    focusSubscription(
                        action.subscription
                    );

                    return;
                }


                if (
                    type ===
                    "review-overlap"
                ) {

                    focusSubscription(
                        action.primarySubscription
                    );

                    return;
                }


                if (
                    type ===
                    "review-category"
                ) {

                    focusCategory(
                        action.category
                    );

                    return;
                }


                if (
                    type ===
                    "simulate"
                ) {

                    openSimulation(
                        action.subscription
                    );

                    return;
                }


                if (
                    type ===
                    "simulate-overlap"
                ) {

                    openSimulation(
                        action.primarySubscription
                    );

                }

            }
        );
    }


    /* =====================================================
       REVIEW SUBSCRIPTION
       ===================================================== */

    function focusSubscription(
        subscription
    ) {

        if (
            !subscription
        ) {

            return;
        }


        if (
            typeof editSubscription ===
            "function"
        ) {

            editSubscription(
                subscription.id
            );

            return;
        }


        const ledger =
            document.getElementById(
                "subscriptionList"
            );


        if (
            ledger
        ) {

            ledger.scrollIntoView({
                behavior:
                    "smooth",

                block:
                    "center"
            });
        }
    }


    /* =====================================================
       REVIEW CATEGORY
       ===================================================== */

    function focusCategory(
        category
    ) {

        const filter =
            document.getElementById(
                "categoryFilter"
            );


        if (
            filter
        ) {

            const option =
                [...filter.options]
                .find(
                    function (
                        item
                    ) {

                        return (
                            item.value ===
                            category
                        );

                    }
                );


            if (
                option
            ) {

                filter.value =
                    category;


                filter.dispatchEvent(
                    new Event(
                        "change"
                    )
                );
            }
        }


        const ledger =
            document.getElementById(
                "subscriptionList"
            );


        if (
            ledger
        ) {

            ledger.scrollIntoView({
                behavior:
                    "smooth",

                block:
                    "center"
            });
        }
    }


    /* =====================================================
       FIND / BIND EXISTING MODAL
       ===================================================== */

    function ensureSimulationModal() {

        const modal =
            document.getElementById(
                "actionSimulationModal"
            );


        if (
            !modal
        ) {

            console.error(
                "SubSentry: actionSimulationModal not found in index.html."
            );

            return null;
        }


        setupSimulationEvents(
            modal
        );


        return modal;
    }


    /* =====================================================
       SIMULATION EVENT BINDING
       ===================================================== */

    function setupSimulationEvents(
        modal
    ) {

        if (
            !modal
        ) {

            return;
        }


        if (
            modal.dataset.eventsBound ===
            "true"
        ) {

            return;
        }


        modal.dataset.eventsBound =
            "true";


        const closeButton =
            modal.querySelector(
                "#closeActionModal"
            );


        const overlay =
            modal.querySelector(
                "#actionModalOverlay"
            );


        const keepButton =
            modal.querySelector(
                "#keepSubscriptionButton"
            );


        const cancelButton =
            modal.querySelector(
                "#cancelSubscriptionButton"
            );


        if (
            closeButton
        ) {

            closeButton.addEventListener(
                "click",
                function (
                    event
                ) {

                    event.preventDefault();

                    event.stopPropagation();

                    closeSimulation();

                }
            );
        }


        if (
            overlay
        ) {

            overlay.addEventListener(
                "click",
                function (
                    event
                ) {

                    event.preventDefault();

                    closeSimulation();

                }
            );
        }


        if (
            keepButton
        ) {

            keepButton.addEventListener(
                "click",
                function (
                    event
                ) {

                    event.preventDefault();

                    event.stopPropagation();

                    closeSimulation();

                }
            );
        }


        if (
            cancelButton
        ) {

            cancelButton.addEventListener(
                "click",
                function (
                    event
                ) {

                    event.preventDefault();

                    event.stopPropagation();

                    cancelSelectedSubscription();

                }
            );
        }
    }


    /* =====================================================
       OPEN SIMULATION
       ===================================================== */

    function openSimulation(
        subscription
    ) {

        if (
            !subscription
        ) {

            console.error(
                "SubSentry: Cannot simulate an empty subscription."
            );

            return;
        }


        selectedSubscription =
            subscription;


        const modal =
            ensureSimulationModal();


        if (
            !modal
        ) {

            return;
        }


        const subscriptionBox =
            document.getElementById(
                "simulationSubscription"
            );


        const currentBurnElement =
            document.getElementById(
                "simulationCurrentBurn"
            );


        const newBurnElement =
            document.getElementById(
                "simulationNewBurn"
            );


        const monthlySavingElement =
            document.getElementById(
                "simulationMonthlySaving"
            );


        const annualSavingElement =
            document.getElementById(
                "simulationAnnualSaving"
            );


        const subscriptions =
            getSubscriptionsSafe();


        const currentBurn =
            getMonthlyBurn(
                subscriptions
            );


        const monthly =
            getMonthlyValue(
                subscription
            );


        const simulatedBurn =
            Math.max(
                0,
                currentBurn -
                monthly
            );


        if (
            subscriptionBox
        ) {

            subscriptionBox.innerHTML = `

                <div class="simulation-subscription-name">

                    ${escapeHTML(
                        subscription.name ||
                        "Subscription"
                    )}

                </div>


                <div class="simulation-subscription-meta">

                    ${escapeHTML(
                        subscription.category ||
                        "Other"
                    )}

                    ·

                    ${escapeHTML(
                        subscription.billingCycle ||
                        "Monthly"
                    )}

                    ·

                    ${formatMoney(
                        subscription.amount
                    )}

                </div>

            `;
        }


        if (
            currentBurnElement
        ) {

            currentBurnElement.textContent =
                formatMoney(
                    currentBurn
                );
        }


        if (
            newBurnElement
        ) {

            newBurnElement.textContent =
                formatMoney(
                    simulatedBurn
                );
        }


        if (
            monthlySavingElement
        ) {

            monthlySavingElement.textContent =
                formatMoney(
                    monthly
                );
        }


        if (
            annualSavingElement
        ) {

            annualSavingElement.textContent =
                formatMoney(
                    monthly * 12
                );
        }


        /*
         * Force modal to viewport.
         */

        modal.style.position =
            "fixed";


        modal.style.top =
            "0";


        modal.style.left =
            "0";


        modal.style.right =
            "0";


        modal.style.bottom =
            "0";


        modal.style.width =
            "100vw";


        modal.style.height =
            "100vh";


        modal.style.zIndex =
            "999999";


        modal.style.display =
            "flex";


        modal.style.alignItems =
            "center";


        modal.style.justifyContent =
            "center";


        modal.style.visibility =
            "visible";


        modal.style.opacity =
            "1";


        modal.classList.add(
            "open"
        );


        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.classList.add(
            "simulation-open"
        );


        document.body.style.overflow =
            "hidden";


        /*
         * Put keyboard focus on close button.
         */

        const closeButton =
            modal.querySelector(
                "#closeActionModal"
            );


        if (
            closeButton
        ) {

            setTimeout(
                function () {

                    closeButton.focus();

                },
                50
            );
        }
    }


    /* =====================================================
       CLOSE SIMULATION
       ===================================================== */

    function closeSimulation() {

        const modal =
            document.getElementById(
                "actionSimulationModal"
            );


        if (
            !modal
        ) {

            return;
        }


        modal.classList.remove(
            "open"
        );


        modal.setAttribute(
            "aria-hidden",
            "true"
        );


        modal.style.display =
            "none";


        modal.style.visibility =
            "hidden";


        modal.style.opacity =
            "0";


        document.body.classList.remove(
            "simulation-open"
        );


        document.body.style.overflow =
            "";


        selectedSubscription =
            null;
    }


    /* =====================================================
       CANCEL SUBSCRIPTION
       ===================================================== */

    function cancelSelectedSubscription() {

        if (
            !selectedSubscription
        ) {

            return;
        }


        const subscriptionName =
            selectedSubscription.name ||
            "this subscription";


        const monthly =
            getMonthlyValue(
                selectedSubscription
            );


        const annual =
            monthly * 12;


        const confirmed =
            window.confirm(

                `Cancel ${
                    subscriptionName
                }?\n\n` +

                `This will remove the subscription from your SubSentry ledger.\n\n` +

                `Potential saving: ${
                    formatMoney(
                        annual
                    )
                } per year.`

            );


        if (
            !confirmed
        ) {

            return;
        }


        const subscriptions =
            getSubscriptionsSafe();


        const index =
            subscriptions.findIndex(
                function (
                    subscription
                ) {

                    return (
                        String(
                            subscription.id
                        ) ===
                        String(
                            selectedSubscription.id
                        )
                    );

                }
            );


        if (
            index === -1
        ) {

            closeSimulation();


            if (
                typeof showToast ===
                "function"
            ) {

                showToast(
                    "That subscription could not be found in your current ledger.",
                    "error",
                    "Subscription Not Found"
                );
            }


            return;
        }


        subscriptions.splice(
            index,
            1
        );


        /*
         * IMPORTANT:
         *
         * This uses your existing SubSentry
         * user-specific saveSubscriptions()
         * function.
         */

        const saved =
            saveSubscriptionsSafe(
                subscriptions
            );


        if (
            !saved
        ) {

            if (
                typeof showToast ===
                "function"
            ) {

                showToast(
                    "The subscription could not be saved.",
                    "error",
                    "Update Failed"
                );
            }


            return;
        }


        closeSimulation();


        /*
         * Refresh existing dashboard.
         */

        if (
            typeof renderDashboard ===
            "function"
        ) {

            renderDashboard();
        }


        if (
            typeof renderSubscriptions ===
            "function"
        ) {

            renderSubscriptions();
        }


        /*
         * Refresh Action Center.
         */

        renderActionCenter();


        if (
            typeof showToast ===
            "function"
        ) {

            showToast(
                `${
                    subscriptionName
                } was removed from your subscription ledger.`,
                "success",
                "Subscription Cancelled"
            );
        }
    }


    /* =====================================================
       ESCAPE KEY
       ===================================================== */

    function setupKeyboard() {

        document.addEventListener(
            "keydown",
            function (
                event
            ) {

                if (
                    event.key ===
                    "Escape"
                ) {

                    const modal =
                        document.getElementById(
                            "actionSimulationModal"
                        );


                    if (
                        modal &&
                        modal.classList.contains(
                            "open"
                        )
                    ) {

                        closeSimulation();
                    }
                }
            }
        );
    }


    /* =====================================================
       INITIALIZE
       ===================================================== */

    function initialize() {

        if (
            initialized
        ) {

            return;
        }


        initialized =
            true;


        setupActionCenterClicks();


        setupKeyboard();


        /*
         * Bind the EXISTING modal immediately.
         */

        const modal =
            document.getElementById(
                "actionSimulationModal"
            );


        if (
            modal
        ) {

            setupSimulationEvents(
                modal
            );


            /*
             * Make sure it starts hidden.
             */

            modal.classList.remove(
                "open"
            );


            modal.setAttribute(
                "aria-hidden",
                "true"
            );


            modal.style.display =
                "none";


            modal.style.visibility =
                "hidden";


            modal.style.opacity =
                "0";
        }


        renderActionCenter();


        /*
         * Refresh after the main script has
         * finished initializing the user.
         */

        setTimeout(
            renderActionCenter,
            200
        );


        setTimeout(
            renderActionCenter,
            600
        );


        setTimeout(
            renderActionCenter,
            1200
        );
    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.refreshActionCenter =
        renderActionCenter;


    window.openSubSentrySimulation =
        openSimulation;


    window.closeSubSentrySimulation =
        closeSimulation;


    /* =====================================================
       START
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    } else {

        initialize();
    }

})();