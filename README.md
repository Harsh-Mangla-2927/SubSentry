# SubSentry

### Subscription Intelligence & Recurring Spend Audit Platform

SubSentry is a subscription management and spending-audit application designed to help users understand their recurring expenses, normalize different billing cycles, and identify potential subscription overlaps.

The project is being developed incrementally, starting with a Vanilla JavaScript frontend and progressing toward a full MERN-stack application.

---

## Problem

Subscription-based services are often billed using different cycles such as weekly, monthly, and yearly plans. This makes it difficult to understand the actual recurring monthly cost.

Users may also maintain multiple subscriptions within the same category, leading to potential spending overlap and unnecessary recurring expenses.

SubSentry addresses this by providing a centralized subscription ledger with normalized spending analytics and overlap detection.

---

## Current Features

### Subscription Management
- Add subscriptions
- Store service name, amount, billing cycle, category, and start date
- Edit existing subscriptions
- Delete subscriptions
- Search subscriptions
- Filter subscriptions by category

### Billing-Cycle Normalization
SubSentry converts different billing cycles into a common monthly spending value.

Examples:

- Weekly → `(amount × 52) / 12`
- Monthly → `amount`
- Yearly → `amount / 12`

This allows subscriptions with different billing periods to be compared using a common monthly burn rate.

### Spending Dashboard
The dashboard currently provides:

- Total Monthly Burn
- Active Subscription Count
- Highest Spending Category
- Potential Overlap Count
- Category-wise spending breakdown

### Overlap Detection
SubSentry analyzes subscriptions belonging to the same category and identifies potential redundancies between active services.

---

## Technology Stack

### Current
- HTML5
- CSS3
- JavaScript (ES6+)
- Browser LocalStorage

### Planned
- Node.js
- Express.js
- MongoDB
- Mongoose
- React
- Tailwind CSS
- REST APIs
- Authentication
- JWT

---

## Project Architecture

### Current Frontend

```text
SubSentry/
│
├── index.html
├── style.css
├── script.js
└── README.md