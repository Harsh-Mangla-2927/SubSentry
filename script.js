"use strict";

/* =========================================================
   SUBSENTRY
   Subscription Intelligence & Recurring Spend Audit Platform
   ========================================================= */


/* =========================================================
   STORAGE KEYS
   ========================================================= */

const USERS_KEY = "subSentryUsers";
const CURRENT_USER_KEY = "subSentryCurrentUser";
const THEME_KEY = "subSentryTheme";


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let currentUser = null;
let editingSubscriptionId = null;
let loginFailedAttempts = 0;


/* =========================================================
   DOM HELPER
   ========================================================= */

const $ = (id) => document.getElementById(id);


/* =========================================================
   BASIC UI HELPERS
   ========================================================= */

function showElement(element) {
    if (element) {
        element.classList.remove("hidden");
    }
}

function hideElement(element) {
    if (element) {
        element.classList.add("hidden");
    }
}

function delay(milliseconds) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

function getTodayISO() {
    const date = new Date();

    const offset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - offset)
        .toISOString()
        .split("T")[0];
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   USER STORAGE
   ========================================================= */

function getUsers() {
    try {
        return JSON.parse(
            localStorage.getItem(USERS_KEY)
        ) || [];
    } catch (error) {
        console.error(
            "Unable to read users:",
            error
        );

        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(
        USERS_KEY,
        JSON.stringify(users)
    );
}

function getCurrentUser() {
    try {
        return JSON.parse(
            localStorage.getItem(
                CURRENT_USER_KEY
            )
        );
    } catch (error) {
        return null;
    }
}

function saveCurrentUser(user) {
    currentUser = user;

    localStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify(user)
    );
}

function clearCurrentUser() {
    currentUser = null;

    localStorage.removeItem(
        CURRENT_USER_KEY
    );
}


/* =========================================================
   USER NORMALIZATION
   ========================================================= */

function normalizeUser(user) {
    if (!user || typeof user !== "object") {
        return null;
    }

    const normalized = {
        ...user
    };

    if (!normalized.id) {
        normalized.id =
            normalized.userId ||
            normalized.email ||
            `user_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 8)}`;
    }

    if (!normalized.name) {
        normalized.name =
            normalized.fullName ||
            normalized.username ||
            normalized.email?.split("@")[0] ||
            "User";
    }

    if (
        !normalized.email &&
        normalized.username?.includes("@")
    ) {
        normalized.email =
            normalized.username;
    }

    return normalized;
}

function migrateUsersIfNecessary() {
    const users = getUsers();

    if (!Array.isArray(users)) {
        saveUsers([]);
    }
}

function migrateCurrentUserIfNecessary() {
    const storedUser = getCurrentUser();

    if (!storedUser) {
        return null;
    }

    const normalized =
        normalizeUser(storedUser);

    if (!normalized) {
        clearCurrentUser();

        return null;
    }

    saveCurrentUser(normalized);

    return normalized;
}


/* =========================================================
   USER-SPECIFIC STORAGE
   ========================================================= */

function getUserId(user = currentUser) {
    if (!user) {
        return null;
    }

    return (
        user.id ||
        user.userId ||
        user.email ||
        user.username ||
        null
    );
}

function getSubscriptionKey(
    user = currentUser
) {
    const id = getUserId(user);

    return id
        ? `subscriptions_${id}`
        : null;
}

function getBudgetKey(user = currentUser) {
    const id = getUserId(user);

    return id
        ? `budget_${id}`
        : null;
}

function getSubscriptions() {
    const key =
        getSubscriptionKey();

    if (!key) {
        return [];
    }

    try {
        const data =
            JSON.parse(
                localStorage.getItem(key)
            );

        return Array.isArray(data)
            ? data
            : [];
    } catch (error) {
        return [];
    }
}

function saveSubscriptions(
    subscriptions
) {
    const key =
        getSubscriptionKey();

    if (!key) {
        return;
    }

    localStorage.setItem(
        key,
        JSON.stringify(subscriptions)
    );
}

function getBudget() {
    const key =
        getBudgetKey();

    if (!key) {
        return {
            monthlyIncome: 0,
            otherExpenses: 0
        };
    }

    try {
        const data =
            JSON.parse(
                localStorage.getItem(key)
            );

        return {
            monthlyIncome:
                Number(
                    data?.monthlyIncome
                ) || 0,

            otherExpenses:
                Number(
                    data?.otherExpenses
                ) || 0
        };
    } catch (error) {
        return {
            monthlyIncome: 0,
            otherExpenses: 0
        };
    }
}

function saveBudget(budget) {
    const key =
        getBudgetKey();

    if (!key) {
        return;
    }

    localStorage.setItem(
        key,
        JSON.stringify(budget)
    );
}


/* =========================================================
   THEME
   ========================================================= */

function getSavedTheme() {
    const saved =
        localStorage.getItem(
            THEME_KEY
        );

    if (
        saved === "dark" ||
        saved === "light"
    ) {
        return saved;
    }

    if (
        window.matchMedia &&
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches
    ) {
        return "dark";
    }

    return "light";
}

function applyTheme(theme) {
    const dark =
        theme === "dark";

    document.body.classList.toggle(
        "dark-mode",
        dark
    );

    localStorage.setItem(
        THEME_KEY,
        dark
            ? "dark"
            : "light"
    );

    updateThemeControls(dark);
}

function updateThemeControls(
    isDark
) {
    const icon =
        isDark ? "☾" : "☀";

    const label =
        isDark ? "Dark" : "Light";

    if ($("themeIcon")) {
        $("themeIcon").textContent =
            icon;
    }

    if ($("themeLabel")) {
        $("themeLabel").textContent =
            label;
    }

    if ($("dashboardThemeIcon")) {
        $("dashboardThemeIcon")
            .textContent = icon;
    }

    if ($("dashboardThemeLabel")) {
        $("dashboardThemeLabel")
            .textContent = label;
    }

    const landingToggle =
        $("themeToggle");

    const dashboardToggle =
        $("dashboardThemeToggle");

    if (landingToggle) {
        landingToggle.setAttribute(
            "aria-label",
            isDark
                ? "Switch to light mode"
                : "Switch to dark mode"
        );
    }

    if (dashboardToggle) {
        dashboardToggle.setAttribute(
            "aria-label",
            isDark
                ? "Switch to light mode"
                : "Switch to dark mode"
        );
    }
}

