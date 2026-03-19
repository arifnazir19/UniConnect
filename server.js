import { Application, Router } from "https://deno.land/x/oak@v12.1.0/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

// Using Explicit Named Imports to prevent 'undefined' errors
import { register, login } from "./controllers/authController.js";
import {
  getSupervisors,
  getAvailableSlots,
  bookAppointment,
  getAppointmentsList,
  deleteAppointment,
} from "./controllers/bookingController.js";

export const app = new Application();
const router = new Router();

// ==========================================
// 1. GLOBAL ERROR HANDLER (Catches all crashes)
// ==========================================
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error("🔥 FATAL SERVER ERROR:", err);
    ctx.response.status = 500;
    // Send the exact error message to the frontend HTML
    ctx.response.body = { error: err.message || "Internal Server Error" };
  }
});

// ==========================================
// 2. ROUTING & MIDDLEWARE
// ==========================================
// Auth Routes
router.post("/api/register", register);
router.post("/api/login", login);

// Booking Routes
router.get("/api/supervisors", getSupervisors);
router.get("/api/slots/:supervisor", getAvailableSlots);
router.post("/api/book", bookAppointment);
router.get("/api/appointments", getAppointmentsList);
router.delete("/api/appointments/:id", deleteAppointment);

// CORS
app.use(oakCors({ origin: "*" }));

// Logger
app.use(async (ctx, next) => {
  await next();
  console.log(
    `${ctx.request.method} ${ctx.request.url.pathname} - Status: ${ctx.response.status}`,
  );
});

// Use Router
app.use(router.routes());
app.use(router.allowedMethods());

// Serve Static Views (The Frontend HTML)
app.use(async (ctx, next) => {
  if (ctx.request.url.pathname.startsWith("/api")) {
    await next();
  } else {
    try {
      await ctx.send({
        root: `${Deno.cwd()}/views`,
        index: "index.html",
      });
    } catch {
      ctx.response.status = 404;
      ctx.response.body =
        "File Not Found. Ensure index.html is inside the /views folder.";
    }
  }
});
