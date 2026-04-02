import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db.js';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    const db = getDb();

    // DBMS-First Verification: SQL Query for User lookup
    const user = db.prepare("SELECT UserID, Username, Role FROM Users WHERE Username = ? AND PasswordHash = ?").get(username, password);

    if (user) {
      return NextResponse.json({ 
        success: true, 
        user: { 
          id: user.UserID, 
          username: user.Username, 
          role: user.Role 
        } 
      });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json({ success: false, error: 'Authentication failed' }, { status: 500 });
  }
}
