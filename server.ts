/**
 * UniConnect Backend Server
 * Run using: deno run --allow-net --allow-read --allow-write server.ts
 */

import { Application, Router } from "https://deno.land/x/oak@v12.1.0/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { register,login } from "./controllers/authController.ts";
import { getSupervisors, getAvailableSlots,bookAppointment,getAppointmentsList,deleteAppointment } from "./controllers/bookingController.ts";

export const app = new Application();
const router = new Router();

router.post("/api/register",register)
router.post("/api/login",login)


router.get("/api/supervisors",getSupervisors)
router.get("/api/slots/:supervisor",getAvailableSlots)
router.post("/api/book",bookAppointment)
router.get("/api/appoinments",getAppointmentsList)
router.delete("/api/appointments/:id",deleteAppointment)

// Middleware
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
  // If the request is for our backend API, let it pass through
  if (ctx.request.url.pathname.startsWith("/api")) {
    await next();
  } else {
    // Otherwise, serve the frontend HTML file
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