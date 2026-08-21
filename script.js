const USERS_KEY = "subsentry_users";
const CURRENT_USER_KEY = "subsentry_current_user";

let currentUser = null;
let subscriptions = [];
let budgetData = {
  income: 0,
  otherExpenses: 0
};

let editingSubscriptionId = null;

const $ = id => document.getElementById(id);

const money = n =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const normalizeEmail = e =>
  String(e || "").trim().toLowerCase();

const esc = s =>
  String(s ?? "").replace(
    /[&<>'"]/g,
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }[c])
  );


/* =========================
   LOCAL STORAGE
========================= */

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
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
      localStorage.getItem(CURRENT_USER_KEY)
    );
  } catch {
    return null;
  }
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(
      CURRENT_USER_KEY,
      JSON.stringify(user)
    );
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

function userStorageKey(id) {
  return `subsentry_data_${id}`;
}

function loadUserData() {

  if (!currentUser) {
    subscriptions = [];
    budgetData = {
      income: 0,
      otherExpenses: 0
    };
    return;
  }

  try {

    const saved = JSON.parse(
      localStorage.getItem(
        userStorageKey(currentUser.id)
      )
    );

    subscriptions =
      Array.isArray(saved?.subscriptions)
        ? saved.subscriptions
        : [];

    budgetData =
      saved?.budget || {
        income: 0,
        otherExpenses: 0
      };

  } catch {

    subscriptions = [];

    budgetData = {
      income: 0,
      otherExpenses: 0
    };

  }
}

function saveUserData() {

  if (!currentUser) {
    return;
  }

  localStorage.setItem(
    userStorageKey(currentUser.id),
    JSON.stringify({
      subscriptions,
      budget: budgetData
    })
  );
}


/* =========================
   VIEW / ROUTING
========================= */

function showView(view) {

  [
    "landingView",
    "authView",
    "dashboardView"
  ].forEach(id => {

    $(id).classList.add("hidden");

  });

  $(view).classList.remove("hidden");
}

function showLanding() {

  showView("landingView");

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });
}

function goHome() {

  history.pushState(
    null,
    "",
    window.location.pathname +
    window.location.search
  );

  showLanding();
}

function navigate(route) {

  if (window.location.hash === route) {

    handleRoute();

  } else {

    window.location.hash = route;

  }
}

function cleanInitialLandingHash() {

  const h = window.location.hash;

  if (
    [
      "#features",
      "#how-it-works",
      "#insights"
    ].includes(h)
  ) {

    history.replaceState(
      null,
      "",
      window.location.pathname +
      window.location.search
    );

    return true;
  }

  return false;
}

function handleRoute() {

  const route =
    window.location.hash.replace("#", "");

  if (route === "dashboard") {

    if (!currentUser) {

      navigate("#login");
      return;

    }

    showDashboard();
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

  if (
    [
      "features",
      "how-it-works",
      "insights"
    ].includes(route)
  ) {

    showLanding();

    setTimeout(() => {

      $(route)?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }, 30);

    return;
  }

  showLanding();
}


/* =========================
   AUTH VISUAL
========================= */

function updateAuthVisual(mode) {

  const register = mode === "register";

  $("authVisualEyebrow").textContent =
    register
      ? "GET STARTED"
      : "SUBSCRIPTION INTELLIGENCE";

  $("authVisualTitle").textContent =
    register
      ? "Build your personal subscription control center."
      : "Take control of recurring spending.";

  $("authVisualText").textContent =
    register
      ? "Create your workspace and start turning recurring charges into clear, useful financial information."
      : "See every recurring charge, identify unnecessary overlaps and understand your monthly subscription burn.";

  $("loginVisualPoints").classList.toggle(
    "hidden",
    register
  );

  $("registerVisualPoints").classList.toggle(
    "hidden",
    !register
  );
}

function clearAuthMessages() {

  document
    .querySelectorAll(".auth-message")
    .forEach(e => {

      e.textContent = "";
      e.className = "auth-message";

    });

  document
    .querySelectorAll(".error-message")
    .forEach(e => {

      e.textContent = "";

    });
}

function showAuth(mode) {

  showView("authView");

  $("loginPanel").classList.toggle(
    "hidden",
    mode !== "login"
  );

  $("registerPanel").classList.toggle(
    "hidden",
    mode !== "register"
  );

  updateAuthVisual(mode);

  clearAuthMessages();

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });
}

