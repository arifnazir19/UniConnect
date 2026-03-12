import db from "../tools/database.ts"

export const getAllSlots = () => {
  return db.query("SELECT time FROM slots").map((row) => row[0] as string);
};

export const getBookedSlotsForSupervisor = (supervisorName: string) => {
  return db
    .query(`SELECT slot FROM appointments WHERE supervisor = ?`, [
      supervisorName,
    ])
    .map((row) => row[0] as string);
};

export const checkExistingBooking = (supervisor: string, slot: string) => {
  return (
    db.query("SELECT id FROM appointments WHERE supervisor = ? AND slot = ?", [
      supervisor,
      slot,
    ]).length > 0
  );
};

export const createAppointment = (
  studentId: string,
  supervisor: string,
  slot: string,
) => {
  db.query(
    "INSERT INTO appointments (student_id, supervisor, slot) VALUES (?, ?, ?)",
    [studentId, supervisor, slot],
  );
};

export const getAppointments = (
  studentId: string | null,
  teacherName: string | null,
) => {
  let query = `
    SELECT a.id, a.student_id, s.name as student_name, a.supervisor, a.slot
    FROM appointments a JOIN students s ON a.student_id = s.id
  `;
  const params: string[] = [];
  if (studentId) {
    query += ` WHERE a.student_id = ?`;
    params.push(studentId);
  } else if (teacherName) {
    query += ` WHERE a.supervisor = ?`;
    params.push(teacherName);
  }
  query += ` ORDER BY a.id DESC`;
  return db.query(query, params).map((row) => ({
    id: row[0],
    student_id: row[1],
    student_name: row[2],
    supervisor: row[3],
    slot: row[4],
  }));
};

export const deleteAppointmentById = (id: string) => {
  db.query("DELETE FROM appointments WHERE id = ?", [id]);
};