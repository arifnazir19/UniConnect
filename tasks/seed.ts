import db,{setupDatabase}from"../tools/database.ts"
console.log("setting up the tables")
setupDatabase()
console.log("adding the data into the tables")


// Insert Sample Data (if empty)
const studentCount = db.query("SELECT COUNT(*) FROM students")[0][0];
if (studentCount === 0) {
  db.execute(
    "INSERT INTO students (id, name, password) VALUES ('S101','John','1234')",
  );
  db.execute("INSERT INTO students (id, name, password) VALUES ('S102','Emily','1234')");
  db.execute(
    "INSERT INTO students (id, name, password) VALUES ('S103','Paul','1234')",
  );
  console.log("Database initialized with sample student data.");
}

const supervisorCount = db.query("SELECT COUNT(*) FROM supervisors")[0][0];
if (supervisorCount === 0) {
  db.execute(
    "INSERT INTO supervisors (id, name, password) VALUES ('T101','Ali','1234')",
  );
  db.execute(
    "INSERT INTO supervisors (id, name, password) VALUES ('T102','Martain','1234')",
  );
  db.execute(
    "INSERT INTO supervisors (id, name, password) VALUES ('T103','Stuart','1234')",
  );
  console.log("Database initialized with sample supervisor data.");
}

const slotCount = db.query("SELECT COUNT(*) FROM slots")[0][0];
if (slotCount === 0) {
  const defaultSlots = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
  ];
  for (const s of defaultSlots) {
    db.query("INSERT INTO slots (time) VALUES (?)", [s]);
  }
  console.log("Database initialized with sample slots.");
}
console.log("database successfully added")