function message(id, text, type) {

  const e = $(id);

  e.textContent = text;

  e.className =
    `auth-message ${type}`;
}


/* =========================
   REGISTER
========================= */

function handleRegister(event) {

  event.preventDefault();

  clearAuthMessages();

  const name =
    $("registerName").value.trim();

  const email =
    normalizeEmail(
      $("registerEmail").value
    );

  const password =
    $("registerPassword").value;

  const confirm =
    $("confirmPassword").value;

  let valid = true;


  if (name.length < 2) {

    $("registerNameError").textContent =
      "Please enter your name.";

    valid = false;
  }


  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {

    $("registerEmailError").textContent =
      "Enter a valid email address.";

    valid = false;
  }


  if (password.length < 6) {

    $("registerPasswordError").textContent =
      "Password must contain at least 6 characters.";

    valid = false;
  }


  if (password !== confirm) {

    $("confirmPasswordError").textContent =
      "Passwords do not match.";

    valid = false;
  }


  if (!valid) {
    return;
  }


  const users = getUsers();

  if (
    users.some(
      u =>
        normalizeEmail(u.email) === email
    )
  ) {

    message(
      "registerMessage",
      "An account with this email already exists.",
      "error"
    );

    return;
  }


  const user = {

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


  users.push(user);

  saveUsers(users);

  currentUser = user;

  setCurrentUser(user);

  subscriptions = [];

  budgetData = {
    income: 0,
    otherExpenses: 0
  };

  saveUserData();

  $("registerForm").reset();

  navigate("#dashboard");
}


/* =========================
   LOGIN
========================= */

function handleLogin(event) {

  event.preventDefault();

  clearAuthMessages();

  const email =
    normalizeEmail(
      $("loginEmail").value
    );

  const password =
    $("loginPassword").value;

  let valid = true;


  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {

    $("loginEmailError").textContent =
      "Enter a valid email address.";

    valid = false;
  }


  if (!password) {

    $("loginPasswordError").textContent =
      "Enter your password.";

    valid = false;
  }


  if (!valid) {
    return;
  }


  const user =
    getUsers().find(
      u =>
        normalizeEmail(u.email) === email &&
        u.password === password
    );


  if (!user) {

    message(
      "loginMessage",
      "Invalid email or password. Please try again.",
      "error"
    );

    return;
  }


  currentUser = user;

  setCurrentUser(user);

  loadUserData();

  $("loginForm").reset();

  navigate("#dashboard");
}


/* =========================
   LOGOUT
========================= */

function handleLogout() {

  saveUserData();

  currentUser = null;

  setCurrentUser(null);

  editingSubscriptionId = null;

  goHome();
}


/* =========================
   SUBSCRIPTIONS
========================= */

function normalizeMonthlyCost(
  amount,
  cycle
) {

  const n = Number(amount);

  if (!Number.isFinite(n)) {
    return 0;
  }

  if (cycle === "weekly") {
    return n * 52 / 12;
  }

  if (cycle === "yearly") {
    return n / 12;
  }

  return n;
}

function clearSubscriptionErrors() {

  [
    "nameError",
    "amountError",
    "dateError"
  ].forEach(id => {

    $(id).textContent = "";

  });
}

function validateSubscriptionForm() {

  clearSubscriptionErrors();

  let ok = true;

  const name =
    $("subscriptionName").value.trim();

  const amount =
    Number($("amount").value);

  const date =
    $("startDate").value;


  if (!name) {

    $("nameError").textContent =
      "Enter the service name.";

    ok = false;
  }


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    $("amountError").textContent =
      "Enter a valid amount.";

    ok = false;
  }


  if (!date) {

    $("dateError").textContent =
      "Select a start date.";

    ok = false;
  }


  return ok;
}

