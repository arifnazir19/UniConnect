import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
// Create or open the database
const db = new DB("uniconnect.db");
export const setupDatabase = () => {
  db.execute(`
    CREATE TABLE IF NOT EXISTS students (
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
      date TEXT,
      slot TEXT
    );
  `);
};
export default db;
