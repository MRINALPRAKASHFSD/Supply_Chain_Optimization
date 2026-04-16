import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db.js';

export async function GET() {
  try {
    const db = getDb();

    // 1. ABC/XYZ Classification Distribution
    const abcDistribution = db.prepare(`
      SELECT ABCClass, COUNT(*) as count,
        SUM(UnitPrice) as totalValue
      FROM Products
      GROUP BY ABCClass
      ORDER BY ABCClass
    `).all();

    // 2. Inventory Aging Buckets
    const inventoryAging = db.prepare(`
      SELECT 
        CASE 
          WHEN julianday('now') - julianday(il.LastStockCheck) <= 30 THEN '0-30 days'
          WHEN julianday('now') - julianday(il.LastStockCheck) <= 60 THEN '31-60 days'
          WHEN julianday('now') - julianday(il.LastStockCheck) <= 90 THEN '61-90 days'
          ELSE '90+ days'
        END as AgingBucket,
        COUNT(*) as count,
        SUM(il.QuantityOnHand) as totalStock
      FROM InventoryLevels il
      GROUP BY AgingBucket
    `).all();

    // 3. Dead Stock Detection (zero outbound transactions)
    const deadStock = db.prepare(`
      SELECT p.ProductName, il.QuantityOnHand, il.LastStockCheck
      FROM InventoryLevels il
      JOIN Products p ON il.ProductID = p.ProductID
      WHERE il.InventoryID NOT IN (
        SELECT DISTINCT InventoryID FROM InventoryTransactions 
        WHERE TransactionType = 'Outbound'
        AND TransactionDate >= date('now', '-90 days')
      )
      ORDER BY il.QuantityOnHand DESC
      LIMIT 10
    `).all();

    // 4. Days of Supply Analysis
    const daysOfSupply = db.prepare(`
      SELECT p.ProductName, p.ABCClass,
        il.QuantityOnHand, il.SafetyStock, il.DaysOfSupply,
        CASE
          WHEN il.QuantityOnHand <= il.SafetyStock THEN 'CRITICAL'
          WHEN il.DaysOfSupply <= 14 THEN 'LOW'
          WHEN il.DaysOfSupply <= 30 THEN 'ADEQUATE'
          ELSE 'EXCESS'
        END as HealthStatus
      FROM InventoryLevels il
      JOIN Products p ON il.ProductID = p.ProductID
      ORDER BY il.DaysOfSupply ASC
      LIMIT 20
    `).all();

    // 5. Safety Stock Adequacy
    const safetyStockAdequacy = db.prepare(`
      SELECT 
        SUM(CASE WHEN QuantityOnHand > SafetyStock * 2 THEN 1 ELSE 0 END) as overStocked,
        SUM(CASE WHEN QuantityOnHand > SafetyStock THEN 1 ELSE 0 END) as adequate,
        SUM(CASE WHEN QuantityOnHand <= SafetyStock THEN 1 ELSE 0 END) as belowSafety,
        SUM(CASE WHEN QuantityOnHand <= SafetyStock * 0.5 THEN 1 ELSE 0 END) as critical
      FROM InventoryLevels
    `).get();

    return NextResponse.json({
      success: true,
      data: { abcDistribution, inventoryAging, deadStock, daysOfSupply, safetyStockAdequacy }
    });
  } catch (error) {
    console.error("Inventory Health API Error:", error);
    return NextResponse.json({ success: false, error: 'Inventory analysis failed.' }, { status: 500 });
  }
}
