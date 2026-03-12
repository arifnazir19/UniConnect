import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";

// ==========================================
// DATABASE SETUP
// ==========================================
const db = new DB("uniconnect.db");

// Initialize Tables

export const setupDatabase=()=>{
    db.execute(`CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT,
    password TEXT
  );

CREATE TABLE IF NOT EXISTS supervisors (
    id TEXT PRIMARY KEY,
    name TEXT,
    password TEXT
  );

CREATE TABLE IF NOT EXISTS slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time TEXT
  );

CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    supervisor TEXT,
    slot TEXT
  );
        `)
}
export default db;