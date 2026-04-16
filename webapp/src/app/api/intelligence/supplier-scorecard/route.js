import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db.js';

export async function GET() {
  try {
    const db = getDb();

    // 1. Composite Supplier Score = OTD(40%) + Quality(30%) + Cost(20%) + LeadTime(10%)
    const scorecard = db.prepare(`
      SELECT 
        s.SupplierID, s.SupplierName, s.Location,
        s.OTDRate,
        ROUND(100 - s.QualityRejectRate, 1) as QualityScore,
        s.LeadTimeDays,
        s.ReliabilityScore * 100 as ReliabilityPct,
        ROUND(
          (s.OTDRate * 0.4) + 
          ((100 - s.QualityRejectRate) * 0.3) + 
          (s.ReliabilityScore * 100 * 0.2) + 
          (CASE WHEN s.LeadTimeDays <= 7 THEN 100 
                WHEN s.LeadTimeDays <= 14 THEN 75 
                WHEN s.LeadTimeDays <= 21 THEN 50 
                ELSE 25 END * 0.1), 
        1) as CompositeScore,
        CASE 
          WHEN (s.OTDRate * 0.4) + ((100 - s.QualityRejectRate) * 0.3) + (s.ReliabilityScore * 100 * 0.2) >= 70 THEN 'Strategic'
          WHEN s.OTDRate >= 60 THEN 'Leverage'
          WHEN (SELECT COUNT(DISTINCT ps.ProductID) FROM ProductSuppliers ps WHERE ps.SupplierID = s.SupplierID) <= 2 THEN 'Bottleneck'
          ELSE 'Non-Critical'
        END as RiskClass
      FROM Suppliers s
      ORDER BY CompositeScore DESC
    `).all();

    // 2. Lead Time Sigma (Standard Deviation) per Supplier
    const leadTimeSigma = db.prepare(`
      SELECT 
        s.SupplierName,
        COUNT(spl.LogID) as DeliveryCount,
        ROUND(AVG(spl.ActualLeadDays), 1) as AvgLeadDays,
        s.LeadTimeDays as PromisedDays,
        ROUND(AVG(spl.ActualLeadDays) - s.LeadTimeDays, 1) as Deviation
      FROM Suppliers s
      LEFT JOIN SupplierPerformanceLogs spl ON s.SupplierID = spl.SupplierID
      GROUP BY s.SupplierID
      HAVING DeliveryCount > 0
      ORDER BY Deviation DESC
    `).all();

    // 3. Supplier Dependency Index (revenue concentration)
    const dependencyIndex = db.prepare(`
      SELECT s.SupplierName,
        SUM(o.TotalAmount) as TotalRevenue,
        ROUND(SUM(o.TotalAmount) * 100.0 / (SELECT SUM(TotalAmount) FROM Orders), 1) as RevenuePct
      FROM Suppliers s
      JOIN Orders o ON s.SupplierID = o.SupplierID
      GROUP BY s.SupplierID
      ORDER BY RevenuePct DESC
    `).all();

    return NextResponse.json({
      success: true,
      data: { scorecard, leadTimeSigma, dependencyIndex }
    });
  } catch (error) {
    console.error("Supplier Scorecard API Error:", error);
    return NextResponse.json({ success: false, error: 'Supplier analysis failed.' }, { status: 500 });
  }
}
