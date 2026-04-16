import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db.js';

export async function GET() {
  try {
    const db = getDb();

    // Economic Order Quantity (EOQ) + Safety Stock Formula Logic
    // Using unit price as holder for costs in this scale
    const orderAdvisor = db.prepare(`
      WITH DemandData AS (
        SELECT 
          ProductID, 
          AVG(Quantity) as AvgQty, 
          COUNT(*) as OrderFreq,
          SUM(Quantity) as AnnualDemand
        FROM Orders
        GROUP BY ProductID
      )
      SELECT 
        p.ProductName,
        il.QuantityOnHand,
        il.ReorderPoint as CurrentROP,
        ROUND(dd.AvgQty * 1.5, 0) as SafetyStock, -- 1.5 multiplier for service level
        ROUND(SQRT((2 * dd.AnnualDemand * 50) / (p.UnitPrice * 0.2)), 0) as EOQ, -- Economic Order Quantity formula
        CASE 
          WHEN il.QuantityOnHand <= (dd.AvgQty * 1.5) THEN 'CRITICAL: Stock Below Safety'
          WHEN il.QuantityOnHand <= il.ReorderPoint THEN 'ADVISORY: Replenish Now'
          ELSE 'STABLE'
        END as Status
      FROM InventoryLevels il
      JOIN Products p ON il.ProductID = p.ProductID
      JOIN DemandData dd ON il.ProductID = dd.ProductID
      ORDER BY il.QuantityOnHand ASC
    `).all();

    return NextResponse.json({ success: true, data: orderAdvisor });
  } catch (error) {
    console.error("Reorder Advisor API Error:", error);
    return NextResponse.json({ success: false, error: 'Simulation engine failure.' }, { status: 500 });
  }
}
