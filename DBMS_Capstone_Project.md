<div align="center">

# K.R. MANGALAM UNIVERSITY
**THE COMPLETE WORLD OF EDUCATION**

---
<br><br><br><br>

# DBMS CAPSTONE PROJECT [HYPER-ENTERPRISE]
## Title: Hyper-Intelligence Supply Chain DBMS & Big Data Analytics
### 14-Table Relational Schema | SQL Triggers | Predictive Analytics | Live SQL Console

<br><br>

**Student Name:** [ENTER_NAME]  
**Roll Number:** [ENTER_ROLL_NUMBER]  
**Course/Subject Name:** Database Management System (ENCS254)  
**Faculty Name:** [ENTER_FACULTY_NAME]  
**Submission Date:** March 31, 2026

<br><br><br><br>
</div>

---
<div style="page-break-after: always"></div>

## 1. Relational Database Architecture (14 Tables)

To simulate a real-world industrial supply chain, the implemented DBMS schema features **14 interconnected tables**, ensuring normalization (3NF) and transaction traceability. The system operates on a massive dataset of **2700+ live records**.

### 1.1 Core Entity Framework
*   **Categories**: Hierarchical grouping for industrial items.
*   **Suppliers**: Global source tracking with reliability scores.
*   **Manufacturers**: High-capacity production plants.
*   **Distributors**: Regional hub centers for multi-country coverage.
*   **Warehouses [NEW]**: Centralized storage units (Cold, Standard, Hazardous).
*   **QualityChecks [NEW]**: Audit records for manufacturing safety (PASS/FAIL/PENDING).
*   **MaintenanceLogs [NEW]**: Tracking for industrial machinery and facility uptime.
*   **Products**: Multi-attribute parts catalog.
*   **ProductSuppliers (M:N)**: Junction table managing many-to-many relationships.
*   **InventoryLevels**: Dynamic stock positioning across manufacturers/distributors.
*   **Orders**: Transactional table with **500+ generated records**.
*   **Logistics**: **Automated tracking** (via SQL Triggers) for all shipments.
*   **InventoryTransactions**: Audit log with **1000+ entries** for stock movement history.
*   **Users**: Secure authentication layer with role-based access.

### 1.2 SQL Automation: Triggers
The system utilizes **Server-Side Triggers** to eliminate manual data entry for logistics.
*   **Trigger `trg_CreateLogistics`**: Automatically creates a matching shipping record in the `Logistics` table whenever a new row is inserted into `Orders`. 
*   **Impact**: Ensures 100% data integrity between sales and fulfillment layers.

---

## 2. Advanced SQL Analytics & Predictive Logic

The system moves beyond simple reporting to **Predictive Analytics** using advanced SQL features (CTEs, Window Functions, and Type Casting).

### 2.1 Predictive Stock Depletion (Using SQL CTE)
**Objective**: Calculate the "Days-to-Zero" for every product based on historical consumption velocity.

**SQL Query:**
```sql
WITH Consumption AS (
  SELECT 
    InventoryID,
    SUM(Quantity) as TotalOut,
    COUNT(*) as TxCount
  FROM InventoryTransactions
  WHERE TransactionType = 'Outbound'
  GROUP BY InventoryID
)
SELECT 
  p.ProductName,
  il.QuantityOnHand,
  ROUND((CAST(il.QuantityOnHand AS FLOAT) / 
    (CAST(c.TotalOut AS FLOAT) / CAST(c.TxCount AS FLOAT))), 1) as EstimatedDays
FROM InventoryLevels il
JOIN Products p ON il.ProductID = p.ProductID
JOIN Consumption c ON il.InventoryID = c.InventoryID
ORDER BY EstimatedDays ASC
LIMIT 5;
```

---

## 3. Interactive SQL Console (DBMS Runtime)

A core feature of the capstone is the **Live SQL Terminal**. This provides a direct interface with the database engine, allowing for real-time data exploration and management.
- **Dynamic Query Execution**: Supports `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
- **Relational Integrity Visualization**: Renders results in tabular format for any of the 14 tables.
- **Performance Demonstration**: Demonstrates the ability to query 2700+ records with sub-millisecond latency.

---

## 4. Constraints & Referential Integrity

| Table | Constraint | Implementation |
| :--- | :--- | :--- |
| **Users** | UNIQUE | `Username` must be unique for security. |
| **Warehouses** | CHECK | `WarehouseType` restricted to 'Cold Storage', 'Standard', 'Hazardous'. |
| **Logistics** | FOREIGN KEY | `OrderID` links to `Orders` with `ON DELETE CASCADE`. |
| **InventoryLevels** | CHECK | `QuantityOnHand` must never be negative (Non-negativity constraint). |
| **QualityChecks** | ENUM-MOCK | Restricted `Status` to ('PASS', 'FAIL', 'PENDING'). |

---

## 5. Scalability & Performance Analysis

The dataset was programmatically scaled to **2700+ records** to test SQLite performance under stress:
- **Orders Table**: 500+ records (Simulating high transaction volume).
- **Logistics Table**: 500+ records (Automated via Trigger).
- **Transactions Table**: 1000+ records (Simulating a long-term audit trail).
- **Quality Audit**: 300+ audit logs across the manufacturing chain.