function toggleTheme() {
    const nextTheme =
        document.body.classList.contains(
            "dark-mode"
        )
            ? "light"
            : "dark";

    applyTheme(nextTheme);

    showToast(
        nextTheme === "dark"
            ? "Dark mode enabled"
            : "Light mode enabled",
        "success"
    );
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    message,
    type = "info",
    title = ""
) {
    const container =
        $("toastContainer");

    if (!container) {
        return;
    }

    const toast =
        document.createElement("div");

    toast.className =
        `toast ${type}`;

    let icon = "ⓘ";

    if (type === "success") {
        icon = "✓";
    } else if (type === "error") {
        icon = "!";
    }

    const heading =
        title ||
        (
            type === "success"
                ? "Success"
                : type === "error"
                    ? "Something went wrong"
                    : "SubSentry"
        );

    toast.innerHTML = `
        <div class="toast-icon">
            ${icon}
        </div>

        <div>
            <strong>
                ${escapeHTML(heading)}
            </strong>

            <p>
                ${escapeHTML(message)}
            </p>
        </div>
    `;

    container.appendChild(toast);

    const timeout =
        setTimeout(() => {
            toast.classList.add(
                "removing"
            );

            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3200);

    toast.addEventListener(
        "click",
        () => {
            clearTimeout(timeout);

            toast.classList.add(
                "removing"
            );

            setTimeout(() => {
                toast.remove();
            }, 300);
        }
    );
}


/* =========================================================
   PASSWORD VALIDATION
   ========================================================= */

function getPasswordRules(
    password
) {
    return {
        length:
            password.length >= 8,

        upper:
            /[A-Z]/.test(password),

        lower:
            /[a-z]/.test(password),

        number:
            /\d/.test(password),

        special:
            /[^A-Za-z0-9]/.test(
                password
            )
    };
}

function isStrongPassword(
    password
) {
    const rules =
        getPasswordRules(
            password
        );

    return (
        rules.length &&
        rules.upper &&
        rules.lower &&
        rules.number &&
        rules.special
    );
}

function getPasswordScore(
    password
) {
    const rules =
        getPasswordRules(
            password
        );

    return Object.values(
        rules
    ).filter(Boolean).length;
}

function updatePasswordStrength() {
    const input =
        $("registerPassword");

    if (!input) {
        return;
    }

    const password =
        input.value;

    const rules =
        getPasswordRules(
            password
        );

    const score =
        getPasswordScore(
            password
        );

    const bar =
        $("strengthBar");

    const label =
        $("strengthLabel");

    const ruleMap = {
        length:
            $("ruleLength"),

        upper:
            $("ruleUpper"),

        lower:
            $("ruleLower"),

        number:
            $("ruleNumber"),

        special:
            $("ruleSpecial")
    };

    Object.entries(
        ruleMap
    ).forEach(
        ([key, element]) => {
            if (!element) {
                return;
            }

            const valid =
                rules[key];

            element.classList.toggle(
                "valid",
                valid
            );

            const span =
                element.querySelector(
                    "span"
                );

            if (span) {
                span.textContent =
                    valid
                        ? "✓"
                        : "○";
            }
        }
    );

    if (!bar || !label) {
        return;
    }

    const percentage =
        (score / 5) * 100;

    bar.style.width =
        `${percentage}%`;

    if (!password) {
        label.textContent =
            "Weak";

        bar.style.background =
            "var(--danger)";

        return;
    }

    if (score <= 2) {
        label.textContent =
            "Weak";

        bar.style.background =
            "var(--danger)";
    } else if (score <= 4) {
        label.textContent =
            "Medium";

        bar.style.background =
            "var(--warning)";
    } else {
        label.textContent =
            "Strong";

        bar.style.background =
            "var(--success)";
    }
}

function togglePasswordVisibility(
    inputId,
    buttonId
) {
    const input =
        $(inputId);

    const button =
        $(buttonId);

    if (!input || !button) {
        return;
    }

    const showing =
        input.type === "text";

    input.type =
        showing
            ? "password"
            : "text";

    button.textContent =
        showing
            ? "Show"
            : "Hide";
}


/* =========================================================
   VALIDATION HELPERS
   ========================================================= */

function setError(
    id,
    message
) {
    const element =
        $(id);

    if (element) {
        element.textContent =
            message || "";
    }
}

function clearAuthErrors() {
    [
        "loginEmailError",
        "loginPasswordError",
        "registerNameError",
        "registerEmailError",
        "registerPasswordError",
        "confirmPasswordError"
    ].forEach(
        (id) => setError(id, "")
    );
}

function setAuthMessage(
    id,
    message,
    type = ""
) {
    const element =
        $(id);

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.className =
        `auth-message ${type}`.trim();
}

function validateEmail(
    email
) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);
}


/* =========================================================
   LOGIN ERROR ANIMATION
   ========================================================= */

function shakeLoginPassword() {
    const passwordField =
        $("loginPassword");

    if (!passwordField) {
        return;
    }

    /*
       Remove the class first so the animation can
       reliably run again on every failed attempt.
    */

    passwordField.classList.remove(
        "login-error-shake"
    );

    /*
       Force browser reflow so the animation restarts.
    */

    void passwordField.offsetWidth;

    passwordField.classList.add(
        "login-error-shake"
    );

    setTimeout(() => {
        passwordField.classList.remove(
            "login-error-shake"
        );
    }, 500);
}


/* =========================================================
   ROUTING
   ========================================================= */

function getRoute() {
    const hash =
        window.location.hash
            .replace("#", "")
            .toLowerCase();

    if (
        hash === "dashboard" ||
        hash === "home" ||
        hash === "login" ||
        hash === "register"
    ) {
        return hash;
    }

    return "landing";
}

