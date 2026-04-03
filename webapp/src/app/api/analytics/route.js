import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db.js';

export async function GET() {
  try {
    const db = getDb();

    // 1. Metadata: Dynamic row counts for all 14 tables
    const tableNames = [
      'Suppliers', 'Manufacturers', 'Distributors', 'Warehouses', 'Categories', 
      'Products', 'ProductSuppliers', 'InventoryLevels', 'Orders', 'Logistics', 
      'InventoryTransactions', 'Users', 'QualityChecks', 'MaintenanceLogs'
    ];
    
    const tables = {};
    let totalRecords = 0;
    
    tableNames.forEach(name => {
      try {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${name}`).get().count;
        tables[name] = count;
        totalRecords += count;
      } catch (e) {
        tables[name] = 0;
      }
    });

    const metadata = {
      totalRecords,
      tables,
      lastUpdated: new Date().toISOString()
    };

    // 2. Predictive Stock Depletion (Next-Gen SQL Analytics)
    // CTE to calculate consumption rate over last 1000 transactions
    const stockOutPrediction = db.prepare(`
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
        c.TotalOut,
        ROUND((CAST(il.QuantityOnHand AS FLOAT) / (CAST(c.TotalOut AS FLOAT) / CAST(c.TxCount AS FLOAT))), 1) as EstimatedDays
      FROM InventoryLevels il
      JOIN Products p ON il.ProductID = p.ProductID
      JOIN Consumption c ON il.InventoryID = c.InventoryID
      WHERE il.QuantityOnHand < 2000
      ORDER BY EstimatedDays ASC
      LIMIT 5
    `).all();

    // 3. Manufacturing Quality Audit
    const qualityAudit = db.prepare(`
      SELECT Status, COUNT(*) as Count, 
      ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM QualityChecks), 1) as Percentage
      FROM QualityChecks
      GROUP BY Status
    `).all();

    // 4. Logistics Efficiency (Trigger-Verified Data)
    const logisticsEfficiency = db.prepare(`
      SELECT TransportMode, COUNT(*) as count, AVG(ShippingCost) as avgCost
      FROM Logistics
      GROUP BY TransportMode
    `).all();

    // 5. Existing Analytics (Core Visuals)
    const inventoryAnalysis = db.prepare(`
      SELECT p.ProductName, SUM(il.QuantityOnHand) as TotalStock
      FROM Products p
      JOIN InventoryLevels il ON p.ProductID = il.ProductID
      GROUP BY p.ProductID
      ORDER BY TotalStock DESC
      LIMIT 15
    `).all();

    const supplierRankings = db.prepare(`
      SELECT SupplierName, ReliabilityScore, LeadTimeDays
      FROM Suppliers
      ORDER BY ReliabilityScore DESC
      LIMIT 10
    `).all();

    const diversification = db.prepare(`
      SELECT p.ProductName, COUNT(ps.SupplierID) as SupplierCount,
      GROUP_CONCAT(s.SupplierName, ', ') as SupplierList
      FROM Products p
      JOIN ProductSuppliers ps ON p.ProductID = ps.ProductID
      JOIN Suppliers s ON ps.SupplierID = s.SupplierID
      GROUP BY p.ProductID
      HAVING SupplierCount > 1
      LIMIT 10
    `).all();

    const regionalLogistics = db.prepare(`
      SELECT RegionCovered as region, SUM(StorageCapacity) as value
      FROM Distributors
      GROUP BY RegionCovered
    `).all();

    const financialTrends = db.prepare(`
      SELECT strftime('%Y-%m', OrderDate) as month, SUM(TotalAmount) as revenue
      FROM Orders
      GROUP BY month
      ORDER BY month ASC
    `).all();

    return NextResponse.json({
      success: true,
      data: {
        metadata,
        stockOutPrediction,
        qualityAudit,
        inventoryAnalysis,
        supplierRankings,
        diversification,
        regionalLogistics,
        financialTrends,
        logisticsEfficiency
      }
    });
  } catch (error) {
    console.error("Advanced API Error:", error);
    return NextResponse.json({ success: false, error: 'Database analysis failed' }, { status: 500 });
  }
}
