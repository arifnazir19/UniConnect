/**
 * UniConnect Backend Server
 * Run using: deno run --allow-net --allow-read --allow-write server.ts
 */

import { Application, Router } from "https://deno.land/x/oak@v12.1.0/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";

const app = new Application();
const router = new Router();
const port = 8000;

// ==========================================
// DATABASE SETUP
// ==========================================
const db = new DB("uniconnect.db");

// Initialize Tables
db.execute(`
  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT
  );
`);

db.execute(`
  CREATE TABLE IF NOT EXISTS supervisors (
    id TEXT PRIMARY KEY,
    name TEXT
  );
`);

db.execute(`
  CREATE TABLE IF NOT EXISTS slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time TEXT
  );
`);

db.execute(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    supervisor TEXT,
    slot TEXT
  );
`);

// Insert Sample Data (if empty)
const studentCount = db.query("SELECT COUNT(*) FROM students")[0][0];
if (studentCount === 0) {
  db.execute(
    "INSERT INTO students (id, name) VALUES ('P2700000','John')",
  );
  db.execute("INSERT INTO students (id, name) VALUES ('P2700001','Emily')");
  db.execute(
    "INSERT INTO students (id, name) VALUES ('P2700002','Paul')",
  );
  console.log("Database initialized with sample student data.");
}

const supervisorCount = db.query("SELECT COUNT(*) FROM supervisors")[0][0];
if (supervisorCount === 0) {
  db.execute(
    "INSERT INTO supervisors (id, name) VALUES ('T101','Ali')",
  );
  db.execute(
    "INSERT INTO supervisors (id, name) VALUES ('T102','Martain')",
  );
  db.execute(
    "INSERT INTO supervisors (id, name) VALUES ('T103','Stuart')",
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

// ==========================================
// API ROUTES
// ==========================================

// 1. Get Supervisors
router.get("/api/supervisors", (ctx) => {
  const supervisorsQuery = db.query("SELECT id, name FROM supervisors");
  const supervisors = supervisorsQuery.map((row) => ({
    id: row[0],
    name: row[1],
  }));

  ctx.response.body = { supervisors };
});

// 2. Get Available Slots for a Supervisor
router.get("/api/slots/:supervisor", (ctx) => {
  const supervisorName = decodeURIComponent(ctx.params.supervisor);

  // Find all slots from the slots table that are NOT booked for this supervisor
  const availableSlotsQuery = db.query(
    `
    SELECT time FROM slots 
    WHERE time NOT IN (
      SELECT slot FROM appointments WHERE supervisor = ?
    )
    ORDER BY id ASC
  `,
    [supervisorName],
  );

  const availableSlots = availableSlotsQuery.map((row) => row[0]);
  
  ctx.response.body = { availableSlots };
});

// 3. Book an Appointment
router.post("/api/book", async (ctx) => {
  const body = await ctx.request.body({ type: "json" }).value;
  const { student_id, supervisor, slot } = body;

  if (!student_id || !supervisor || !slot) {
    ctx.response.status = 400;
    ctx.response.body = "Missing required fields";
    return;
  }

  // Verify Student exists
  const student = db.query("SELECT name FROM students WHERE id = ?", [
    student_id,
  ]);
  if (student.length === 0) {
    ctx.response.status = 404;
    ctx.response.body = "Student not found. Please check your ID.";
    return;
  }

  // Check if slot is already booked for this supervisor
  const existing = db.query(
    "SELECT id FROM appointments WHERE supervisor = ? AND slot = ?",
    [supervisor, slot],
  );

  if (existing.length > 0) {
    ctx.response.status = 409; // Conflict
    ctx.response.body = "This slot is already booked by someone else.";
    return;
  }

  // Insert the booking
  db.query(
    "INSERT INTO appointments (student_id, supervisor, slot) VALUES (?, ?, ?)",
    [student_id, supervisor, slot],
  );

  ctx.response.status = 200;
  ctx.response.body = {
    success: true,
    message: "Appointment booked successfully!",
  };
});

// 4. Get all appointments
router.get("/api/appointments", (ctx) => {
  // Join query to get student names along with appointment details
  const appointmentsQuery = db.query(`
    SELECT a.id, a.student_id, s.name as student_name, a.supervisor, a.slot
    FROM appointments a
    JOIN students s ON a.student_id = s.id
    ORDER BY a.id DESC
  `);

  const appointments = appointmentsQuery.map((row) => ({
    id: row[0],
    student_id: row[1],
    student_name: row[2],
    supervisor: row[3],
    slot: row[4],
  }));

  ctx.response.body = { appointments };
});

// 5. Delete an appointment
router.delete("/api/appointments/:id", (ctx) => {
  const id = ctx.params.id;
  db.query("DELETE FROM appointments WHERE id = ?", [id]);
  ctx.response.status = 200;
  ctx.response.body = {
    success: true,
    message: "Appointment deleted and slot freed.",
  };
});

// ==========================================
// MIDDLEWARE & SERVER START
// ==========================================

// Enable CORS so the HTML frontend can talk to the Deno Backend
app.use(oakCors({ origin: "*" }));

// Logger
app.use(async (ctx, next) => {
  await next();
  console.log(
    `${ctx.request.method} ${ctx.request.url.pathname} - Status: ${ctx.response.status}`,
  );
});

// Register API routes
app.use(router.routes());
app.use(router.allowedMethods());

// ==========================================
// SPA static files / fallback middleware
// ==========================================
// Any request that doesn't start with /api will be treated as
// a frontend route. For a single‑page application we always
// respond with index.html so that client-side navigation works
// (e.g. refreshing or typing /booking directly).
app.use(async (ctx, next) => {
  // let API routes flow through to the router
  if (ctx.request.url.pathname.startsWith("/api")) {
    await next();
    return;
  }

  // attempt to serve a file from disk; if it doesn't exist send
  // index.html so the SPA can take over.
  try {
    await ctx.send({
      root: Deno.cwd(),
      index: "index.html",
    });
  } catch {
    // if even index.html can't be found something is seriously
    // wrong, but we'll just return 404 to be safe.
    ctx.response.status = 404;
    ctx.response.body = "404 - File Not Found";
  }
});

console.log(`🚀 UniConnect Deno Server is running on http://localhost:${port}`);
await app.listen({ port });