function setRoute(
    route,
    replace = false
) {
    const target =
        `#${route}`;

    if (replace) {
        history.replaceState(
            null,
            "",
            target
        );

        handleRoute();

        return;
    }

    if (
        window.location.hash !==
        target
    ) {
        window.location.hash =
            route;
    } else {
        handleRoute();
    }
}

function hideAllViews() {
    hideElement(
        $("landingView")
    );

    hideElement(
        $("authView")
    );

    hideElement(
        $("dashboardView")
    );
}

function showLanding() {
    hideAllViews();

    showElement(
        $("landingView")
    );

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function showAuth(
    mode = "login"
) {
    hideAllViews();

    showElement(
        $("authView")
    );

    switchAuthMode(
        mode,
        false
    );

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function showDashboard() {
    if (!currentUser) {
        setRoute("login");

        return;
    }

    hideAllViews();

    showElement(
        $("dashboardView")
    );

    updateDashboardUser();

    renderDashboard();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function handleRoute() {
    const route =
        getRoute();

    if (route === "dashboard") {
        if (currentUser) {
            showDashboard();
        } else {
            setRoute(
                "login",
                true
            );
        }

        return;
    }

    if (route === "login") {
        showAuth("login");

        return;
    }

    if (route === "register") {
        showAuth("register");

        return;
    }

    showLanding();
}


/* =========================================================
   AUTH MODE
   ========================================================= */

function switchAuthMode(
    mode,
    updateRoute = true
) {
    const loginPanel =
        $("loginPanel");

    const registerPanel =
        $("registerPanel");

    const loginPoints =
        $("loginVisualPoints");

    const registerPoints =
        $("registerVisualPoints");

    const visualTitle =
        $("authVisualTitle");

    const visualText =
        $("authVisualText");

    if (mode === "register") {
        hideElement(loginPanel);

        showElement(registerPanel);

        hideElement(loginPoints);

        showElement(registerPoints);

        if (visualTitle) {
            visualTitle.textContent =
                "Build a smarter view of your subscriptions.";
        }

        if (visualText) {
            visualText.textContent =
                "Create your personal SubSentry workspace and start turning recurring payments into useful spending intelligence.";
        }

        clearAuthErrors();

        setAuthMessage(
            "loginMessage",
            ""
        );

        setAuthMessage(
            "registerMessage",
            ""
        );

        if (updateRoute) {
            setRoute("register");
        }

        return;
    }

    showElement(loginPanel);

    hideElement(registerPanel);

    showElement(loginPoints);

    hideElement(registerPoints);

    if (visualTitle) {
        visualTitle.textContent =
            "Take control of recurring spending.";
    }

    if (visualText) {
        visualText.textContent =
            "See every recurring charge, identify unnecessary overlaps and understand your monthly subscription burn.";
    }

    clearAuthErrors();

    setAuthMessage(
        "loginMessage",
        ""
    );

    setAuthMessage(
        "registerMessage",
        ""
    );

    if (updateRoute) {
        setRoute("login");
    }
}


/* =========================================================
   LOGIN
   ========================================================= */

async function handleLogin(
    event
) {
    event.preventDefault();

    clearAuthErrors();

    setAuthMessage(
        "loginMessage",
        ""
    );

    const email =
        $("loginEmail")
            ?.value
            .trim()
            .toLowerCase() || "";

    const password =
        $("loginPassword")
            ?.value || "";

    let valid = true;

    if (!email) {
        setError(
            "loginEmailError",
            "Email is required."
        );

        valid = false;
    } else if (
        !validateEmail(email)
    ) {
        setError(
            "loginEmailError",
            "Enter a valid email address."
        );

        valid = false;
    }

    if (!password) {
        setError(
            "loginPasswordError",
            "Password is required."
        );

        valid = false;
    }

    if (!valid) {
        return;
    }

    const users =
        getUsers();

    const user =
        users.find(
            (item) => {
                const storedEmail =
                    String(
                        item.email ||
                        item.username ||
                        ""
                    ).toLowerCase();

                return (
                    storedEmail ===
                    email
                );
            }
        );

    if (!user) {
        loginFailedAttempts++;

        setAuthMessage(
            "loginMessage",
            "No account was found with this email address.",
            "error"
        );

        if (
            loginFailedAttempts >= 2
        ) {
            shakeLoginPassword();

            showToast(
                "We still can't find an account with that email address.",
                "error",
                "Login unsuccessful"
            );
        }

        return;
    }

    /*
       Existing accounts are checked using their
       stored password exactly as before.

       This keeps old login credentials working.
    */

    if (
        String(user.password || "") !==
        password
    ) {
        loginFailedAttempts++;

        const isSecondAttempt =
            loginFailedAttempts >= 2;

        setAuthMessage(
            "loginMessage",
            isSecondAttempt
                ? "Wrong password again. Please check your password."
                : "Incorrect password. Please try again.",
            "error"
        );

        /*
           Shake the password field on every
           incorrect password attempt.
        */

        shakeLoginPassword();

        /*
           On the second and later failed attempts,
           also show a prominent toast.
        */

        if (isSecondAttempt) {
            showToast(
                "Wrong password again. Please check your password and try again.",
                "error",
                "Incorrect password"
            );
        }

        return;
    }

    /*
       Correct password:
       reset the failed-attempt counter.
    */

    loginFailedAttempts = 0;

    const normalizedUser =
        normalizeUser(user);

    const updatedUsers =
        users.map(
            (item) => {
                const itemEmail =
                    String(
                        item.email ||
                        item.username ||
                        ""
                    ).toLowerCase();

                return itemEmail === email
                    ? normalizedUser
                    : item;
            }
        );

    saveUsers(
        updatedUsers
    );

    saveCurrentUser(
        normalizedUser
    );

    const button =
        $("loginSubmitButton");

    if (button) {
        button.disabled = true;

        button.innerHTML = `
            <span class="button-loader"></span>
            Signing in...
        `;
    }

    await delay(500);

    showToast(
        `Welcome back, ${
            normalizedUser.name ||
            "User"
        }.`,
        "success",
        "Login successful"
    );

    await delay(650);

    if (button) {
        button.disabled = false;

        button.textContent =
            "Log In";
    }

    setRoute(
        "dashboard"
    );
}


/* =========================================================
   REGISTER
   ========================================================= */

async function handleRegister(
    event
) {
    event.preventDefault();

    clearAuthErrors();

    setAuthMessage(
        "registerMessage",
        ""
    );

    const name =
        $("registerName")
            ?.value
            .trim() || "";

    const email =
        $("registerEmail")
            ?.value
            .trim()
            .toLowerCase() || "";

    const password =
        $("registerPassword")
            ?.value || "";

    const confirmPassword =
        $("confirmPassword")
            ?.value || "";

    let valid = true;

    if (!name) {
        setError(
            "registerNameError",
            "Please enter your name."
        );

        valid = false;
    } else if (
        name.length < 2
    ) {
        setError(
            "registerNameError",
            "Name must contain at least 2 characters."
        );

        valid = false;
    }

    if (!email) {
        setError(
            "registerEmailError",
            "Email is required."
        );

        valid = false;
    } else if (
        !validateEmail(email)
    ) {
        setError(
            "registerEmailError",
            "Enter a valid email address."
        );

        valid = false;
    }

    if (!password) {
        setError(
            "registerPasswordError",
            "Password is required."
        );

        valid = false;
    } else if (
        !isStrongPassword(password)
    ) {
        setError(
            "registerPasswordError",
            "Use 8+ characters with uppercase, lowercase, number and special character."
        );

        valid = false;
    }

    if (!confirmPassword) {
        setError(
            "confirmPasswordError",
            "Please confirm your password."
        );

        valid = false;
    } else if (
        password !==
        confirmPassword
    ) {
        setError(
            "confirmPasswordError",
            "Passwords do not match."
        );

        valid = false;
    }

    if (!valid) {
        return;
    }

    const users =
        getUsers();

    const existingUser =
        users.find(
            (item) => {
                const storedEmail =
                    String(
                        item.email ||
                        item.username ||
                        ""
                    ).toLowerCase();

                return (
                    storedEmail ===
                    email
                );
            }
        );

    if (existingUser) {
        setError(
            "registerEmailError",
            "An account with this email already exists."
        );

        setAuthMessage(
            "registerMessage",
            "Please log in instead.",
            "error"
        );

        return;
    }

    const newUser = {
        id:
            `user_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 8)}`,

        name,
        email,
        password,

        createdAt:
            new Date().toISOString()
    };

    users.push(
        newUser
    );

    saveUsers(
        users
    );

    saveCurrentUser(
        newUser
    );

    saveSubscriptions([]);

    saveBudget({
        monthlyIncome: 0,
        otherExpenses: 0
    });

    const button =
        $("registerSubmitButton");

    if (button) {
        button.disabled = true;

        button.innerHTML = `
            <span class="button-loader"></span>
            Creating account...
        `;
    }

    await delay(600);

    showToast(
        `Welcome to SubSentry, ${name}.`,
        "success",
        "Account created"
    );

    await delay(700);

    if (button) {
        button.disabled = false;

        button.textContent =
            "Create Account";
    }

    setRoute(
        "dashboard"
    );
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {
    const confirmed =
        window.confirm(
            "Are you sure you want to log out of SubSentry?"
        );

    if (!confirmed) {
        return;
    }

    clearCurrentUser();
    clearLoginForm();

    editingSubscriptionId = null;

    loginFailedAttempts = 0;

    showToast(
        "You have been securely logged out.",
        "success",
        "Logged out"
    );

    setTimeout(() => {
        setRoute(
            "landing"
        );
    }, 500);
}


/* =========================================================
   DASHBOARD USER
   ========================================================= */

function updateDashboardUser() {
    const element =
        $("welcomeUser");

    if (!element ||
        !currentUser) {
        return;
    }

    const name =
        currentUser.name ||
        currentUser.fullName ||
        currentUser.email?.split("@")[0] ||
        "User";

    element.textContent =
        `Welcome, ${name}`;
}


/* =========================================================
   SUBSCRIPTION CALCULATIONS
   ========================================================= */

function normalizeMonthlyAmount(
    amount,
    cycle
) {
    const value =
        Number(amount) || 0;

    switch (
        String(cycle)
            .toLowerCase()
    ) {
        case "weekly":
            return (
                value * 52
            ) / 12;

        case "yearly":
            return value / 12;

        case "monthly":
        default:
            return value;
    }
}

function formatCurrency(
    value
) {
    const number =
        Number(value) || 0;

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }
    ).format(number);
}

function formatDate(
    date
) {
    if (!date) {
        return "No date";
    }

    const parsed =
        new Date(date);

    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return date;
    }

    return parsed.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================================================
   SUBSCRIPTION FORM
   ========================================================= */

function handleSubscriptionSubmit(
    event
) {
    event.preventDefault();

    const name =
        $("subscriptionName")
            ?.value
            .trim() || "";

    const amount =
        Number(
            $("amount")?.value
        ) || 0;

    const billingCycle =
        $("billingCycle")
            ?.value ||
        "monthly";

    const category =
        $("category")
            ?.value ||
        "Other";

    const startDate =
        $("startDate")
            ?.value ||
        "";

    setError(
        "nameError",
        ""
    );

    setError(
        "amountError",
        ""
    );

    setError(
        "dateError",
        ""
    );

    let valid = true;

    if (!name) {
        setError(
            "nameError",
            "Service name is required."
        );

        valid = false;
    }

    if (amount <= 0) {
        setError(
            "amountError",
            "Enter an amount greater than 0."
        );

        valid = false;
    }

    if (!startDate) {
        setError(
            "dateError",
            "Start date is required."
        );

        valid = false;
    }

    if (!valid) {
        return;
    }

    const subscriptions =
        getSubscriptions();

    if (editingSubscriptionId) {
        const index =
            subscriptions.findIndex(
                (item) =>
                    item.id ===
                    editingSubscriptionId
            );

        if (index !== -1) {
            subscriptions[index] = {
                ...subscriptions[index],

                name,
                amount,
                billingCycle,
                category,
                startDate,

                updatedAt:
                    new Date().toISOString()
            };

            saveSubscriptions(
                subscriptions
            );

            showToast(
                `${name} has been updated.`,
                "success",
                "Subscription updated"
            );
        }
    } else {
        subscriptions.push({
            id:
                `sub_${Date.now()}_${Math.random()
                    .toString(36)
                    .slice(2, 8)}`,

            name,
            amount,
            billingCycle,
            category,
            startDate,

            createdAt:
                new Date().toISOString()
        });

        saveSubscriptions(
            subscriptions
        );

        showToast(
            `${name} was added to your ledger.`,
            "success",
            "Subscription added"
        );
    }

    resetSubscriptionForm();

    renderDashboard();
}

function editSubscription(
    id
) {
    const subscriptions =
        getSubscriptions();

    const subscription =
        subscriptions.find(
            (item) =>
                item.id === id
        );

    if (!subscription) {
        return;
    }

    editingSubscriptionId =
        id;

    if ($("subscriptionName")) {
        $("subscriptionName").value =
            subscription.name || "";
    }

    if ($("amount")) {
        $("amount").value =
            subscription.amount || "";
    }

    if ($("billingCycle")) {
        $("billingCycle").value =
            subscription.billingCycle ||
            "monthly";
    }

    if ($("category")) {
        $("category").value =
            subscription.category ||
            "Other";
    }

    if ($("startDate")) {
        $("startDate").value =
            subscription.startDate ||
            "";
    }

    if ($("subscriptionFormTitle")) {
        $("subscriptionFormTitle")
            .textContent =
            "Edit Subscription";
    }

    if ($("subscriptionSubmitButton")) {
        $("subscriptionSubmitButton")
            .textContent =
            "Save Changes";
    }

    showElement(
        $("cancelEditButton")
    );

    $("subscriptionForm")
        ?.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
}

function deleteSubscription(
    id
) {
    const subscriptions =
        getSubscriptions();

    const subscription =
        subscriptions.find(
            (item) =>
                item.id === id
        );

    if (!subscription) {
        return;
    }

    const confirmed =
        window.confirm(
            `Delete "${subscription.name}" from your subscription ledger?`
        );

    if (!confirmed) {
        return;
    }

    const updated =
        subscriptions.filter(
            (item) =>
                item.id !== id
        );

    saveSubscriptions(
        updated
    );

    if (
        editingSubscriptionId === id
    ) {
        resetSubscriptionForm();
    }

    renderDashboard();

    showToast(
        `${subscription.name} was removed.`,
        "success",
        "Subscription deleted"
    );
}

function resetSubscriptionForm() {
    editingSubscriptionId =
        null;

    $("subscriptionForm")
        ?.reset();

    if ($("billingCycle")) {
        $("billingCycle").value =
            "monthly";
    }

    if ($("category")) {
        $("category").value =
            "Entertainment";
    }

    if ($("startDate")) {
        $("startDate").value =
            getTodayISO();
    }

    if ($("subscriptionFormTitle")) {
        $("subscriptionFormTitle")
            .textContent =
            "Add Subscription";
    }

    if ($("subscriptionSubmitButton")) {
        $("subscriptionSubmitButton")
            .textContent =
            "+ Add Subscription";
    }

    hideElement(
        $("cancelEditButton")
    );

    setError(
        "nameError",
        ""
    );

    setError(
        "amountError",
        ""
    );

    setError(
        "dateError",
        ""
    );
}


/* =========================================================
   SEARCH / FILTER
   ========================================================= */

function getFilteredSubscriptions() {
    const subscriptions =
        getSubscriptions();

    const search =
        $("searchInput")
            ?.value
            .trim()
            .toLowerCase() ||
        "";

    const category =
        $("categoryFilter")
            ?.value ||
        "all";

    return subscriptions.filter(
        (subscription) => {
            const matchesSearch =
                !search ||
                String(
                    subscription.name ||
                    ""
                )
                    .toLowerCase()
                    .includes(search) ||
                String(
                    subscription.category ||
                    ""
                )
                    .toLowerCase()
                    .includes(search);

            const matchesCategory =
                category === "all" ||
                subscription.category ===
                    category;

            return (
                matchesSearch &&
                matchesCategory
            );
        }
    );
}


/* =========================================================
   RENDER SUBSCRIPTIONS
   ========================================================= */

function renderSubscriptions() {
    const container =
        $("subscriptionList");

    if (!container) {
        return;
    }

    const subscriptions =
        getFilteredSubscriptions();

    if (!subscriptions.length) {
        container.innerHTML = `
            <div class="empty-state">
                <span>💳</span>

                <h3>
                    No subscriptions found
                </h3>

                <p>
                    Add a subscription or
                    change your search/filter.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        subscriptions
            .map(
                (subscription) => {
                    const monthly =
                        normalizeMonthlyAmount(
                            subscription.amount,
                            subscription.billingCycle
                        );

                    const cycle =
                        String(
                            subscription.billingCycle ||
                            "monthly"
                        );

                    const formattedCycle =
                        cycle.charAt(0)
                            .toUpperCase() +
                        cycle.slice(1);

                    return `
                        <article
                            class="subscription-item"
                        >
                            <div
                                class="subscription-info"
                            >
                                <div
                                    class="subscription-title"
                                >
                                    ${escapeHTML(
                                        subscription.name
                                    )}
                                </div>

                                <div
                                    class="subscription-meta"
                                >
                                    ${escapeHTML(
                                        subscription.category ||
                                        "Other"
                                    )}

                                    ·

                                    ${escapeHTML(
                                        formattedCycle
                                    )}

                                    · Started

                                    ${escapeHTML(
                                        formatDate(
                                            subscription.startDate
                                        )
                                    )}
                                </div>
                            </div>

                            <div
                                class="subscription-cost"
                            >
                                <strong>
                                    ${formatCurrency(
                                        monthly
                                    )}
                                </strong>

                                <small>
                                    normalized / month
                                </small>
                            </div>

                            <div
                                class="subscription-actions"
                            >
                                <button
                                    type="button"
                                    data-action="edit"
                                    data-id="${escapeHTML(
                                        subscription.id
                                    )}"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    data-action="delete"
                                    data-id="${escapeHTML(
                                        subscription.id
                                    )}"
                                >
                                    Delete
                                </button>
                            </div>
                        </article>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   CATEGORY BREAKDOWN
   ========================================================= */

