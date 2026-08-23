# SubSentry

### Subscription Intelligence & Recurring Spend Audit Platform

SubSentry is a subscription management and spending-intelligence platform designed to help users understand recurring expenses, normalize different billing cycles, identify potential subscription overlaps, and evaluate how recurring spending affects their monthly budget.

The project is being developed incrementally, starting with a Vanilla JavaScript frontend and progressively moving toward a full MERN-stack application.

---

## Overview

Managing multiple subscription services can make recurring spending difficult to understand.

Different services may use:

- Weekly billing
- Monthly billing
- Yearly billing

At the same time, users may maintain multiple services serving similar purposes, creating potential redundant spending.

SubSentry provides a centralized platform where users can track subscriptions, analyze recurring costs, identify potential overlaps, and understand their overall subscription health.

---

## Problem Statement

Subscription expenses are often distributed across multiple services and billing cycles.

This creates several common problems:

- Difficulty estimating true monthly subscription spending
- Lack of visibility into total recurring expenses
- Multiple subscriptions serving similar purposes
- Difficulty comparing weekly, monthly, and yearly plans
- Limited awareness of how subscriptions affect available income
- No centralized subscription ledger

SubSentry addresses these problems through normalized spending analysis and subscription intelligence.

---

# Current Features

## 1. User Authentication

SubSentry currently provides a frontend authentication flow including:

- User registration
- User login
- Logout
- Session persistence
- Basic authentication validation
- Returning users can log back into their accounts

User account information is currently persisted using browser `LocalStorage`.

> Note: This is a frontend prototype authentication system. Production authentication will be migrated to a secure backend implementation during the MERN phase.

---

## 2. Subscription Management

Users can maintain a personal subscription ledger.

Each subscription contains:

- Service name
- Amount
- Billing cycle
- Category
- Start date

Supported operations include:

- Add subscription
- Edit subscription
- Delete subscription
- Search subscriptions
- Filter subscriptions by category

---

## 3. Billing-Cycle Normalization

SubSentry converts different billing cycles into a comparable monthly spending value.

### Weekly

```text
Monthly Cost = (Amount × 52) / 12