function resetSubscriptionForm() {

  editingSubscriptionId = null;

  $("subscriptionForm").reset();

  $("subscriptionFormTitle").textContent =
    "Add Subscription";

  $("subscriptionSubmitButton").textContent =
    "+ Add Subscription";

  $("cancelEditButton").classList.add(
    "hidden"
  );

  clearSubscriptionErrors();
}

function handleSubscriptionSubmit(event) {

  event.preventDefault();

  if (!validateSubscriptionForm()) {
    return;
  }


  const name =
    $("subscriptionName").value.trim();

  const amount =
    Number($("amount").value);

  const billingCycle =
    $("billingCycle").value;

  const category =
    $("category").value;

  const startDate =
    $("startDate").value;

  const monthlyCost =
    normalizeMonthlyCost(
      amount,
      billingCycle
    );


  if (editingSubscriptionId) {

    const s =
      subscriptions.find(
        x =>
          x.id === editingSubscriptionId
      );

    if (s) {

      Object.assign(s, {

        name,
        amount,
        billingCycle,
        category,
        startDate,
        monthlyCost

      });

    }

  } else {

    subscriptions.push({

      id:
        `sub_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 7)}`,

      name,
      amount,
      billingCycle,
      category,
      startDate,
      monthlyCost,

      createdAt:
        new Date().toISOString()

    });

  }


  saveUserData();

  resetSubscriptionForm();

  renderDashboard();
}

function editSubscription(id) {

  const s =
    subscriptions.find(
      x => x.id === id
    );

  if (!s) {
    return;
  }


  editingSubscriptionId = id;

  $("subscriptionName").value =
    s.name;

  $("amount").value =
    s.amount;

  $("billingCycle").value =
    s.billingCycle;

  $("category").value =
    s.category;

  $("startDate").value =
    s.startDate;

  $("subscriptionFormTitle").textContent =
    "Edit Subscription";

  $("subscriptionSubmitButton").textContent =
    "Save Changes";

  $("cancelEditButton").classList.remove(
    "hidden"
  );


  document
    .querySelector(".form-panel")
    .scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
}

function deleteSubscription(id) {

  if (
    !confirm(
      "Delete this subscription?"
    )
  ) {
    return;
  }


  subscriptions =
    subscriptions.filter(
      s => s.id !== id
    );


  saveUserData();


  if (
    editingSubscriptionId === id
  ) {

    resetSubscriptionForm();

  }


  renderDashboard();
}


/* =========================
   ANALYTICS
========================= */

function calculateCategories() {

  const map = {};

  subscriptions.forEach(s => {

    map[s.category] =
      (map[s.category] || 0) +
      Number(s.monthlyCost || 0);

  });

  return map;
}

function detectOverlaps() {

  const groups = {};

  subscriptions.forEach(s => {

    const key =
      s.category.toLowerCase();

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(s);

  });


  const out = [];


  Object.values(groups).forEach(group => {

    if (group.length > 1) {

      for (
        let i = 0;
        i < group.length;
        i++
      ) {

        for (
          let j = i + 1;
          j < group.length;
          j++
        ) {

          const a = group[i];
          const b = group[j];

          const score =
            Math.min(
              99,
              60 +
              Math.round(
                Math.min(
                  a.monthlyCost,
                  b.monthlyCost
                ) /
                Math.max(
                  a.monthlyCost,
                  b.monthlyCost
                ) *
                35
              )
            );

          out.push({
            a,
            b,
            score
          });

        }

      }

    }

  });


  return out;
}


