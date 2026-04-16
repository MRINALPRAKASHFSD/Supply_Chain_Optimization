import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Check for Vercel or Netlify environment to handle read-only filesystems
const isServerless = process.env.VERCEL === '1' || process.env.NETLIFY === 'true';

// Construct the path to the database file
// On Vercel, we MUST use the /tmp directory as the rest of the filesystem is read-only.
// To ensure the system stays online, we copy our "Master Template" from the repo to /tmp.
const masterDbPath = path.resolve(process.cwd(), 'supply_chain.db');
const activeDbPath = isServerless ? path.resolve('/tmp', 'supply_chain.db') : masterDbPath;

if (isServerless && !fs.existsSync(activeDbPath)) {
  if (fs.existsSync(masterDbPath)) {
    console.log("🚚 Syncing Master Intelligence Database to Neural Grid...");
    fs.copyFileSync(masterDbPath, activeDbPath);
  }
}

function initializeDatabase(db) {
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='Users'").get();
  if (tableExists) return;

  console.log("🛠️ Initializing Hyper-Enterprise Schema [Auto-Seed]...");
  const setupSchema = `
    CREATE TABLE IF NOT EXISTS Categories (CategoryID INTEGER PRIMARY KEY AUTOINCREMENT, CategoryName VARCHAR(100) NOT NULL UNIQUE, Description TEXT);
    CREATE TABLE IF NOT EXISTS Suppliers (SupplierID INTEGER PRIMARY KEY AUTOINCREMENT, SupplierName VARCHAR(255) NOT NULL, Location VARCHAR(255) NOT NULL, ReliabilityScore DECIMAL(3, 2), LeadTimeDays INTEGER DEFAULT 7);
    CREATE TABLE IF NOT EXISTS Manufacturers (ManufacturerID INTEGER PRIMARY KEY AUTOINCREMENT, ManufacturerName VARCHAR(255) NOT NULL, Location VARCHAR(255), ProductionCapacity INTEGER);
    CREATE TABLE IF NOT EXISTS Distributors (DistributorID INTEGER PRIMARY KEY AUTOINCREMENT, DistributorName VARCHAR(255) NOT NULL, Location VARCHAR(255), RegionCovered VARCHAR(255) NOT NULL, StorageCapacity INTEGER);
    CREATE TABLE IF NOT EXISTS Products (ProductID INTEGER PRIMARY KEY AUTOINCREMENT, ProductName VARCHAR(255) NOT NULL, CategoryID INTEGER, UnitPrice DECIMAL(10, 2) NOT NULL, Weight DECIMAL(10, 2), FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID));
    CREATE TABLE IF NOT EXISTS ProductSuppliers (ProductID INTEGER NOT NULL, SupplierID INTEGER NOT NULL, IsPrimary BOOLEAN DEFAULT 0, PRIMARY KEY (ProductID, SupplierID));
    CREATE TABLE IF NOT EXISTS InventoryLevels (InventoryID INTEGER PRIMARY KEY AUTOINCREMENT, ProductID INTEGER NOT NULL, LocationID INTEGER NOT NULL, LocationType VARCHAR(50), QuantityOnHand INTEGER NOT NULL, ReorderPoint INTEGER NOT NULL, MaxCapacity INTEGER NOT NULL, LastStockCheck DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS Orders (OrderID INTEGER PRIMARY KEY AUTOINCREMENT, ProductID INTEGER NOT NULL, SupplierID INTEGER, OrderDate DATE NOT NULL, ExpectedDeliveryDate DATE, Quantity INTEGER NOT NULL, Status VARCHAR(50) DEFAULT 'Pending', TotalAmount DECIMAL(12, 2), DistributorID INTEGER);
    CREATE TABLE IF NOT EXISTS Logistics (LogisticsID INTEGER PRIMARY KEY AUTOINCREMENT, OrderID INTEGER UNIQUE NOT NULL, TransportMode VARCHAR(50), ShippingCost DECIMAL(10, 2), DispatchDate DATE, ArrivalDate DATE, CarrierName VARCHAR(100), TrackingNumber VARCHAR(100) UNIQUE);
    CREATE TABLE IF NOT EXISTS InventoryTransactions (TransactionID INTEGER PRIMARY KEY AUTOINCREMENT, InventoryID INTEGER NOT NULL, TransactionType VARCHAR(50), Quantity INTEGER NOT NULL, TransactionDate DATETIME DEFAULT CURRENT_TIMESTAMP, ReferenceID VARCHAR(100));
    CREATE TABLE IF NOT EXISTS Users (UserID INTEGER PRIMARY KEY AUTOINCREMENT, Username VARCHAR(100) NOT NULL UNIQUE, PasswordHash VARCHAR(255) NOT NULL, Role VARCHAR(50) DEFAULT 'Viewer');
    CREATE TABLE IF NOT EXISTS Warehouses (WarehouseID INTEGER PRIMARY KEY AUTOINCREMENT, WarehouseName VARCHAR(100) NOT NULL, Location VARCHAR(255), WarehouseType VARCHAR(50), MaxCapacity INTEGER, OccupancyLevel INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS QualityChecks (CheckID INTEGER PRIMARY KEY AUTOINCREMENT, BatchID VARCHAR(100) NOT NULL, ProductID INTEGER NOT NULL, Status VARCHAR(50), InspectorName VARCHAR(100), Notes TEXT, CheckDate DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS MaintenanceLogs (LogID INTEGER PRIMARY KEY AUTOINCREMENT, EntityID INTEGER NOT NULL, EntityType VARCHAR(50), TaskDescription TEXT NOT NULL, Criticality VARCHAR(50), MaintenanceDate DATE NOT NULL);

    -- Automated Logistics Trigger
    CREATE TRIGGER IF NOT EXISTS trg_CreateLogistics AFTER INSERT ON Orders BEGIN
        INSERT INTO Logistics (OrderID, TransportMode, ShippingCost, DispatchDate, CarrierName, TrackingNumber)
        VALUES (NEW.OrderID, 'Road', (NEW.TotalAmount * 0.05), date(NEW.OrderDate, '+1 day'), 'Enterprise Logistics v1', 'AUTO-' || NEW.OrderID || '-' || abs(random() % 1000));
    END;
  `;

  db.exec(setupSchema);

  // Default Admin
  db.prepare("INSERT INTO Users (Username, PasswordHash, Role) VALUES (?, ?, ?)").run('admin', 'admin123', 'Admin');

  // Core Sample Data for UI Vitals
  db.prepare("INSERT INTO Categories (CategoryName) VALUES (?)").run('Semiconductors');
  db.prepare("INSERT INTO Suppliers (SupplierName, Location) VALUES (?, ?)").run('TSMC', 'Taiwan');
  db.prepare("INSERT INTO Manufacturers (ManufacturerName, Location, ProductionCapacity) VALUES (?, ?, ?)").run('Apple Inc.', 'California', 1000000);
  db.prepare("INSERT INTO Products (ProductName, CategoryID, UnitPrice) VALUES (?, ?, ?)").run('iPhone M3 Max Chipset', 1, 1200.00);
  db.prepare("INSERT INTO InventoryLevels (ProductID, LocationID, LocationType, QuantityOnHand, ReorderPoint, MaxCapacity) VALUES (?, ?, ?, ?, ?, ?)").run(1, 1, 'Manufacturer', 500, 100, 1000);
  
  console.log("✅ Auto-Seed Complete. Admin Access Ready.");
}

export function getDb() {
  const db = new Database(activeDbPath, { verbose: console.log });
  initializeDatabase(db);
  return db;
}
