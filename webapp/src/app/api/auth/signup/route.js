import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db.js';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    const db = getDb();

    // Check if user exists
    const existing = db.prepare("SELECT * FROM Users WHERE Username = ?").get(username);
    if (existing) {
      return NextResponse.json({ success: false, error: 'Username already taken' }, { status: 400 });
    }

    // DBMS Insert Logic
    const result = db.prepare("INSERT INTO Users (Username, PasswordHash, Role) VALUES (?, ?, 'Viewer')").run(username, password);

    return NextResponse.json({ 
      success: true, 
      user: { 
        id: result.lastInsertRowid, 
        username, 
        role: 'Viewer' 
      } 
    });
  } catch (error) {
    console.error("Signup API Error:", error);
    return NextResponse.json({ success: false, error: 'Account creation failed' }, { status: 500 });
  }
}