/* =========================
   DASHBOARD SUMMARY
========================= */

function renderSummary() {

  const total =
    subscriptions.reduce(
      (a, s) =>
        a +
        Number(s.monthlyCost || 0),
      0
    );

  const categories =
    calculateCategories();

  const entries =
    Object.entries(categories)
      .sort(
        (a, b) =>
          b[1] - a[1]
      );

  const overlaps =
    detectOverlaps();


  $("totalMonthlySpend").textContent =
    money(total);

  $("subscriptionCount").textContent =
    subscriptions.length;

  $("topCategory").textContent =
    entries[0]?.[0] || "—";

  $("overlapCount").textContent =
    overlaps.length;
}


/* =========================
   CATEGORY BREAKDOWN
========================= */

function renderCategoryBreakdown() {

  const box =
    $("categoryBreakdown");

  const entries =
    Object.entries(
      calculateCategories()
    ).sort(
      (a, b) =>
        b[1] - a[1]
    );


  if (!entries.length) {

    box.innerHTML = `
      <div class="empty-state">
        <span>📊</span>
        <p>
          Add subscriptions to see your spending analysis.
        </p>
      </div>
    `;

    return;
  }


  const max =
    entries[0][1] || 1;


  box.innerHTML =
    entries
      .map(
        ([cat, val]) => `

          <div class="category-item">

            <div class="category-header">

              <span class="category-name">
                ${esc(cat)}
              </span>

              <span class="category-value">
                ${money(val)}
              </span>

            </div>

            <div class="category-bar">

              <div
                class="category-bar-fill"
                style="width:${Math.max(
                  4,
                  val / max * 100
                )}%"
              ></div>

            </div>

          </div>

        `
      )
      .join("");
}


/* =========================
   OVERLAPS
========================= */

function renderOverlaps() {

  const box =
    $("overlapList");

  const overlaps =
    detectOverlaps();


  if (!overlaps.length) {

    box.innerHTML = `
      <div class="empty-state">
        <span>✓</span>
        <p>
          No potential overlaps detected.
        </p>
      </div>
    `;

    return;
  }


  box.innerHTML =
    overlaps
      .map(
        o => `

          <div class="overlap-card">

            <div class="overlap-card-header">

              <span class="overlap-services">
                ${esc(o.a.name)}
                +
                ${esc(o.b.name)}
              </span>

              <span class="overlap-score">
                ${o.score}% overlap
              </span>

            </div>

            <div class="overlap-reasons">

              <span class="overlap-reason">
                Same category:
                ${esc(o.a.category)}
              </span>

              <span class="overlap-reason">
                Review redundancy
              </span>

            </div>

          </div>

        `
      )
      .join("");
}


/* =========================
   SUBSCRIPTION LEDGER
========================= */

function renderSubscriptions() {

  const search =
    $("searchInput")
      .value
      .trim()
      .toLowerCase();

  const filter =
    $("categoryFilter").value;

  const box =
    $("subscriptionList");


  const list =
    subscriptions.filter(
      s =>
        (
          filter === "all" ||
          s.category === filter
        ) &&
        (
          !search ||
          s.name
            .toLowerCase()
            .includes(search) ||
          s.category
            .toLowerCase()
            .includes(search)
        )
    );


  if (!list.length) {

    box.innerHTML = `
      <div class="empty-state">

        <span>💳</span>

        <h3>
          No matching subscriptions
        </h3>

        <p>
          Add a subscription or change your search/filter.
        </p>

      </div>
    `;

    return;
  }


  box.innerHTML =
    list
      .map(
        s => `

          <div class="subscription-card">

            <div class="subscription-main">

              <strong>
                ${esc(s.name)}
              </strong>

              <span>
                ${esc(s.category)}
                •
                ${esc(s.billingCycle)}
              </span>

            </div>


            <div class="subscription-meta">

              <span>
                Started
              </span>

              <strong>
                ${esc(s.startDate || "—")}
              </strong>

            </div>


            <div class="subscription-cost">

              <strong>
                ${money(s.monthlyCost)}
              </strong>

              <span>
                per month
              </span>

            </div>


            <div class="subscription-actions">

              <button
                type="button"
                data-edit="${s.id}"
              >
                Edit
              </button>

              <button
                type="button"
                class="delete-button"
                data-delete="${s.id}"
              >
                Delete
              </button>

            </div>

          </div>

        `
      )
      .join("");


  box
    .querySelectorAll("[data-edit]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          editSubscription(
            button.dataset.edit
          )
      );

    });


  box
    .querySelectorAll("[data-delete]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          deleteSubscription(
            button.dataset.delete
          )
      );

    });
}


