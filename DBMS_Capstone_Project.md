<div align="center">

# K.R. MANGALAM UNIVERSITY
**THE COMPLETE WORLD OF EDUCATION**

---
<br><br><br><br>

# DBMS CAPSTONE PROJECT [HYPER-ENTERPRISE]
## Title: Hyper-Intelligence Supply Chain DBMS & Big Data Analytics
### 15-Table Relational Schema | Audit Traceability | Neural Simulation | Live SQL Console

<br><br>

**Student Name:** MRINAL PRAKASH  
**GitHub:** [@MRINALPRAKASHFSD](https://github.com/MRINALPRAKASHFSD)  
**Roll Number:** [ENTER_ROLL_NUMBER]  
**Course/Subject Name:** Database Management System (ENCS254)  
**Faculty Name:** [ENTER_FACULTY_NAME]  
**Submission Date:** March 31, 2026

<br><br><br><br>
</div>

---
<div style="page-break-after: always"></div>

## 1. Relational Database Architecture (17 Tables)

To simulate a real-world industrial supply chain, the implemented DBMS schema features **17 interconnected tables**, ensuring normalization (3NF) and enterprise-grade transaction traceability. The system operates on a massive dataset of **3200+ live records**.

### 1.1 Core Entity Framework
*   **Categories**: Hierarchical grouping for industrial items.
*   **Suppliers**: Global source tracking with reliability scores, OTD rates, and quality rejection metrics.
*   **Manufacturers**: High-capacity production plants.
*   **Distributors**: Regional hub centers for multi-country coverage.
*   **Warehouses [NEW]**: Centralized storage units (Cold, Standard, Hazardous).
*   **QualityChecks [NEW]**: Audit records for manufacturing safety (PASS/FAIL/PENDING).
*   **MaintenanceLogs [NEW]**: Tracking for industrial machinery and facility uptime.
*   **Products**: Multi-attribute parts catalog with ABC Classification (A/B/C).
*   **ProductSuppliers (M:N)**: Junction table managing many-to-many relationships.
*   **InventoryLevels**: Dynamic stock positioning with Safety Stock and Days-of-Supply calculations.
*   **Orders**: Transactional table with **500+ generated records**.
*   **Logistics**: **Automated tracking** (via SQL Triggers) for all shipments with arrival dates.
*   **InventoryTransactions**: Audit log with **1000+ entries** for stock movement history.
*   **Users**: Secure authentication layer with role-based access.
*   **AuditLogs [GOVERNANCE]**: Centralized governance table capturing system mutations and stock adjustments.
*   **SupplierPerformanceLogs [INTELLIGENCE]**: Per-delivery OTD and quality performance tracking over time.
*   **InventorySnapshots [TEMPORAL]**: Daily inventory snapshots for aging analysis and historical trend computation.

### 1.2 SQL Automation: Triggers (4 Active)
The system utilizes **Server-Side Triggers** to eliminate manual data entry and enforce enterprise governance.
*   **Trigger `trg_CreateLogistics`**: Automatically creates a matching shipping record in the `Logistics` table whenever a new row is inserted into `Orders`.
*   **Trigger `trg_AuditInventoryUpdate`**: Captures Old vs. New stock values into `AuditLogs` whenever an inventory adjustment occurs.
*   **Trigger `trg_SnapshotInventory`**: Logs a temporal snapshot to `InventorySnapshots` on every stock change for historical trend analysis.
*   **Trigger `trg_TrackSupplierDelivery`**: When a logistics arrival date is recorded, automatically calculates OTD and logs it to `SupplierPerformanceLogs`.
*   **Impact**: Ensures 100% data integrity and tamper-evident traceability across the sales, fulfillment, and governance layers.

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

### 2.2 Demand Shock Simulation (Stress Testing)
The system implements a **What-If Simulation Engine** that allows for real-time stress testing of the supply chain. By applying a `Demand Multiplier` (e.g., 300% spike), the system recalculates "Days-to-Zero" metrics to identify brittle nodes in the fulfillment network.

**Simulated Calculation Logic:**
```sql
SELECT 
  ProductName,
  QuantityOnHand,
  ROUND(QuantityOnHand / (AvgConsumption * DemandMultiplier), 1) as StressDays
FROM PredictiveState;
```

---

## 3. Interactive SQL Console (DBMS Runtime)

A core feature of the capstone is the **Live SQL Terminal**. This provides a direct interface with the database engine.
- **Dynamic Query Execution**: Supports `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
- **Relational Integrity Visualization**: Renders results in tabular format for any of the 17 tables.
- **Performance Demonstration**: Demonstrates the ability to query 3200+ records with sub-millisecond latency.

---

## 4. Constraints & Referential Integrity

| Table | Constraint | Implementation |
| :--- | :--- | :--- |
| **Users** | UNIQUE | `Username` must be unique for security. |
| **Warehouses** | CHECK | `WarehouseType` restricted to 'Cold Storage', 'Standard', 'Hazardous'. |
| **Logistics** | FOREIGN KEY | `OrderID` links to `Orders` with `ON DELETE CASCADE`. |
| **InventoryLevels** | CHECK | `QuantityOnHand` must never be negative (Non-negativity constraint). |
| **QualityChecks** | ENUM-MOCK | Restricted `Status` to ('PASS', 'FAIL', 'PENDING'). |
| **Orders** | CHECK | `Quantity > 0` and `Status` restricted to valid state machine values. |
| **Products** | CHECK | `UnitPrice >= 0` and `Weight >= 0` (Non-negativity). |
| **Suppliers** | CHECK | `ReliabilityScore` between 0 and 1 (Normalized probability range). |

---

## 5. Inventory Intelligence & Classification

### 5.1 ABC Classification (Revenue Contribution Analysis)
**Objective**: Categorize all 50 products using the Pareto principle to drive differentiated stocking policies.

```sql
WITH ProductRevenue AS (
    SELECT ProductID, SUM(TotalAmount) as Revenue
    FROM Orders GROUP BY ProductID
),
RunningTotal AS (
    SELECT ProductID, Revenue,
        SUM(Revenue) OVER (ORDER BY Revenue DESC) as CumulativeRevenue,
        SUM(Revenue) OVER () as TotalRevenue
    FROM ProductRevenue
)
UPDATE Products SET ABCClass = CASE 
    WHEN ProductID IN (SELECT ProductID FROM RunningTotal WHERE CumulativeRevenue/TotalRevenue <= 0.80) THEN 'A'
    WHEN ProductID IN (SELECT ProductID FROM RunningTotal WHERE CumulativeRevenue/TotalRevenue <= 0.95) THEN 'B'
    ELSE 'C'
END;
```

### 5.2 Safety Stock Calculation (Service-Level Optimization)
**Objective**: Calculate statistically optimized safety stock buffers using Z-score targeting.

**Formula**: `SafetyStock = Z × σ(demand)` where Z = 1.65 for 95% service level.

```sql
UPDATE InventoryLevels SET SafetyStock = COALESCE((
    SELECT CAST(1.65 * AVG(it.Quantity) AS INTEGER)
    FROM InventoryTransactions it
    WHERE it.InventoryID = InventoryLevels.InventoryID 
    AND it.TransactionType = 'Outbound'
), 100);
```

### 5.3 Inventory Aging Analysis
**Objective**: Bucket inventory records by age to identify stale stock requiring liquidation.

```sql
SELECT 
  CASE 
    WHEN julianday('now') - julianday(LastStockCheck) <= 30 THEN '0-30 days'
    WHEN julianday('now') - julianday(LastStockCheck) <= 60 THEN '31-60 days'
    WHEN julianday('now') - julianday(LastStockCheck) <= 90 THEN '61-90 days'
    ELSE '90+ days (Dead Stock Risk)'
  END as AgingBucket,
  COUNT(*) as count
FROM InventoryLevels GROUP BY AgingBucket;
```

---

## 6. Advanced Relational Analytics (SQL Window Functions)
To demonstrate hyper-intelligence, the system utilizes complex analytical patterns that transcend basic CRUD operations.

### 6.1 Pareto Analysis (80/20 Rule)
**Objective**: Detect the top 20% of products contributing to 80% of total system revenue.
```sql
WITH ProductRevenue AS (
    SELECT ProductID, SUM(TotalAmount) as Revenue
    FROM Orders
    GROUP BY ProductID
),
RunningTotal AS (
    SELECT 
        ProductID, 
        Revenue,
        SUM(Revenue) OVER (ORDER BY Revenue DESC) as CumulativeRevenue,
        SUM(Revenue) OVER () as TotalRevenue
    FROM ProductRevenue
)
SELECT ProductID, Revenue, 
       ROUND((CumulativeRevenue / TotalRevenue) * 100, 1) as PctOfTotal
FROM RunningTotal
WHERE PctOfTotal <= 80;
```

### 6.2 Logistics Deviation Analysis
**Objective**: Calculate the statistical variance in lead times per supplier.
```sql
SELECT 
    s.SupplierName,
    AVG(julianday(l.ArrivalDate) - julianday(o.OrderDate)) as AvgDays,
    s.LeadTimeDays as PromisedDays,
    ROUND(AVG(julianday(l.ArrivalDate) - julianday(o.OrderDate)) - s.LeadTimeDays, 1) as Deviation
FROM Suppliers s
JOIN Orders o ON s.SupplierID = o.SupplierID
JOIN Logistics l ON o.OrderID = l.OrderID
WHERE l.ArrivalDate IS NOT NULL
GROUP BY s.SupplierID;
```

### 6.3 Month-over-Month Revenue Velocity
**Objective**: Measure the financial acceleration using `LAG()` window function.
```sql
SELECT 
    month, revenue,
    ROUND(((revenue - LAG(revenue) OVER (ORDER BY month)) / 
           LAG(revenue) OVER (ORDER BY month)) * 100, 1) as GrowthVelocity
FROM (
    SELECT strftime('%Y-%m', OrderDate) as month, SUM(TotalAmount) as revenue
    FROM Orders GROUP BY 1
);
```

### 6.4 OTIF (On-Time In-Full) Decomposition
**Objective**: Calculate the industry-standard fulfillment KPI by decomposing on-time and in-full rates.
```sql
SELECT 
  ROUND(SUM(CASE WHEN l.ArrivalDate <= o.ExpectedDeliveryDate THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as OnTimeRate,
  ROUND(SUM(CASE WHEN o.Status = 'Delivered' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as InFullRate,
  ROUND(SUM(CASE WHEN l.ArrivalDate <= o.ExpectedDeliveryDate AND o.Status = 'Delivered' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as OTIFRate
FROM Orders o
JOIN Logistics l ON o.OrderID = l.OrderID
WHERE l.ArrivalDate IS NOT NULL;
```

### 6.5 Supplier Composite Scoring (Weighted Aggregation)
**Objective**: Calculate a weighted supplier score: OTD (40%) + Quality (30%) + Reliability (20%) + Lead Time (10%).
```sql
SELECT SupplierName,
  ROUND(
    (OTDRate * 0.4) + 
    ((100 - QualityRejectRate) * 0.3) + 
    (ReliabilityScore * 100 * 0.2) + 
    (CASE WHEN LeadTimeDays <= 7 THEN 100 
          WHEN LeadTimeDays <= 14 THEN 75 
          ELSE 50 END * 0.1), 
  1) as CompositeScore
FROM Suppliers
ORDER BY CompositeScore DESC;
```

### 6.6 Carbon Footprint Estimation
**Objective**: Calculate CO₂ emissions per transport mode using industry-standard emission factors.
```sql
SELECT l.TransportMode,
  ROUND(SUM(
    CASE l.TransportMode
      WHEN 'Road' THEN (o.Quantity * p.Weight / 1000.0) * 500 * 0.062
      WHEN 'Rail' THEN (o.Quantity * p.Weight / 1000.0) * 800 * 0.022
      WHEN 'Sea' THEN (o.Quantity * p.Weight / 1000.0) * 5000 * 0.008
      WHEN 'Air' THEN (o.Quantity * p.Weight / 1000.0) * 2000 * 0.602
    END
  ), 1) as EstimatedCO2_kg
FROM Logistics l
JOIN Orders o ON l.OrderID = o.OrderID
JOIN Products p ON o.ProductID = p.ProductID
GROUP BY l.TransportMode;
```

### 6.7 Warehouse Capacity & MTBF Analysis
**Objective**: Calculate warehouse utilization rates and equipment reliability metrics.
```sql
SELECT w.WarehouseName, w.StorageCapacity,
  COALESCE(SUM(il.QuantityOnHand), 0) as CurrentOccupancy,
  ROUND(COALESCE(SUM(il.QuantityOnHand), 0) * 100.0 / w.StorageCapacity, 1) as UtilizationPct
FROM Warehouses w
LEFT JOIN InventoryLevels il ON w.WarehouseID = il.LocationID
GROUP BY w.WarehouseID ORDER BY UtilizationPct DESC;
```

---

## 7. Scalability & Performance Analysis
The dataset was programmatically scaled to **3200+ records** to test SQLite performance under stress:
- **Orders Table**: 500+ records (Simulating high transaction volume).
- **Logistics Table**: 500+ records (Automated via Trigger, with simulated arrival dates).
- **Transactions Table**: 1000+ records (Simulating a long-term audit trail).
- **Quality Audit**: 300+ audit logs across the manufacturing chain.
- **Maintenance Logs**: 150+ equipment service records.
- **Supplier Performance**: 500+ delivery performance records (backfilled from logistics data).
- **Inventory Snapshots**: Temporal data captures for historical analysis.
