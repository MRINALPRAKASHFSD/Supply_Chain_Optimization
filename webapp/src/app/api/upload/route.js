import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db.js';

export async function POST(req) {
  try {
    const { filename, data } = await req.json();
    const db = getDb();

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ success: false, error: 'Empty dataset' }, { status: 400 });
    }

    // 1. Sanitize Headers & Infer Types
    const rawHeaders = Object.keys(data[0]);
    const headers = rawHeaders.map(h => h.replace(/[^a-zA-Z0-9]/g, '_'));
    
    // Simple Type Inference (Check first 5 rows)
    const columnTypes = headers.map((h, idx) => {
      const sampleValues = data.slice(0, 5).map(row => row[rawHeaders[idx]]);
      
      let isInt = true;
      let isFloat = true;
      
      sampleValues.forEach(val => {
        if (!val || val.toString().trim() === '') return;
        const num = Number(val);
        if (isNaN(num)) {
          isInt = false;
          isFloat = false;
        } else if (!Number.isInteger(num)) {
          isInt = false;
        }
      });
      
      if (isInt) return 'INTEGER';
      if (isFloat) return 'REAL';
      return 'TEXT';
    });

    const tablename = `External_${filename.replace(/[^a-zA-Z0-9]/g, '_')}`;

    // 2. Transaction for schema setup and data insertion
    const transaction = db.transaction((rows) => {
      const columnsDef = headers.map((h, i) => `"${h}" ${columnTypes[i]}`).join(', ');
      db.prepare(`DROP TABLE IF EXISTS "${tablename}"`).run();
      db.prepare(`CREATE TABLE "${tablename}" (${columnsDef})`).run();

      const placeholders = headers.map(() => '?').join(', ');
      const stmt = db.prepare(`INSERT INTO "${tablename}" (${headers.map(h => `"${h}"`).join(', ')}) VALUES (${placeholders})`);
      
      for (const row of rows) {
        const values = rawHeaders.map(h => row[h]);
        stmt.run(...values);
      }
      return rows.length;
    });

    const count = transaction(data);

    return NextResponse.json({ 
      success: true, 
      tablename,
      count,
      message: `Successfully ingested ${count} records into ${tablename}.`
    });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