/* =========================
   BUDGET
========================= */

function renderBudget() {

  const income =
    Number(budgetData.income) || 0;

  const other =
    Number(
      budgetData.otherExpenses
    ) || 0;

  const subs =
    subscriptions.reduce(
      (a, s) =>
        a +
        Number(s.monthlyCost || 0),
      0
    );

  const total =
    other + subs;

  const remaining =
    income - total;

  const rate =
    income > 0
      ? remaining / income * 100
      : 0;


  $("monthlyIncome").value =
    income || "";

  $("otherExpenses").value =
    other || "";

  $("budgetSubscriptionSpend").textContent =
    money(subs);

  $("budgetTotalExpenses").textContent =
    money(total);

  $("budgetRemaining").textContent =
    money(remaining);

  $("budgetSavingsRate").textContent =
    `${rate.toFixed(1)}%`;


  $("budgetRemaining").style.color =
    remaining < 0
      ? "var(--danger)"
      : "var(--text)";


  if (!income) {

    $("budgetInsight").textContent =
      "Enter your monthly income and expenses, then click Calculate Budget.";

  } else if (remaining < 0) {

    $("budgetInsight").textContent =
      `Your recurring and other expenses exceed income by ${money(
        Math.abs(remaining)
      )}.`;

  } else {

    $("budgetInsight").textContent =
      `After subscriptions and other expenses, you have ${money(
        remaining
      )} available each month.`;

  }
}

function calculateBudget() {

  const income =
    Number(
      $("monthlyIncome").value
    );

  const other =
    Number(
      $("otherExpenses").value
    );


  $("incomeError").textContent = "";
  $("expenseError").textContent = "";

  let ok = true;


  if (
    !Number.isFinite(income) ||
    income < 0
  ) {

    $("incomeError").textContent =
      "Enter a valid income.";

    ok = false;
  }


  if (
    !Number.isFinite(other) ||
    other < 0
  ) {

    $("expenseError").textContent =
      "Enter valid expenses.";

    ok = false;
  }


  if (!ok) {
    return;
  }


  budgetData = {
    income,
    otherExpenses: other
  };


  saveUserData();

  renderBudget();

  renderInsights();
}


/* =========================
   SMART INSIGHTS
========================= */

