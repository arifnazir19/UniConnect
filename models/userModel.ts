import db from "../tools/database.ts"

export const countRole = (role: "student" | "teacher"): number => {
  const table = role === "student" ? "students" : "supervisors";
  const query = `SELECT COUNT(*) FROM ${table}`;
  return db.query(query)[0][0] as number;
};

export const createUser = (
  id: string,
  name: string,
  password: string,
  role: "student" | "teacher",
) => {
  const table = role === "student" ? "students" : "supervisors";
  db.query(`INSERT INTO ${table} (id, name, password) VALUES (?, ?, ?)`, [
    id,
    name,
    password,
  ]);
};

export const findUserById = (id: string, role: "student" | "teacher") => {
  const table = role === "student" ? "students" : "supervisors";
  const user = db.query(`SELECT name, password FROM ${table} WHERE id = ?`, [
    id,
  ]);
  if (user.length === 0) return null;
  return {
    id,
    name: user[0][0] as string,
    password: user[0][1] as string,
    role,
  };
};

export const getAllSupervisors = () => {
  return db.query("SELECT id, name FROM supervisors").map((row) => ({
    id: row[0] as string,
    name: row[1] as string,
  }));
};