function calculateCategoryTotals(
    subscriptions
) {
    const totals = {};

    subscriptions.forEach(
        (subscription) => {
            const category =
                subscription.category ||
                "Other";

            const monthly =
                normalizeMonthlyAmount(
                    subscription.amount,
                    subscription.billingCycle
                );

            totals[category] =
                (totals[category] || 0) +
                monthly;
        }
    );

    return totals;
}

function renderCategoryBreakdown() {
    const container =
        $("categoryBreakdown");

    if (!container) {
        return;
    }

    const subscriptions =
        getSubscriptions();

    if (!subscriptions.length) {
        container.innerHTML = `
            <div class="empty-state">
                <span>📊</span>

                <p>
                    Add subscriptions to see
                    your spending analysis.
                </p>
            </div>
        `;

        return;
    }

    const totals =
        calculateCategoryTotals(
            subscriptions
        );

    const entries =
        Object.entries(totals)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            );

    const max =
        entries.length
            ? Math.max(
                ...entries.map(
                    ([, value]) =>
                        value
                )
            )
            : 1;

    container.innerHTML =
        entries
            .map(
                ([category, value]) => {
                    const percentage =
                        max > 0
                            ? (value / max) *
                              100
                            : 0;

                    return `
                        <div
                            class="category-item"
                        >
                            <div
                                class="category-header"
                            >
                                <span
                                    class="category-name"
                                >
                                    ${escapeHTML(
                                        category
                                    )}
                                </span>

                                <span
                                    class="category-value"
                                >
                                    ${formatCurrency(
                                        value
                                    )}
                                </span>
                            </div>

                            <div
                                class="category-bar"
                            >
                                <div
                                    class="category-bar-fill"
                                    style="width:${percentage}%"
                                ></div>
                            </div>
                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   OVERLAP DETECTION
   ========================================================= */

function detectOverlaps() {
    const subscriptions =
        getSubscriptions();

    const overlaps = [];

    const groups = {};

    subscriptions.forEach(
        (subscription) => {
            const category =
                subscription.category ||
                "Other";

            if (!groups[category]) {
                groups[category] = [];
            }

            groups[category].push(
                subscription
            );
        }
    );

    Object.entries(
        groups
    ).forEach(
        ([category, items]) => {
            if (items.length < 2) {
                return;
            }

            for (
                let i = 0;
                i < items.length;
                i++
            ) {
                for (
                    let j = i + 1;
                    j < items.length;
                    j++
                ) {
                    const first =
                        items[i];

                    const second =
                        items[j];

                    const firstMonthly =
                        normalizeMonthlyAmount(
                            first.amount,
                            first.billingCycle
                        );

                    const secondMonthly =
                        normalizeMonthlyAmount(
                            second.amount,
                            second.billingCycle
                        );

                    overlaps.push({
                        category,
                        first,
                        second,
                        combined:
                            firstMonthly +
                            secondMonthly
                    });
                }
            }
        }
    );

    return overlaps;
}

function renderOverlaps() {
    const container =
        $("overlapList");

    if (!container) {
        return;
    }

    const overlaps =
        detectOverlaps();

    if (!overlaps.length) {
        container.innerHTML = `
            <div class="empty-state">
                <span>✓</span>

                <p>
                    No potential overlaps detected.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        overlaps
            .slice(0, 8)
            .map(
                (overlap) => `
                    <div
                        class="overlap-card"
                    >
                        <div
                            class="overlap-card-header"
                        >
                            <div
                                class="overlap-services"
                            >
                                ${escapeHTML(
                                    overlap.first.name
                                )}

                                +

                                ${escapeHTML(
                                    overlap.second.name
                                )}
                            </div>

                            <span
                                class="overlap-score"
                            >
                                Review
                            </span>
                        </div>

                        <div
                            class="overlap-reasons"
                        >
                            <span
                                class="overlap-reason"
                            >
                                ${escapeHTML(
                                    overlap.category
                                )}
                            </span>

                            <span
                                class="overlap-reason"
                            >
                                ${formatCurrency(
                                    overlap.combined
                                )}
                                / month combined
                            </span>
                        </div>
                    </div>
                `
            )
            .join("");
}


/* =========================================================
   DASHBOARD SUMMARY
   ========================================================= */

function renderSummary() {
    const subscriptions =
        getSubscriptions();

    const totalMonthly =
        subscriptions.reduce(
            (
                total,
                subscription
            ) =>
                total +
                normalizeMonthlyAmount(
                    subscription.amount,
                    subscription.billingCycle
                ),
            0
        );

    const categoryTotals =
        calculateCategoryTotals(
            subscriptions
        );

    const topCategory =
        Object.entries(
            categoryTotals
        )
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )[0];

    const overlaps =
        detectOverlaps();

    if ($("totalMonthlySpend")) {
        $("totalMonthlySpend")
            .textContent =
            formatCurrency(
                totalMonthly
            );
    }

    if ($("subscriptionCount")) {
        $("subscriptionCount")
            .textContent =
            subscriptions.length;
    }

    if ($("topCategory")) {
        $("topCategory")
            .textContent =
            topCategory?.[0] ||
            "—";
    }

    if ($("overlapCount")) {
        $("overlapCount")
            .textContent =
            overlaps.length;
    }
}


