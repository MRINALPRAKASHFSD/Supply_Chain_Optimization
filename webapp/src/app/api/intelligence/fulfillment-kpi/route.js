import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db.js';

export async function GET() {
  try {
    const db = getDb();

    // 1. OTIF (On-Time In-Full) Rate
    const otif = db.prepare(`
      SELECT 
        COUNT(*) as TotalOrders,
        SUM(CASE WHEN l.ArrivalDate <= o.ExpectedDeliveryDate THEN 1 ELSE 0 END) as OnTimeCount,
        SUM(CASE WHEN o.Status = 'Delivered' THEN 1 ELSE 0 END) as InFullCount,
        SUM(CASE WHEN l.ArrivalDate <= o.ExpectedDeliveryDate AND o.Status = 'Delivered' THEN 1 ELSE 0 END) as OTIFCount,
        ROUND(SUM(CASE WHEN l.ArrivalDate <= o.ExpectedDeliveryDate THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as OnTimeRate,
        ROUND(SUM(CASE WHEN o.Status = 'Delivered' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as InFullRate,
        ROUND(SUM(CASE WHEN l.ArrivalDate <= o.ExpectedDeliveryDate AND o.Status = 'Delivered' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as OTIFRate
      FROM Orders o
      JOIN Logistics l ON o.OrderID = l.OrderID
      WHERE l.ArrivalDate IS NOT NULL
    `).get();

    // 2. Fill Rate (line-level)
    const fillRate = db.prepare(`
      SELECT 
        ROUND(SUM(CASE WHEN Status IN ('Delivered', 'In Transit') THEN Quantity ELSE 0 END) * 100.0 / SUM(Quantity), 1) as FillRate
      FROM Orders
    `).get();

    // 3. Order Cycle Time by Status
    const cycleTime = db.prepare(`
      SELECT 
        Status,
        COUNT(*) as OrderCount,
        ROUND(AVG(julianday(COALESCE(l.ArrivalDate, date('now'))) - julianday(o.OrderDate)), 1) as AvgCycleDays
      FROM Orders o
      LEFT JOIN Logistics l ON o.OrderID = l.OrderID
      GROUP BY Status
    `).all();

    // 4. Revenue Velocity (Month-over-Month with LAG)
    const revenueVelocity = db.prepare(`
      WITH Monthly AS (
        SELECT strftime('%Y-%m', OrderDate) as month, SUM(TotalAmount) as revenue
        FROM Orders GROUP BY 1 ORDER BY 1
      )
      SELECT month, revenue,
        LAG(revenue) OVER (ORDER BY month) as prevRevenue,
        CASE 
          WHEN LAG(revenue) OVER (ORDER BY month) IS NOT NULL 
          THEN ROUND(((revenue - LAG(revenue) OVER (ORDER BY month)) / LAG(revenue) OVER (ORDER BY month)) * 100, 1)
          ELSE NULL
        END as GrowthPct
      FROM Monthly
    `).all();

    // 5. Perfect Order Rate
    const perfectOrder = db.prepare(`
      SELECT 
        ROUND(SUM(CASE 
          WHEN o.Status = 'Delivered' 
          AND l.ArrivalDate <= o.ExpectedDeliveryDate 
          AND qc.Status = 'PASS'
          THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as PerfectOrderRate
      FROM Orders o
      JOIN Logistics l ON o.OrderID = l.OrderID
      LEFT JOIN QualityChecks qc ON o.ProductID = qc.ProductID
      WHERE l.ArrivalDate IS NOT NULL
    `).get();

    return NextResponse.json({
      success: true,
      data: { otif, fillRate, cycleTime, revenueVelocity, perfectOrder }
    });
  } catch (error) {
    console.error("Fulfillment KPI API Error:", error);
    return NextResponse.json({ success: false, error: 'Fulfillment analysis failed.' }, { status: 500 });
  }
}
