import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db.js';
import * as XLSX from 'xlsx';

export async function POST(req) {
  try {
    const body = await req.json();
    const { filename, data, fileContent, type } = body;
    const db = getDb();

    let finalData = data;

    // Support for Excel parsing if a base64 string is provided
    if (fileContent && type === 'excel') {
      const buffer = Buffer.from(fileContent, 'base64');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      finalData = XLSX.utils.sheet_to_json(firstSheet);
    }

    if (!finalData || !Array.isArray(finalData) || finalData.length === 0) {
      return NextResponse.json({ success: false, error: 'Empty or invalid dataset' }, { status: 400 });
    }

    // 1. Sanitize Headers & Infer Types
    const rawHeaders = Object.keys(finalData[0]);
    const headers = rawHeaders.map(h => h.replace(/[^a-zA-Z0-9]/g, '_'));
    
    // Simple Type Inference (Check first 10 rows for better accuracy)
    const columnTypes = headers.map((h, idx) => {
      const sampleValues = finalData.slice(0, 10).map(row => row[rawHeaders[idx]]);
      
      let isInt = true;
      let isFloat = true;
      
      sampleValues.forEach(val => {
        if (val === undefined || val === null || val === '') return;
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

    const tablename = `External_${filename.replace(/[^a-zA-Z0-9]/g, '_').split('.')[0]}`;

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

    const count = transaction(finalData);

    return NextResponse.json({ 
      success: true, 
      tablename,
      count,
      message: `Successfully ingested ${count} records into ${tablename} [AetherFlow Node].`
    });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
