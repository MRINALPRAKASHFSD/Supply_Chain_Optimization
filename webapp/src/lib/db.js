import Database from 'better-sqlite3';
import path from 'path';

// Construct the path to the database file in the project workspace
const dbPath = path.resolve(process.cwd(), 'supply_chain.db');

export function getDb() {
  // Using better-sqlite3 synchronouse connection
  return new Database(dbPath, { verbose: console.log });
}
