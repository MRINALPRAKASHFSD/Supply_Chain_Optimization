# 📦 Supply Chain Intelligence DBMS [Hyper-Enterprise]

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-blue?style=flat-square&logo=sqlite)](https://www.sqlite.org/)
[![Recharts](https://img.shields.io/badge/Analytics-Recharts-22c55e?style=flat-square&logo=chart.js)](https://recharts.org/)

A high-fidelity, data-centric Supply Chain Management system built to simulate industrial complexity at scale. This project features a robust **14-table relational schema**, automated **SQL triggers**, and predictive analytics powered by advanced SQL CTEs.

![Dashboard Preview](file:///Users/mrinalprakash/.gemini/antigravity/brain/db7a0142-ee84-471e-8aa9-6a4ba63467b3/main_page_preview_1775448429031.png)

---

## 🚀 Key Features

- **14-Table Relational Schema**: Fully normalized (3NF) architecture managing 2,700+ live records.
- **SQL Automation (Triggers)**: Server-side logic for automated logistics generation and inventory auditing.
- **Predictive Analytics**: "Days-to-Zero" stock depletion modeling using SQL Common Table Expressions (CTEs).
- **Interactive SQL Console**: A live terminal to execute direct Relational Algebra queries and view real-time data.
- **Neural Link Authentication**: Secure, tiered access for 'Admin' and 'Viewer' roles.
- **Micro-Animated UI**: Premium dark-mode dashboard with glassmorphism styling and real-time Recharts visualizations.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15+, React 19, Lucide React (Icons), Recharts (Data Viz).
- **Backend**: Next.js API Routes (Serverless-ready).
- **Database**: SQLite3 (via `better-sqlite3`) for sub-millisecond local latency.
- **Styling**: Vanilla CSS with a customized design system.

---

## 📊 Database Architecture

The system operates on an interconnected grid of 14 tables:

| Layer | Tables |
| :--- | :--- |
| **Core Entities** | `Categories`, `Suppliers`, `Manufacturers`, `Distributors`, `Warehouses` |
| **Product Stack** | `Products`, `ProductSuppliers` (M:N) |
| **Transactional** | `Orders`, `Logistics`, `InventoryTransactions` |
| **Operational** | `InventoryLevels`, `QualityChecks`, `MaintenanceLogs` |
| **Security** | `Users` |

---

## 🚦 Getting Started

### 1. Prerequisites
- Node.js 18+ 
- npm / yarn / pnpm

### 2. Installation
```bash
git clone https://github.com/MRINALPRAKASHFSD/Supply_Chain_Optimization.git
cd Supply_Chain_Optimization/webapp
npm install
```

### 3. Database Initialization (Seeding)
To generate the 2,700+ record industrial dataset, run:
```bash
node src/scripts/seed.js
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the intelligence grid.

---

## 📜 Project Documentation
The full project report, including schema diagrams, SQL CTE breakdowns, and performance analysis, can be found in [DBMS_Capstone_Project.md](./DBMS_Capstone_Project.md).

---

## 👤 Author & Credits
- **Primary Developer**: **MRINAL PRAKASH**
- **GitHub**: [@MRINALPRAKASHFSD](https://github.com/MRINALPRAKASHFSD)
- **University**: K.R. MANGALAM UNIVERSITY
- **Project**: DBMS Capstone [ENCS254]

