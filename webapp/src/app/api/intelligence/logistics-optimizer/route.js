import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db.js';

export async function GET() {
  try {
    const db = getDb();

    // 1. Cost-per-unit by Transport Mode
    const costPerUnit = db.prepare(`
      SELECT l.TransportMode,
        COUNT(*) as ShipmentCount,
        ROUND(AVG(l.ShippingCost), 2) as AvgCost,
        ROUND(SUM(l.ShippingCost), 2) as TotalCost,
        ROUND(AVG(l.ShippingCost / NULLIF(o.Quantity, 0)), 2) as CostPerUnit
      FROM Logistics l
      JOIN Orders o ON l.OrderID = o.OrderID
      GROUP BY l.TransportMode
    `).all();

    // 2. Shipping Cost as % of Order Value
    const costToOrderRatio = db.prepare(`
      SELECT 
        ROUND(SUM(l.ShippingCost) * 100.0 / SUM(o.TotalAmount), 2) as ShippingCostPct,
        ROUND(SUM(l.ShippingCost), 2) as TotalShipping,
        ROUND(SUM(o.TotalAmount), 2) as TotalRevenue
      FROM Orders o
      JOIN Logistics l ON o.OrderID = l.OrderID
    `).get();

    // 3. Carrier Performance Comparison
    const carrierPerformance = db.prepare(`
      SELECT l.CarrierName,
        COUNT(*) as Deliveries,
        ROUND(AVG(julianday(l.ArrivalDate) - julianday(l.DispatchDate)), 1) as AvgTransitDays,
        ROUND(AVG(l.ShippingCost), 2) as AvgCost
      FROM Logistics l
      WHERE l.ArrivalDate IS NOT NULL
      GROUP BY l.CarrierName
      ORDER BY AvgTransitDays ASC
    `).all();

    // 4. Carbon Footprint Estimate per Transport Mode
    // Emission factors (kg CO2 per ton-km): Road=0.062, Rail=0.022, Sea=0.008, Air=0.602
    const carbonFootprint = db.prepare(`
      SELECT l.TransportMode,
        COUNT(*) as Shipments,
        ROUND(SUM(
          CASE l.TransportMode
            WHEN 'Road' THEN (o.Quantity * p.Weight / 1000.0) * 500 * 0.062
            WHEN 'Rail' THEN (o.Quantity * p.Weight / 1000.0) * 800 * 0.022
            WHEN 'Sea' THEN (o.Quantity * p.Weight / 1000.0) * 5000 * 0.008
            WHEN 'Air' THEN (o.Quantity * p.Weight / 1000.0) * 2000 * 0.602
            ELSE 0
          END
        ), 1) as EstimatedCO2_kg
      FROM Logistics l
      JOIN Orders o ON l.OrderID = o.OrderID
      JOIN Products p ON o.ProductID = p.ProductID
      GROUP BY l.TransportMode
    `).all();

    // 5. Cost-to-Serve Waterfall Breakdown
    const costToServe = db.prepare(`
      SELECT 
        ROUND(SUM(o.TotalAmount * 0.60), 2) as ProcurementCost,
        ROUND(SUM(l.ShippingCost), 2) as LogisticsCost,
        ROUND(SUM(o.TotalAmount * 0.05), 2) as WarehousingCost,
        ROUND(SUM(o.TotalAmount * 0.03), 2) as OverheadCost,
        ROUND(SUM(o.TotalAmount) - SUM(o.TotalAmount * 0.60) - SUM(l.ShippingCost) - SUM(o.TotalAmount * 0.05) - SUM(o.TotalAmount * 0.03), 2) as GrossMargin
      FROM Orders o
      JOIN Logistics l ON o.OrderID = l.OrderID
    `).get();

    return NextResponse.json({
      success: true,
      data: { costPerUnit, costToOrderRatio, carrierPerformance, carbonFootprint, costToServe }
    });
  } catch (error) {
    console.error("Logistics Optimizer API Error:", error);
    return NextResponse.json({ success: false, error: 'Logistics analysis failed.' }, { status: 500 });
  }
}
