import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db.js';

export async function POST(req) {
  try {
    const { filename, data } = await req.json();
    const db = getDb();

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ success: false, error: 'Empty dataset' }, { status: 400 });
    }

    // Dynamic handling: Map columns to an existing table or create a new one
    const headers = Object.keys(data[0]);
    const tablename = `External_${filename.replace(/[^a-zA-Z0-9]/g, '_')}`;

    // 1. Transaction to ensure atomicity
    const transaction = db.transaction((rows) => {
      // Create table dynamically if it doesn't exist
      const columnsDef = headers.map(h => `"${h}" TEXT`).join(', ');
      db.prepare(`DROP TABLE IF EXISTS "${tablename}"`).run();
      db.prepare(`CREATE TABLE "${tablename}" (${columnsDef})`).run();

      // Batch insert logic
      const placeholders = headers.map(() => '?').join(', ');
      const stmt = db.prepare(`INSERT INTO "${tablename}" (${headers.map(h => `"${h}"`).join(', ')}) VALUES (${placeholders})`);
      
      for (const row of rows) {
        const values = headers.map(h => row[h]);
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
