import * as UserModel from "../models/userModel.js";
import * as AppointmentModel from "../models/appointmentModels.js";

export const getSupervisors = (ctx) => {
  ctx.response.body = { supervisors: UserModel.getAllSupervisors() };
};

export const getAvailableSlots = (ctx) => {
  const supervisorName = decodeURIComponent(ctx.params.supervisor);
  const date = ctx.request.url.searchParams.get("date");

  if (!date) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Date parameter is required" };
    return;
  }

  const allSlots = AppointmentModel.getAllSlots();
  const bookedSlots = AppointmentModel.getBookedSlotsForSupervisor(
    supervisorName,
    date,
  );

  // Filter out booked slots
  const availableSlots = allSlots.filter((slot) => !bookedSlots.includes(slot));

  ctx.response.body = { availableSlots };
};

export const bookAppointment = async (ctx) => {
  const body = await ctx.request.body({ type: "json" }).value;
  const { student_id, supervisor, date, slot } = body;

  if (!student_id || !supervisor || !date || !slot) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Missing fields" };
    return;
  }

  const isBooked = AppointmentModel.checkExistingBooking(
    supervisor,
    date,
    slot,
  );
  if (isBooked) {
    ctx.response.status = 409;
    ctx.response.body = { error: "Slot already booked for this date." };
    return;
  }

  AppointmentModel.createAppointment(student_id, supervisor, date, slot);
  ctx.response.body = {
    success: true,
    message: "Session booked successfully!",
  };
};

export const getAppointmentsList = (ctx) => {
  const studentId = ctx.request.url.searchParams.get("student_id");
  const teacherName = ctx.request.url.searchParams.get("teacher_name");

  const appointments = AppointmentModel.getAppointments(studentId, teacherName);
  ctx.response.body = { appointments };
};

export const deleteAppointment = (ctx) => {
  AppointmentModel.deleteAppointmentById(ctx.params.id);
  ctx.response.body = { success: true };
};
