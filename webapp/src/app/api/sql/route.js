import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db.js';

export async function POST(req) {
  try {
    const { query } = await req.json();
    const db = getDb();

    if (!query || query.trim() === '') {
      return NextResponse.json({ success: false, error: 'Empty query' }, { status: 400 });
    }

    // Determine if the query is a SELECT or an ACTION (INSERT/UPDATE/DELETE/CREATE)
    const normalized = query.trim().toUpperCase();
    
    if (normalized.startsWith('SELECT')) {
      const results = db.prepare(query).all();
      return NextResponse.json({ 
        success: true, 
        type: 'SELECT',
        columns: results.length > 0 ? Object.keys(results[0]) : [],
        data: results 
      });
    } else {
      const info = db.exec(query);
      return NextResponse.json({ 
        success: true, 
        type: 'EXEC',
        data: info 
      });
    }

  } catch (error) {
    console.error("SQL Execution Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
