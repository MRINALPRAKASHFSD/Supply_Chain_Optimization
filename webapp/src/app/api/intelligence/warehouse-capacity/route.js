import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db.js';

export async function GET() {
  try {
    const db = getDb();

    // 1. Warehouse Utilization
    const utilization = db.prepare(`
      SELECT 
        w.WarehouseID, w.WarehouseName, w.Location, w.WarehouseType, w.StorageCapacity,
        COALESCE(SUM(il.QuantityOnHand), 0) as CurrentOccupancy,
        ROUND(COALESCE(SUM(il.QuantityOnHand), 0) * 100.0 / w.StorageCapacity, 1) as UtilizationPct,
        CASE
          WHEN COALESCE(SUM(il.QuantityOnHand), 0) * 100.0 / w.StorageCapacity >= 90 THEN 'CRITICAL'
          WHEN COALESCE(SUM(il.QuantityOnHand), 0) * 100.0 / w.StorageCapacity >= 70 THEN 'HIGH'
          WHEN COALESCE(SUM(il.QuantityOnHand), 0) * 100.0 / w.StorageCapacity >= 40 THEN 'OPTIMAL'
          ELSE 'LOW'
        END as Status
      FROM Warehouses w
      LEFT JOIN InventoryLevels il ON w.WarehouseID = il.LocationID AND il.LocationType = 'Manufacturer'
      GROUP BY w.WarehouseID
      ORDER BY UtilizationPct DESC
    `).all();

    // 2. Storage Type Distribution
    const storageTypes = db.prepare(`
      SELECT WarehouseType, COUNT(*) as count, SUM(StorageCapacity) as totalCapacity
      FROM Warehouses
      GROUP BY WarehouseType
    `).all();

    // 3. Maintenance Health (MTBF - Mean Time Between Failures)
    const maintenanceHealth = db.prepare(`
      SELECT 
        EquipmentName,
        COUNT(*) as MaintenanceEvents,
        MaintenanceType,
        ROUND(AVG(CASE WHEN Cost IS NOT NULL THEN Cost ELSE 0 END), 2) as AvgCost,
        MAX(MaintenanceDate) as LastMaintenance
      FROM MaintenanceLogs
      GROUP BY EquipmentName, MaintenanceType
      ORDER BY MaintenanceEvents DESC
      LIMIT 15
    `).all();

    // 4. Capacity Forecast (days until full)
    const capacityForecast = db.prepare(`
      WITH InboundRate AS (
        SELECT LocationID, ROUND(AVG(Quantity), 1) as AvgDailyInbound
        FROM InventoryTransactions
        WHERE TransactionType = 'Inbound'
        GROUP BY LocationID
      )
      SELECT w.WarehouseName,
        w.StorageCapacity - COALESCE(SUM(il.QuantityOnHand), 0) as RemainingCapacity,
        ir.AvgDailyInbound,
        CASE WHEN ir.AvgDailyInbound > 0 
          THEN ROUND((w.StorageCapacity - COALESCE(SUM(il.QuantityOnHand), 0)) / ir.AvgDailyInbound, 0)
          ELSE 999
        END as DaysUntilFull
      FROM Warehouses w
      LEFT JOIN InventoryLevels il ON w.WarehouseID = il.LocationID
      LEFT JOIN InboundRate ir ON w.WarehouseID = ir.LocationID
      GROUP BY w.WarehouseID
    `).all();

    return NextResponse.json({
      success: true,
      data: { utilization, storageTypes, maintenanceHealth, capacityForecast }
    });
  } catch (error) {
    console.error("Warehouse Capacity API Error:", error);
    return NextResponse.json({ success: false, error: 'Warehouse analysis failed.' }, { status: 500 });
  }
}