function renderInsights() {

  const box =
    $("smartInsights");

  const total =
    subscriptions.reduce(
      (a, s) =>
        a +
        Number(s.monthlyCost || 0),
      0
    );

  const cats =
    Object.entries(
      calculateCategories()
    ).sort(
      (a, b) =>
        b[1] - a[1]
    );

  const overlaps =
    detectOverlaps();

  const income =
    Number(budgetData.income) || 0;

  const items = [];


  if (!subscriptions.length) {

    box.innerHTML = `
      <div class="empty-state">
        <span>💡</span>
        <p>
          Add subscriptions and budget information
          to receive insights.
        </p>
      </div>
    `;

    return;
  }


  if (cats[0]) {

    items.push([
      "Top spending area",
      `${cats[0][0]} accounts for ${money(
        cats[0][1]
      )} of your monthly subscription spend.`
    ]);

  }


  items.push([
    "Annualized burn",
    `Your current subscriptions represent approximately ${money(
      total * 12
    )} per year.`
  ]);


  if (overlaps.length) {

    items.push([
      "Overlap review",
      `${overlaps.length} potential overlap${
        overlaps.length > 1
          ? "s"
          : ""
      } detected. Review similar services before renewing them.`
    ]);

  } else {

    items.push([
      "Subscription health",
      "No same-category overlaps were detected in your current ledger."
    ]);

  }


  if (income) {

    items.push([
      "Budget position",
      `Subscriptions use ${(
        total / income * 100
      ).toFixed(1)}% of your monthly income.`
    ]);

  }


  box.innerHTML =
    items
      .slice(0, 4)
      .map(
        ([h, p]) => `

          <div class="insight-card">

            <strong>
              ${esc(h)}
            </strong>

            <p>
              ${esc(p)}
            </p>

          </div>

        `
      )
      .join("");
}


/* =========================
   DASHBOARD
========================= */

function renderDashboard() {

  loadUserData();

  $("welcomeUser").textContent =
    `Welcome, ${currentUser?.name || "User"}`;

  renderSummary();
  renderCategoryBreakdown();
  renderOverlaps();
  renderSubscriptions();
  renderBudget();
  renderInsights();
}

function showDashboard() {

  showView("dashboardView");

  renderDashboard();

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });
}


/* =========================
   EVENT BINDINGS
========================= */

function bindEvents() {

  document
    .querySelectorAll(".main-nav a")
    .forEach(link => {

      link.addEventListener(
        "click",
        event => {

          event.preventDefault();

          navigate(
            link.getAttribute("href")
          );

        }
      );

    });


  $("brandHome")
    .addEventListener(
      "click",
      goHome
    );

  $("dashboardBrandHome")
    .addEventListener(
      "click",
      goHome
    );

  $("authBrandHome")
    .addEventListener(
      "click",
      goHome
    );


  $("navLoginButton")
    .addEventListener(
      "click",
      () => navigate("#login")
    );

  $("navRegisterButton")
    .addEventListener(
      "click",
      () => navigate("#register")
    );

  $("heroGetStarted")
    .addEventListener(
      "click",
      () => navigate("#register")
    );

  $("heroExplore")
    .addEventListener(
      "click",
      () => navigate("#features")
    );

  $("insightGetStarted")
    .addEventListener(
      "click",
      () => navigate("#register")
    );


  $("backHomeButton")
    .addEventListener(
      "click",
      goHome
    );

  $("showRegisterButton")
    .addEventListener(
      "click",
      () => navigate("#register")
    );

  $("showLoginButton")
    .addEventListener(
      "click",
      () => navigate("#login")
    );


  $("loginForm")
    .addEventListener(
      "submit",
      handleLogin
    );

  $("registerForm")
    .addEventListener(
      "submit",
      handleRegister
    );


  $("logoutButton")
    .addEventListener(
      "click",
      handleLogout
    );


  $("subscriptionForm")
    .addEventListener(
      "submit",
      handleSubscriptionSubmit
    );


  $("cancelEditButton")
    .addEventListener(
      "click",
      resetSubscriptionForm
    );


  $("calculateBudgetButton")
    .addEventListener(
      "click",
      calculateBudget
    );


  $("searchInput")
    .addEventListener(
      "input",
      renderSubscriptions
    );


  $("categoryFilter")
    .addEventListener(
      "change",
      renderSubscriptions
    );


  window.addEventListener(
    "hashchange",
    handleRoute
  );


  window.addEventListener(
    "beforeunload",
    () => {

      if (currentUser) {
        saveUserData();
      }

    }
  );
}


/* =========================
   INITIALIZATION
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    currentUser =
      getCurrentUser();

    loadUserData();

    bindEvents();

    if (cleanInitialLandingHash()) {

      showLanding();

    } else {

      handleRoute();

    }

  }
);