/* =========================================================
   BUDGET
   ========================================================= */

function loadBudget() {
    const budget =
        getBudget();

    if ($("monthlyIncome")) {
        $("monthlyIncome")
            .value =
            budget.monthlyIncome ||
            "";
    }

    if ($("otherExpenses")) {
        $("otherExpenses")
            .value =
            budget.otherExpenses ||
            "";
    }

    calculateBudget(
        false
    );
}

function calculateBudget(
    showFeedback = true
) {
    const monthlyIncome =
        Number(
            $("monthlyIncome")
                ?.value
        ) || 0;

    const otherExpenses =
        Number(
            $("otherExpenses")
                ?.value
        ) || 0;

    setError(
        "incomeError",
        ""
    );

    setError(
        "expenseError",
        ""
    );

    if (monthlyIncome < 0) {
        setError(
            "incomeError",
            "Income cannot be negative."
        );

        return;
    }

    if (otherExpenses < 0) {
        setError(
            "expenseError",
            "Expenses cannot be negative."
        );

        return;
    }

    saveBudget({
        monthlyIncome,
        otherExpenses
    });

    const subscriptions =
        getSubscriptions();

    const subscriptionSpend =
        subscriptions.reduce(
            (
                total,
                subscription
            ) =>
                total +
                normalizeMonthlyAmount(
                    subscription.amount,
                    subscription.billingCycle
                ),
            0
        );

    const totalExpenses =
        subscriptionSpend +
        otherExpenses;

    const remaining =
        monthlyIncome -
        totalExpenses;

    const savingsRate =
        monthlyIncome > 0
            ? (
                remaining /
                monthlyIncome
            ) * 100
            : 0;

    if ($("budgetSubscriptionSpend")) {
        $("budgetSubscriptionSpend")
            .textContent =
            formatCurrency(
                subscriptionSpend
            );
    }

    if ($("budgetTotalExpenses")) {
        $("budgetTotalExpenses")
            .textContent =
            formatCurrency(
                totalExpenses
            );
    }

    if ($("budgetRemaining")) {
        $("budgetRemaining")
            .textContent =
            formatCurrency(
                remaining
            );
    }

    if ($("budgetSavingsRate")) {
        $("budgetSavingsRate")
            .textContent =
            `${Math.max(
                0,
                savingsRate
            ).toFixed(1)}%`;
    }

    const insight =
        $("budgetInsight");

    if (insight) {
        insight.className =
            "budget-insight";

        if (!monthlyIncome) {
            insight.textContent =
                "Enter your income and expenses to understand your monthly position.";
        } else if (
            remaining < 0
        ) {
            insight.textContent =
                "Your recurring expenses currently exceed the income entered. Review your subscriptions and other expenses.";

            insight.classList.add(
                "danger"
            );
        } else if (
            savingsRate < 10
        ) {
            insight.textContent =
                "Your remaining amount is relatively low. Reviewing recurring subscriptions may help create more monthly room.";

            insight.classList.add(
                "warning"
            );
        } else {
            insight.textContent =
                `You have ${formatCurrency(
                    remaining
                )} remaining after the expenses entered.`;

            insight.classList.add(
                "success"
            );
        }
    }

    if (showFeedback) {
        showToast(
            "Your monthly budget has been recalculated.",
            "success",
            "Budget updated"
        );
    }

    renderSmartInsights();
}


