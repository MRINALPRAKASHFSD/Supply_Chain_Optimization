import { getDb } from '../lib/db.js';

const db = getDb();

const setupSchema = `
PRAGMA foreign_keys = OFF;

-- Drop tables if they exist to start fresh
DROP TABLE IF EXISTS ProductSuppliers;
DROP TABLE IF EXISTS InventoryTransactions;
DROP TABLE IF EXISTS Logistics;
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS InventoryLevels;
DROP TABLE IF EXISTS QualityChecks;
DROP TABLE IF EXISTS MaintenanceLogs;
DROP TABLE IF EXISTS Products;
DROP TABLE IF EXISTS Categories;
DROP TABLE IF EXISTS Distributors;
DROP TABLE IF EXISTS Manufacturers;
DROP TABLE IF EXISTS Suppliers;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Warehouses;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Warehouses;
DROP TABLE IF EXISTS QualityChecks;
DROP TABLE IF EXISTS MaintenanceLogs;

-- 1. Categories
CREATE TABLE Categories (
    CategoryID INTEGER PRIMARY KEY AUTOINCREMENT,
    CategoryName VARCHAR(100) NOT NULL UNIQUE,
    Description TEXT
);

-- 2. Suppliers
CREATE TABLE Suppliers (
    SupplierID INTEGER PRIMARY KEY AUTOINCREMENT,
    SupplierName VARCHAR(255) NOT NULL,
    Location VARCHAR(255) NOT NULL,
    ReliabilityScore DECIMAL(3, 2) CHECK (ReliabilityScore >= 0 AND ReliabilityScore <= 1),
    LeadTimeDays INTEGER DEFAULT 7
);

-- 3. Manufacturers
CREATE TABLE Manufacturers (
    ManufacturerID INTEGER PRIMARY KEY AUTOINCREMENT,
    ManufacturerName VARCHAR(255) NOT NULL,
    Location VARCHAR(255),
    ProductionCapacity INTEGER CHECK (ProductionCapacity > 0)
);

-- 4. Distributors
CREATE TABLE Distributors (
    DistributorID INTEGER PRIMARY KEY AUTOINCREMENT,
    DistributorName VARCHAR(255) NOT NULL,
    Location VARCHAR(255),
    RegionCovered VARCHAR(255) NOT NULL,
    StorageCapacity INTEGER
);

-- 5. Products
CREATE TABLE Products (
    ProductID INTEGER PRIMARY KEY AUTOINCREMENT,
    ProductName VARCHAR(255) NOT NULL,
    CategoryID INTEGER,
    UnitPrice DECIMAL(10, 2) NOT NULL CHECK (UnitPrice >= 0),
    Weight DECIMAL(10, 2) CHECK (Weight >= 0),
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID) ON DELETE SET NULL
);

-- 6. ProductSuppliers (NEW: Many-to-Many M:N Junction Table)
CREATE TABLE ProductSuppliers (
    ProductID INTEGER NOT NULL,
    SupplierID INTEGER NOT NULL,
    IsPrimary BOOLEAN DEFAULT 0,
    PRIMARY KEY (ProductID, SupplierID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    FOREIGN KEY (SupplierID) REFERENCES Suppliers(SupplierID) ON DELETE CASCADE
);

-- 7. Inventory Levels
CREATE TABLE InventoryLevels (
    InventoryID INTEGER PRIMARY KEY AUTOINCREMENT,
    ProductID INTEGER NOT NULL,
    LocationID INTEGER NOT NULL,
    LocationType VARCHAR(50) CHECK (LocationType IN ('Manufacturer', 'Distributor')),
    QuantityOnHand INTEGER NOT NULL CHECK (QuantityOnHand >= 0),
    ReorderPoint INTEGER NOT NULL CHECK (ReorderPoint >= 0),
    MaxCapacity INTEGER NOT NULL,
    LastStockCheck DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE
);

-- 8. Orders (Transactional - Increased Volume)
CREATE TABLE Orders (
    OrderID INTEGER PRIMARY KEY AUTOINCREMENT,
    ProductID INTEGER NOT NULL,
    SupplierID INTEGER,
    OrderDate DATE NOT NULL,
    ExpectedDeliveryDate DATE,
    Quantity INTEGER NOT NULL CHECK (Quantity > 0),
    Status VARCHAR(50) DEFAULT 'Pending' CHECK (Status IN ('Pending', 'Processing', 'In Transit', 'Delivered', 'Cancelled')),
    TotalAmount DECIMAL(12, 2),
    DistributorID INTEGER,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    FOREIGN KEY (SupplierID) REFERENCES Suppliers(SupplierID),
    FOREIGN KEY (DistributorID) REFERENCES Distributors(DistributorID)
);

-- 9. Logistics (Tracking)
CREATE TABLE Logistics (
    LogisticsID INTEGER PRIMARY KEY AUTOINCREMENT,
    OrderID INTEGER UNIQUE NOT NULL,
    TransportMode VARCHAR(50) CHECK (TransportMode IN ('Road', 'Rail', 'Sea', 'Air')),
    ShippingCost DECIMAL(10, 2) CHECK (ShippingCost >= 0),
    DispatchDate DATE,
    ArrivalDate DATE,
    CarrierName VARCHAR(100),
    TrackingNumber VARCHAR(100) UNIQUE,
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE
);

-- 10. Inventory Transactions (Large Audit Log)
CREATE TABLE InventoryTransactions (
    TransactionID INTEGER PRIMARY KEY AUTOINCREMENT,
    InventoryID INTEGER NOT NULL,
    TransactionType VARCHAR(50) CHECK (TransactionType IN ('Inbound', 'Outbound', 'Adjustment')),
    Quantity INTEGER NOT NULL,
    TransactionDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    ReferenceID VARCHAR(100),
    FOREIGN KEY (InventoryID) REFERENCES InventoryLevels(InventoryID) ON DELETE CASCADE
);

-- 11. Users Table (Authentication Layer)
CREATE TABLE Users (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    Username VARCHAR(100) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    Role VARCHAR(50) DEFAULT 'Viewer' CHECK (Role IN ('Admin', 'Viewer')),
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- NEW: 12. Warehouses (Normalization)
CREATE TABLE Warehouses (
    WarehouseID INTEGER PRIMARY KEY AUTOINCREMENT,
    WarehouseName VARCHAR(100) NOT NULL,
    Location VARCHAR(255),
    WarehouseType VARCHAR(50) CHECK (WarehouseType IN ('Cold Storage', 'Standard', 'Hazardous')),
    MaxCapacity INTEGER,
    OccupancyLevel INTEGER DEFAULT 0
);

-- NEW: 13. QualityChecks (Audit Logic)
CREATE TABLE QualityChecks (
    CheckID INTEGER PRIMARY KEY AUTOINCREMENT,
    BatchID VARCHAR(100) NOT NULL,
    ProductID INTEGER NOT NULL,
    Status VARCHAR(50) CHECK (Status IN ('PASS', 'FAIL', 'PENDING')),
    InspectorName VARCHAR(100),
    Notes TEXT,
    CheckDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE
);

-- NEW: 14. MaintenanceLogs (Operational Continuity)
CREATE TABLE MaintenanceLogs (
    LogID INTEGER PRIMARY KEY AUTOINCREMENT,
    EntityID INTEGER NOT NULL, -- ManufacturerID or WarehouseID
    EntityType VARCHAR(50) CHECK (EntityType IN ('Manufacturer', 'Warehouse')),
    TaskDescription TEXT NOT NULL,
    Criticality VARCHAR(50) CHECK (Criticality IN ('Routine', 'High', 'Emergency')),
    MaintenanceDate DATE NOT NULL,
    FOREIGN KEY (EntityID) REFERENCES Manufacturers(ManufacturerID)
);

-- ==========================================
-- SQL AUTOMATION: TRIGGERS
-- ==========================================

-- TRIGGER: AFTER INSERT ON Orders ➔ Auto-populates Logistics with default values
CREATE TRIGGER trg_CreateLogistics
AFTER INSERT ON Orders
BEGIN
    INSERT INTO Logistics (OrderID, TransportMode, ShippingCost, DispatchDate, CarrierName, TrackingNumber)
    VALUES (
        NEW.OrderID, 
        'Road', 
        (NEW.TotalAmount * 0.05), 
        date(NEW.OrderDate, '+1 day'), 
        'Enterprise Logistics v1', 
        'AUTO-' || NEW.OrderID || '-' || abs(random() % 1000)
    );
END;
`;

