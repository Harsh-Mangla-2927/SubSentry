# SubSentry

### Subscription Intelligence & Recurring Spend Audit Platform

SubSentry is a subscription management and spending-audit web application designed to help users understand recurring expenses, normalize different billing cycles, monitor their subscription ledger, and identify potential subscription overlaps.

The project is being developed incrementally, starting with a Vanilla JavaScript frontend and progressively moving toward a full-stack MERN architecture.

---

## Problem

Subscription-based services are commonly billed using different cycles such as weekly, monthly, and yearly plans.

Because of these different billing periods, it can be difficult for users to understand their actual recurring monthly spending.

Users may also maintain multiple subscriptions within the same category, creating potential spending overlap and unnecessary recurring expenses.

SubSentry addresses this problem by providing a centralized subscription ledger with normalized spending analytics, budget intelligence, and overlap detection.

---

## Current Features

### Authentication

- User registration
- User login
- Password validation
- Live password-strength checker
- Confirm-password validation
- Show/hide password functionality
- Login error feedback
- Login success feedback
- Logout confirmation
- User-specific local workspace

---

### Subscription Management

- Add subscriptions
- Edit existing subscriptions
- Delete subscriptions
- Search subscriptions
- Filter subscriptions by category
- Store:
  - Service name
  - Amount
  - Billing cycle
  - Category
  - Start date

---

### Billing-Cycle Normalization

SubSentry converts different billing cycles into a common monthly spending value.

Examples:

- Weekly → `(amount × 52) / 12`
- Monthly → `amount`
- Yearly → `amount / 12`

This allows subscriptions with different billing periods to be compared using a common monthly burn rate.

---

### Spending Dashboard

The dashboard provides:

- Total Monthly Burn
- Active Subscription Count
- Highest Spending Category
- Potential Overlap Count
- Category-wise spending breakdown
- Annualized recurring cost
- Budget position
- Remaining monthly amount
- Savings-rate calculation

---

### Subscription Overlap Detection

SubSentry analyzes active subscriptions within the same category and identifies potential redundancies.

The system calculates the combined normalized monthly spending of detected subscription pairs so users can review potentially unnecessary recurring expenses.

---

### Budget Intelligence

Users can enter:

- Monthly income
- Other monthly expenses

SubSentry then calculates:

- Subscription spending
- Total monthly expenses
- Remaining amount
- Savings rate
- Subscription load relative to income

---

### Smart Insights

The dashboard generates spending insights such as:

- Highest spending category
- Annualized recurring cost
- Potential category overlaps
- Subscription spending concentration

---

### Dark / Light Mode

Users can switch between:

- Light Mode
- Dark Mode

The selected theme applies consistently across the application.

---

### Dashboard Navigation

The dashboard includes a centralized navigation menu containing:

- User information
- Theme control
- Download Report
- Share Report
- Logout

The menu is responsive and supports:

- Dropdown animation
- Click-outside closing
- Escape-key closing
- Mobile-friendly layout

---

### PDF Financial Reports

SubSentry can generate a structured PDF report based on the user's actual subscription data.

The report includes:

- User information
- Monthly subscription burn
- Annualized recurring cost
- Active subscription count
- Potential overlap count
- Monthly income
- Other expenses
- Total monthly expenses
- Remaining amount
- Subscription load
- Category spending
- Subscription ledger
- Normalized monthly costs
- Potential overlap analysis
- Smart spending insights
- SubSentry recommendations

Reports can be:

- Downloaded as PDF
- Shared through supported device/browser sharing

---

## User Experience

SubSentry focuses on providing a clean and professional financial dashboard with:

- Responsive layouts
- Interactive forms
- Live validation
- Animated UI interactions
- Toast notifications
- Confirmation dialogs
- Dark/light theme support
- Responsive navigation
- Professional PDF reporting

---

## Technology Stack

### Current

- HTML5
- CSS3
- JavaScript (ES6+)
- Browser LocalStorage
- jsPDF

### Planned

- React
- Node.js
- Express.js
- MongoDB
- Mongoose
- REST APIs
- JWT Authentication
- Tailwind CSS

---

## Project Architecture

### Current Frontend

```text
SubSentry/
│
├── index.html
├── style.css
├── script.js
├── report.js
├── nav-menu.js
└── README.md