/* =========================================================
   SMART INSIGHTS
   ========================================================= */

function renderSmartInsights() {
    const container =
        $("smartInsights");

    if (!container) {
        return;
    }

    const subscriptions =
        getSubscriptions();

    if (!subscriptions.length) {
        container.innerHTML = `
            <div
                class="insight-card"
            >
                <div
                    class="insight-icon"
                >
                    💡
                </div>

                <strong>
                    Start Tracking
                </strong>

                <p>
                    Add subscriptions to
                    receive personalized
                    spending insights.
                </p>
            </div>
        `;

        return;
    }

    const totalMonthly =
        subscriptions.reduce(
            (
                sum,
                subscription
            ) =>
                sum +
                normalizeMonthlyAmount(
                    subscription.amount,
                    subscription.billingCycle
                ),
            0
        );

    const categoryTotals =
        calculateCategoryTotals(
            subscriptions
        );

    const topCategory =
        Object.entries(
            categoryTotals
        )
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )[0];

    const overlaps =
        detectOverlaps();

    const budget =
        getBudget();

    const insights = [];

    if (topCategory) {
        insights.push({
            icon: "📊",

            title:
                "Top spending category",

            text:
                `${topCategory[0]} accounts for ${formatCurrency(
                    topCategory[1]
                )} of your normalized monthly spending.`
        });
    }

    if (overlaps.length) {
        insights.push({
            icon: "⚠",

            title:
                "Review potential overlaps",

            text:
                `${overlaps.length} subscription pair${
                    overlaps.length === 1
                        ? ""
                        : "s"
                } share a category and may be worth reviewing.`
        });
    } else {
        insights.push({
            icon: "✓",

            title:
                "No category overlaps",

            text:
                "No potential same-category overlaps were detected in your current ledger."
        });
    }

    const annualCost =
        totalMonthly * 12;

    insights.push({
        icon: "₹",

        title:
            "Annualized recurring cost",

        text:
            `Your current subscriptions represent approximately ${formatCurrency(
                annualCost
            )} per year.`
    });

    if (
        budget.monthlyIncome > 0
    ) {
        const ratio =
            totalMonthly /
            budget.monthlyIncome;

        insights.push({
            icon: "◔",

            title:
                "Subscription load",

            text:
                `Subscriptions consume approximately ${(
                    ratio * 100
                ).toFixed(
                    1
                )}% of the monthly income entered.`
        });
    }

    container.innerHTML =
        insights
            .slice(0, 4)
            .map(
                (insight) => `
                    <div
                        class="insight-card"
                    >
                        <div
                            class="insight-icon"
                        >
                            ${insight.icon}
                        </div>

                        <strong>
                            ${escapeHTML(
                                insight.title
                            )}
                        </strong>

                        <p>
                            ${escapeHTML(
                                insight.text
                            )}
                        </p>
                    </div>
                `
            )
            .join("");
}