try {
    console.log("🛠️ Initializing Hyper-Enterprise Schema [14 Tables + Triggers]...");
    db.exec(setupSchema);

    // Default Admin (User: admin / Pass: admin123)
    const insertUser = db.prepare("INSERT INTO Users (Username, PasswordHash, Role) VALUES (?, ?, ?)");
    insertUser.run('admin', 'admin123', 'Admin');
    console.log("👤 Default User Created: admin / admin123");

    // Helpers
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const randomDate = (start, end) => {
        const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        return d.toISOString().split('T')[0];
    };

    // 1. Categories (Stock Sectors)
    const sectors = ['Consumer Tech', 'Semiconductors', 'Aerospace', 'Automotive', 'Energy & Chemicals', 'Healthcare', 'Infrastructure', 'Precision Tools', 'Logistics', 'Materials'];
    const insertCategory = db.prepare("INSERT INTO Categories (CategoryName, Description) VALUES (?, ?)");
    sectors.forEach(s => insertCategory.run(s, `Global ${s} stock sector distribution.`));

    // 2. Real-World Suppliers (Core Semiconductor & Component Providers)
    const regions = ['Taiwan', 'Mainland China', 'California, USA', 'Texas, USA', 'Germany', 'South Korea', 'Bengaluru, India', 'Tokyo, Japan', 'Hsinchu, Taiwan', 'London, UK'];
    const realSuppliers = [
        ['TSMC', 'Hsinchu, Taiwan', 0.98, 45],
        ['Foxconn', 'Shenzhen, China', 0.95, 20],
        ['Samsung Semiconductor', 'Pyeongtaek, South Korea', 0.93, 30],
        ['Intel Corporation', 'Santa Clara, USA', 0.90, 25],
        ['Robert Bosch GmbH', 'Stuttgart, Germany', 0.96, 15],
        ['ASML Holding', 'Veldhoven, Netherlands', 0.99, 120],
        ['Tata Steel', 'Jamshedpur, India', 0.91, 10], 
        ['Toshiba Corp', 'Tokyo, Japan', 0.89, 21],
        ['GlobalFoundries', 'New York, USA', 0.92, 40],
        ['Micron Technology', 'Idaho, USA', 0.94, 18],
        ['STMicroelectronics', 'Geneva, Switzerland', 0.93, 14],
        ['Reliance Polymers', 'Jamnagar, India', 0.95, 7],
        ['Broadcom Inc', 'San Jose, USA', 0.94, 28],
        ['Murata Manufacturing', 'Kyoto, Japan', 0.97, 10],
        ['Texas Instruments', 'Dallas, USA', 0.96, 12]
    ];
    const insertSupplier = db.prepare("INSERT INTO Suppliers (SupplierName, Location, ReliabilityScore, LeadTimeDays) VALUES (?, ?, ?, ?)");
    realSuppliers.forEach(s => insertSupplier.run(s[0], s[1], s[2], s[3]));

    // 3. Real-World Manufacturers (Global & Indian Stock Entities)
    const realManufacturers = [
        ['Apple Inc.', 'California, USA', 1000000],
        ['NVIDIA Corporation', 'Santa Clara, USA', 500000],
        ['Tesla Motors', 'Austin, USA', 800000],
        ['SpaceX Aeronautics', 'Texas, USA', 100000],
        ['Tata Motors', 'Maharashtra, India', 600000],
        ['Reliance Industries', 'Gujarat, India', 900000],
        ['Boeing Aerospace', 'Washington, USA', 150000],
        ['Merck Healthcare', 'New Jersey, USA', 400000]
    ];
    const insertManufacturer = db.prepare("INSERT INTO Manufacturers (ManufacturerName, Location, ProductionCapacity) VALUES (?, ?, ?)");
    realManufacturers.forEach(m => insertManufacturer.run(m[0], m[1], m[2]));

    // 4. Real-World Distributors (Global Logistics)
    const realDistributors = [
        ['Amazon Global Logistics', 'California, USA', 'Global', 5000000],
        ['FedEx Express Hub', 'Tennessee, USA', 'North America', 2000000],
        ['DHL Supply Chain', 'Bonn, Germany', 'Europe', 1800000],
        ['Maersk Global Hub', 'Singapore', 'APAC', 3000000],
        ['Reliance Retail Hub', 'Mumbai, India', 'South Asia', 1500000],
        ['Amazon IN Distribution', 'Bengaluru, India', 'South Asia', 1000000],
        ['NVIDIA GTC Hub', 'Frankfurt, Germany', 'Europe', 800000],
        ['Apple Distribution Center', 'Dublin, Ireland', 'EMEA', 1200000],
        ['SpaceX Starbase Hub', 'Boca Chica, USA', 'Global', 500000],
        ['TATA Supply Chain', 'London, UK', 'Europe', 900000]
    ];
    const insertDistributor = db.prepare("INSERT INTO Distributors (DistributorName, Location, RegionCovered, StorageCapacity) VALUES (?, ?, ?, ?)");
    realDistributors.forEach(d => insertDistributor.run(d[0], d[1], d[2], d[3]));

    // NEW: 4.1 Warehouses (Real Entities)
    const insertWarehouse = db.prepare("INSERT INTO Warehouses (WarehouseName, Location, WarehouseType, MaxCapacity) VALUES (?, ?, ?, ?)");
    for(let i=1; i<=10; i++) {
        insertWarehouse.run(`Central Warehouse [${realDistributors[i-1][0]}]`, realDistributors[i-1][1], pick(['Cold Storage', 'Standard', 'Hazardous']), rand(100000, 1000000));
    }

    // 5. Products (Actual Tech & Industrial Models)
    const realProducts = [
        ['iPhone 15 Pro Max', 1, 1199.00, 0.22],
        ['NVIDIA H100 Hopper GPU', 2, 25000.00, 1.20],
        ['NVIDIA RTX 4090', 2, 1599.00, 2.10],
        ['Tesla Model 3 Chassis', 4, 12000.00, 500.00],
        ['Falcon 9 Merlin Engine', 3, 1000000.00, 800.00],
        ['SpaceX Starlink Dish', 3, 599.00, 3.50],
        ['Tata Nexon Power Unit', 4, 3500.00, 120.00],
        ['Reliance Poly-Ethylene Batch', 5, 5200.00, 1000.00],
        ['Apple Watch Ultra 2', 1, 799.00, 0.06],
        ['Merck LNP Lipid Solution', 6, 850.00, 0.50],
        ['Boeing 787 Wing Spar', 3, 450000.00, 2000.00],
        ['Intel Core i9-14900K', 2, 589.00, 0.10],
        ['Samsung Expert SSD 4TB', 2, 349.00, 0.05],
        ['Tesla Powerwall 3', 5, 8000.00, 114.00],
        ['Himalaya Neem Capsules', 6, 15.00, 0.10],
        ['Tata Tea Premium (Bulk)', 5, 45.00, 5.00],
        ['NVIDIA Jetson Orin', 2, 1999.00, 0.35],
        ['Apple M3 Max Chipset', 2, 1200.00, 0.02],
        ['Airbus A350 Avionics', 3, 150000.00, 45.00],
        ['SpaceX Raptor Engine', 3, 2000000.00, 1500.00],
        ['Reliance Fuel (ISO Tank)', 5, 25000.00, 5000.00],
        ['Tesla Megapack Unit', 5, 1200000.00, 10000.00],
        ['iPhone SE Generation 3', 1, 429.00, 0.18],
        ['MacBook Pro 14 M3', 1, 1599.00, 1.60],
        ['NVIDIA A100 Tensor Core', 2, 15000.00, 1.10],
        ['Intel Xeon Platinum', 2, 7500.00, 0.40],
        ['ASML Twinscan Batch', 2, 200000.00, 150.00],
        ['STMicro Industrial Sensor', 2, 85.00, 0.05],
        ['Murata Ceramic Caps (Bulk)', 2, 12.00, 0.50],
        ['Bosch ABS Control Unit', 4, 320.00, 0.80],
        ['Tata Safari Transmission', 4, 2500.00, 85.00],
        ['Reliance Crude Extract', 5, 60.00, 150.00],
        ['Merck Vaccine Base V1', 6, 4500.00, 0.20],
        ['Apple Vision Pro Headset', 1, 3499.00, 0.65],
        ['SpaceX Dragon Capsule Component', 3, 85000.00, 250.00],
        ['Boeing Flight Deck display', 3, 12000.00, 5.00],
        ['Tesla Supercharger Post', 5, 4500.00, 200.00],
        ['Airbus Hydraulic Pump', 3, 8500.00, 12.00],
        ['Apple AirPods Pro 2', 1, 249.00, 0.05],
        ['NVIDIA Shield Enterprise', 1, 199.00, 0.40],
        ['Intel Optane Module', 2, 450.00, 0.08],
        ['Samsung QLED Panel 65', 1, 1200.00, 25.00],
        ['TSMC Wafer Batch 3nm', 2, 85000.00, 5.00],
        ['Reliance Jio 5G Router', 1, 85.00, 0.50],
        ['Tata Power Transformer', 5, 15000.00, 3000.00],
        ['Boeing Gearbox assembly', 3, 65000.00, 450.00],
        ['SpaceX Heat Shield Tile', 3, 250.00, 1.50],
        ['Tesla Model X Battery Pack', 5, 18000.00, 600.00],
        ['NVIDIA BlueField-3 DPU', 2, 2500.00, 0.60],
        ['Apple MagSafe Adaptor', 1, 49.00, 0.15]
    ];
    const insertProduct = db.prepare("INSERT INTO Products (ProductName, CategoryID, UnitPrice, Weight) VALUES (?, ?, ?, ?)");
    realProducts.forEach(p => insertProduct.run(p[0], p[1], p[2], p[3]));

    // NEW: 5.1 QualityChecks (Massive Audit: 300+ records)
    console.log("🔍 Generating 300+ Quality Checks...");
    const insertQA = db.prepare("INSERT INTO QualityChecks (BatchID, ProductID, Status, InspectorName, Notes) VALUES (?, ?, ?, ?, ?)");
    for(let i=1; i<=300; i++) {
        insertQA.run(`BATCH-${rand(1000, 9999)}`, rand(1, 50), pick(['PASS', 'PASS', 'PASS', 'FAIL', 'PENDING']), `Inspector ${rand(1, 10)}`, 'Standard protocol check.');
    }

    // 6. ProductSuppliers (Many-to-Many Complexity)
    const insertJunction = db.prepare("INSERT INTO ProductSuppliers (ProductID, SupplierID, IsPrimary) VALUES (?, ?, ?)");
    for(let i=1; i<=50; i++) {
        const suppliersCount = rand(1, 3);
        const used = new Set();
        for(let j=0; j<suppliersCount; j++) {
            let sId = rand(1, 15);
            if(!used.has(sId)) {
                insertJunction.run(i, sId, j === 0 ? 1 : 0);
                used.add(sId);
            }
        }
    }

    // 7. Inventory Levels
    const insertInventory = db.prepare("INSERT INTO InventoryLevels (ProductID, LocationID, LocationType, QuantityOnHand, ReorderPoint, MaxCapacity) VALUES (?, ?, ?, ?, ?, ?)");
    for(let i=1; i<=100; i++) {
        insertInventory.run(rand(1, 50), rand(1, 10), pick(['Manufacturer', 'Distributor']), rand(100, 5000), rand(500, 1000), rand(10000, 50000));
    }

    // 8. Orders (Hyper Volume: 500+ records)
    // NOTE: Logistics table is populated automatically via trg_CreateLogistics!
    console.log("🚀 Generating 500+ Orders [Automated Logistics Trigger Active]...");
    const insertOrder = db.prepare("INSERT INTO Orders (ProductID, SupplierID, OrderDate, ExpectedDeliveryDate, Quantity, Status, TotalAmount, DistributorID) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    for(let i=1; i<=500; i++) {
        const oDate = randomDate(new Date('2023-01-01'), new Date('2024-03-30'));
        const eDate = randomDate(new Date(oDate), new Date(new Date(oDate).getTime() + 30 * 24 * 60 * 60 * 1000));
        const qty = rand(10, 1000);
        const price = (5 + Math.random() * 100).toFixed(2);
        insertOrder.run(rand(1, 50), rand(1, 15), oDate, eDate, qty, pick(['Pending', 'Processing', 'In Transit', 'Delivered', 'Cancelled']), (qty * price).toFixed(2), rand(1, 10));
    }

    // NEW: 8.1 MaintenanceLogs (Enterprise Maintenance: 150+ records)
    console.log("🔧 Generating 150+ Maintenance Logs...");
    const insertMaintenance = db.prepare("INSERT INTO MaintenanceLogs (EntityID, EntityType, TaskDescription, Criticality, MaintenanceDate) VALUES (?, ?, ?, ?, ?)");
    for(let i=1; i<=150; i++) {
        insertMaintenance.run(rand(1, 8), pick(['Manufacturer', 'Warehouse']), 'Systematic recalibration of heavy machinery.', pick(['Routine', 'High', 'Emergency']), randomDate(new Date('2023-01-01'), new Date('2024-03-30')));
    }

    // 10. Inventory Transactions (Hyper Audit Log: 1000+ records)
    console.log("📒 Generating 1000+ Audit Transactions...");
    const insertTransaction = db.prepare("INSERT INTO InventoryTransactions (InventoryID, TransactionType, Quantity, ReferenceID) VALUES (?, ?, ?, ?)");
    for(let i=1; i<=1000; i++) {
        insertTransaction.run(rand(1, 100), pick(['Inbound', 'Inbound', 'Outbound', 'Adjustment']), rand(1, 500), `LOG-${rand(1000, 9999)}`);
    }

    console.log("✅ Hyper-Enterprise Seeding Complete! Total records live: ~2700+");
} catch (error) {
    console.error("❌ Massive Seed Error:", error);
}

