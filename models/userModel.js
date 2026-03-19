import db from "../tools/database.js";

export const countRole = (role) => {
  const table = role === "student" ? "students" : "supervisors";
  const query = `SELECT COUNT(*) FROM ${table}`;
  return db.query(query)[0][0];
};

export const createUser = (id, name, password, role) => {
  const table = role === "student" ? "students" : "supervisors";
  db.query(`INSERT INTO ${table} (id, name, password) VALUES (?, ?, ?)`, [
    id,
    name,
    password,
  ]);
};

export const findUserById = (id, role) => {
  const table = role === "student" ? "students" : "supervisors";
  const user = db.query(`SELECT name, password FROM ${table} WHERE id = ?`, [
    id,
  ]);
  if (user.length === 0) return null;
  return {
    id,
    name: user[0][0],
    password: user[0][1],
    role,
  };
};

export const getAllSupervisors = () => {
  return db.query("SELECT id, name FROM supervisors").map((row) => ({
    id: row[0],
    name: row[1],
  }));
};