/* =========================================================
   DASHBOARD RENDER
   ========================================================= */

function renderDashboard() {
    if (!currentUser) {
        return;
    }

    updateDashboardUser();

    renderSummary();

    renderSubscriptions();

    renderCategoryBreakdown();

    renderOverlaps();

    loadBudget();

    renderSmartInsights();
}


/* =========================================================
   LANDING PAGE NAVIGATION
   ========================================================= */

function scrollToSection(
    id
) {
    const section =
        $(id);

    if (!section) {
        return;
    }

    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function goToLandingSection(
    id
) {
    if (
        getRoute() !==
        "landing"
    ) {
        setRoute(
            "landing"
        );

        setTimeout(() => {
            scrollToSection(
                id
            );
        }, 120);
    } else {
        scrollToSection(
            id
        );
    }
}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function initializeEventListeners() {

    /* ---------- Theme ---------- */

    $("themeToggle")
        ?.addEventListener(
            "click",
            toggleTheme
        );

    $("dashboardThemeToggle")
        ?.addEventListener(
            "click",
            toggleTheme
        );


    /* ---------- Brand ---------- */

    $("brandHome")
        ?.addEventListener(
            "click",
            () =>
                setRoute(
                    "landing"
                )
        );

    $("dashboardBrandHome")
        ?.addEventListener(
            "click",
            () =>
                setRoute(
                    "dashboard"
                )
        );

    $("authBrandHome")
        ?.addEventListener(
            "click",
            () =>
                setRoute(
                    "landing"
                )
        );


    /* ---------- Navbar ---------- */

    $("navFeaturesButton")
        ?.addEventListener(
            "click",
            () =>
                goToLandingSection(
                    "features"
                )
        );

    $("navHowItWorksButton")
        ?.addEventListener(
            "click",
            () =>
                goToLandingSection(
                    "how-it-works"
                )
        );

    $("navInsightsButton")
        ?.addEventListener(
            "click",
            () =>
                goToLandingSection(
                    "insights"
                )
        );

    $("navLoginButton")
        ?.addEventListener(
            "click",
            () =>
                setRoute(
                    "login"
                )
        );

    $("navRegisterButton")
        ?.addEventListener(
            "click",
            () =>
                setRoute(
                    "register"
                )
        );


    /* ---------- Hero ---------- */

    $("heroGetStarted")
        ?.addEventListener(
            "click",
            () =>
                setRoute(
                    "register"
                )
        );

    $("heroHowItWorks")
        ?.addEventListener(
            "click",
            () =>
                goToLandingSection(
                    "how-it-works"
                )
        );

    $("insightGetStarted")
        ?.addEventListener(
            "click",
            () =>
                setRoute(
                    "register"
                )
        );


    /* ---------- Authentication ---------- */

    $("backHomeButton")
        ?.addEventListener(
            "click",
            () =>
                setRoute(
                    "landing"
                )
        );

    $("showRegisterButton")
        ?.addEventListener(
            "click",
            () =>
                setRoute(
                    "register"
                )
        );

    $("showLoginButton")
        ?.addEventListener(
            "click",
            () =>
                setRoute(
                    "login"
                )
        );

    $("loginForm")
        ?.addEventListener(
            "submit",
            handleLogin
        );

    $("registerForm")
        ?.addEventListener(
            "submit",
            handleRegister
        );


    /* ---------- Password Visibility ---------- */

    $("loginPasswordToggle")
        ?.addEventListener(
            "click",
            () =>
                togglePasswordVisibility(
                    "loginPassword",
                    "loginPasswordToggle"
                )
        );

    $("registerPasswordToggle")
        ?.addEventListener(
            "click",
            () =>
                togglePasswordVisibility(
                    "registerPassword",
                    "registerPasswordToggle"
                )
        );

    $("confirmPasswordToggle")
        ?.addEventListener(
            "click",
            () =>
                togglePasswordVisibility(
                    "confirmPassword",
                    "confirmPasswordToggle"
                )
        );


    /* ---------- Password Strength ---------- */

    $("registerPassword")
        ?.addEventListener(
            "input",
            updatePasswordStrength
        );


    /* ---------- Dashboard ---------- */

    $("logoutButton")
        ?.addEventListener(
            "click",
            logout
        );

    $("subscriptionForm")
        ?.addEventListener(
            "submit",
            handleSubscriptionSubmit
        );

    $("cancelEditButton")
        ?.addEventListener(
            "click",
            resetSubscriptionForm
        );

    $("searchInput")
        ?.addEventListener(
            "input",
            renderSubscriptions
        );

    $("categoryFilter")
        ?.addEventListener(
            "change",
            renderSubscriptions
        );

    $("calculateBudgetButton")
        ?.addEventListener(
            "click",
            () =>
                calculateBudget(
                    true
                )
        );


    /* ---------- Subscription Actions ---------- */

    $("subscriptionList")
        ?.addEventListener(
            "click",
            (event) => {
                const button =
                    event.target.closest(
                        "button[data-action]"
                    );

                if (!button) {
                    return;
                }

                const id =
                    button.dataset.id;

                const action =
                    button.dataset.action;

                if (!id) {
                    return;
                }

                if (
                    action === "edit"
                ) {
                    editSubscription(
                        id
                    );
                }

                if (
                    action === "delete"
                ) {
                    deleteSubscription(
                        id
                    );
                }
            }
        );


    /* ---------- Escape Key ---------- */

    document.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key ===
                "Escape"
            ) {
                const route =
                    getRoute();

                if (
                    route === "login" ||
                    route === "register"
                ) {
                    setRoute(
                        "landing"
                    );
                }
            }
        }
    );
}


/* =========================================================
   APPLICATION INITIALIZATION
   ========================================================= */

function initializeApp() {

    migrateUsersIfNecessary();

    currentUser =
        migrateCurrentUserIfNecessary();

    applyTheme(
        getSavedTheme()
    );

    initializeEventListeners();

    if ($("startDate")) {
        $("startDate").value =
            getTodayISO();
    }

    updatePasswordStrength();

    handleRoute();
}


/* =========================================================
   HASH ROUTING
   ========================================================= */

window.addEventListener(
    "hashchange",
    handleRoute
);


/* =========================================================
   START
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initializeApp
    );
} else {
    initializeApp();
}

function clearLoginForm() {
    if ($("loginForm")) {
        $("loginForm").reset();
    }

    if ($("loginEmail")) {
        $("loginEmail").value = "";
    }

    if ($("loginPassword")) {
        $("loginPassword").value = "";
        $("loginPassword").type = "password";
    }

    if ($("loginPasswordToggle")) {
        $("loginPasswordToggle").textContent = "Show";
    }

    setError("loginEmailError", "");
    setError("loginPasswordError", "");

    setAuthMessage(
        "loginMessage",
        ""
    );
}