import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db.js';

export async function GET() {
  try {
    const db = getDb();

    // Advanced SQL: Join Orders with Logistics to calculate OTD (On-Time Delivery)
    // We compare ExpectedDeliveryDate with ArrivalDate
    const performance = db.prepare(`
      SELECT 
        s.SupplierName,
        s.Location,
        COUNT(o.OrderID) as TotalOrders,
        SUM(CASE WHEN l.ArrivalDate <= o.ExpectedDeliveryDate THEN 1 ELSE 0 END) as OnTimeOrders,
        ROUND(AVG(julianday(l.ArrivalDate) - julianday(o.OrderDate)), 1) as AvgActualLeadTime,
        s.LeadTimeDays as PromisedLeadTime,
        ROUND(SUM(CASE WHEN l.ArrivalDate <= o.ExpectedDeliveryDate THEN 1 ELSE 0 END) * 100.0 / COUNT(o.OrderID), 1) as OTD_Rate
      FROM Suppliers s
      JOIN Orders o ON s.SupplierID = o.SupplierID
      JOIN Logistics l ON o.OrderID = l.OrderID
      WHERE l.ArrivalDate IS NOT NULL
      GROUP BY s.SupplierID
      ORDER BY OTD_Rate DESC
    `).all();

    return NextResponse.json({ success: true, data: performance });
  } catch (error) {
    console.error("Supplier Performance API Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to calculate supplier intelligence.' }, { status: 500 });
  }
}
