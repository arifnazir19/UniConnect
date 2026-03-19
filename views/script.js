const API_BASE = "http://localhost:8000/api";
let currentUser = JSON.parse(localStorage.getItem("uniconnect_user")) || null;

function updateNav() {
  document.getElementById("nav-guest").classList.add("hidden");
  document.getElementById("nav-user").classList.add("hidden");
  document
    .querySelectorAll(".auth-student")
    .forEach((el) => el.classList.add("hidden"));
  document
    .querySelectorAll(".auth-teacher")
    .forEach((el) => el.classList.add("hidden"));
  const heroBtn = document.querySelector("#heroaction-btn");
  const isTeacher =
    currentUser.role === "teacher" ||
    String(currentUser.id).toUpperCase().startsWith("T");
  if (!currentUser) {
    document.getElementById("nav-guest").classList.remove("hidden");
    if (heroBtn) heroBtn.innerHTML = "Book Appointment Now →";
  } else {
    document.getElementById("nav-user").classList.remove("hidden");
    document.getElementById("nav-user-name").textContent = currentUser.name;
    document.getElementById("nav-user-id").textContent = currentUser.id;
    if (currentUser.role === "student")
      document
        .querySelectorAll(".auth-student")
        .forEach((el) => el.classList.remove("hidden"));

    if (heroBtn && !isTeacher) heroBtn.innerHTML = "Book Appointment Now →";
    else if (currentUser.role === "teacher")
      document
        .querySelectorAll(".auth-teacher")
        .forEach((el) => el.classList.remove("hidden"));
    if (heroBtn && isTeacher) heroBtn.innerHTML = "View Booked Appointments →";
  }
}

function navigate(pageId) {
  if (
    !currentUser &&
    ["booking", "appointments", "teacher-dashboard"].includes(pageId)
  )
    pageId = "auth";
  if (currentUser) {
    if (
      currentUser.role === "teacher" &&
      ["booking", "appointments"].includes(pageId)
    )
      pageId = "teacher-dashboard";
    if (currentUser.role === "student" && pageId === "teacher-dashboard")
      pageId = "appointments";
    if (pageId === "auth") pageId = "home";
  }

  document
    .querySelectorAll(".page-section")
    .forEach((sec) => sec.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");

  document
    .querySelectorAll(".nav-btn")
    .forEach((btn) => btn.classList.remove("active"));
  const activeBtn = document.querySelector(`.nav-btn[data-target="${pageId}"]`);
  if (activeBtn) activeBtn.classList.add("active");

  if (pageId === "booking") initBooking();
  if (pageId === "appointments") fetchAppointments("student");
  if (pageId === "teacher-dashboard") fetchAppointments("teacher");

  document
    .querySelectorAll(".msg-box")
    .forEach((b) => b.classList.add("hidden"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleHomeAction() {
  !currentUser
    ? navigate("auth")
    : currentUser.role === "student"
      ? navigate("booking")
      : navigate("teacher-dashboard");
}

function switchAuthTab(tab) {
  document.getElementById("tab-login").classList.remove("active");
  document.getElementById("tab-register").classList.remove("active");
  document.getElementById("login-form").classList.add("hidden");
  document.getElementById("register-form").classList.add("hidden");
  document.getElementById(`tab-${tab}`).classList.add("active");
  document.getElementById(`${tab}-form`).classList.remove("hidden");
}

function selectRole(role) {
  document.getElementById("role-student").classList.remove("selected");
  document.getElementById("role-teacher").classList.remove("selected");
  document.getElementById(`role-${role}`).classList.add("selected");
  document.getElementById("reg-role").value = role;
}

async function api(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    console.error(text);
    throw new Error(text || `Server Error (${res.status})`);
  }
  if (!res.ok) throw new Error(data.error || "Server Error");
  return data;
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const res = await api("/login", {
      method: "POST",
      body: JSON.stringify({
        id: document.getElementById("login-id").value.trim().toUpperCase(),
        password: document.getElementById("login-pwd").value,
      }),
    });
    currentUser = res;
    localStorage.setItem("uniconnect_user", JSON.stringify(currentUser));
    updateNav();
    navigate("home");
    e.target.reset();
  } catch (err) {
    const b = document.getElementById("msg-auth");
    b.textContent = err.message;
    b.className = "msg-box msg-error";
    b.classList.remove("hidden");
  }
});

document
  .getElementById("register-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const res = await api("/register", {
        method: "POST",
        body: JSON.stringify({
          name: document.getElementById("reg-name").value.trim(),
          password: document.getElementById("reg-pwd").value,
          role: document.getElementById("reg-role").value,
        }),
      });
      currentUser = res;
      localStorage.setItem("uniconnect_user", JSON.stringify(currentUser));
      updateNav();
      e.target.reset();
      document.getElementById("new-user-id").textContent = res.id;
      document.getElementById("id-display-modal").classList.add("show");
      setTimeout(
        () =>
          document.getElementById("id-display-modal").classList.add("visible"),
        10,
      );
    } catch (err) {
      const b = document.getElementById("msg-auth");
      b.textContent = err.message;
      b.className = "msg-box msg-error";
      b.classList.remove("hidden");
    }
  });

function closeIdModal() {
  document.getElementById("id-display-modal").classList.remove("visible");
  setTimeout(() => {
    document.getElementById("id-display-modal").classList.remove("show");
    handleHomeAction();
  }, 300);
}
function logout() {
  currentUser = null;
  localStorage.removeItem("uniconnect_user");
  updateNav();
  navigate("home");
}

// Booking Logic Updated for Dates
const supervisorSelect = document.getElementById("supervisor");
const dateInput = document.getElementById("booking-date");
const slotContainer = document.getElementById("slot-container");
const hiddenSlotInput = document.getElementById("slot");

async function initBooking() {
  // Set min date to today so users cannot book in the past
  const today = new Date().toISOString().split("T")[0];
  dateInput.min = today;

  if (supervisorSelect.options.length > 1) return;
  try {
    const data = await api("/supervisors");
    supervisorSelect.innerHTML =
      '<option value="" disabled selected>Select Supervisor</option>';
    data.supervisors.forEach(
      (sup) =>
        (supervisorSelect.innerHTML += `<option value="${sup.name}">${sup.name}</option>`),
    );
  } catch (e) {
    console.error(e);
  }
}

async function fetchAvailableSlots() {
  const sup = supervisorSelect.value;
  const dateVal = dateInput.value;

  slotContainer.innerHTML = "";
  hiddenSlotInput.value = "";

  if (!sup || !dateVal) {
    slotContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-weight: 500;">Please select a supervisor and date to view times.</div>`;
    return;
  }

  try {
    // Pass date as a query parameter
    const data = await api(
      `/slots/${encodeURIComponent(sup)}?date=${encodeURIComponent(dateVal)}`,
    );
    if (data.availableSlots.length === 0) {
      slotContainer.innerHTML = `<div style="grid-column: 1/-1; color: #dc2626; font-weight: 700; text-align: center;">No slots available on this date.</div>`;
      return;
    }
    data.availableSlots.forEach((slot) => {
      const pill = document.createElement("div");
      pill.className = "slot-pill";
      pill.textContent = slot;
      pill.onclick = () => {
        document
          .querySelectorAll(".slot-pill")
          .forEach((el) => el.classList.remove("selected"));
        pill.classList.add("selected");
        hiddenSlotInput.value = slot;
      };
      slotContainer.appendChild(pill);
    });
  } catch (e) {
    console.error(e);
  }
}

supervisorSelect.addEventListener("change", fetchAvailableSlots);
dateInput.addEventListener("change", fetchAvailableSlots);

document
  .getElementById("booking-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!hiddenSlotInput.value) {
      const mb = document.getElementById("msg-booking");
      mb.textContent = "Please select a time slot.";
      mb.className = "msg-box msg-error";
      mb.classList.remove("hidden");
      return;
    }
    try {
      const payload = {
        student_id: currentUser.id,
        supervisor: supervisorSelect.value,
        date: dateInput.value,
        slot: hiddenSlotInput.value,
      };
      const res = await api("/book", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const mb = document.getElementById("msg-booking");
      mb.textContent = res.message;
      mb.className = "msg-box msg-success";
      mb.classList.remove("hidden");
      e.target.reset();
      hiddenSlotInput.value = "";
      slotContainer.innerHTML =
        '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-weight: 500;">Please select a supervisor and date to view times.</div>';
    } catch (err) {
      const mb = document.getElementById("msg-booking");
      mb.textContent = err.message;
      mb.className = "msg-box msg-error";
      mb.classList.remove("hidden");
    }
  });

let deleteId = null;
async function fetchAppointments(viewType) {
  const container = document.getElementById(
    viewType === "student"
      ? "appointments-container"
      : "teacher-appointments-container",
  );
  const empty = document.getElementById(
    viewType === "student" ? "empty-student" : "empty-teacher",
  );
  container.innerHTML = "";
  try {
    const queryParam =
      viewType === "student"
        ? `?student_id=${currentUser.id}`
        : `?teacher_name=${encodeURIComponent(currentUser.name)}`;
    const data = await api(`/appointments${queryParam}`);
    if (data.appointments.length === 0) empty.classList.remove("hidden");
    else {
      empty.classList.add("hidden");
      data.appointments.forEach((app) => {
        const card = document.createElement("div");
        card.className = "appointment-card";

        card.innerHTML = `
                            <div class="card-accent-bar"></div>
                            <div class="card-content">
                                <div class="card-top">
                                    <div class="card-top-left">
                                        <span class="badge-slot">${app.slot}</span>
                                        <span class="badge-date">🗓 ${app.date}</span>
                                    </div>
                                    <span class="badge-id">Appt #${app.id}</span>
                                </div>
                                <h4>${viewType === "student" ? app.supervisor : app.student_name}</h4>
                                <p>Student ID: ${app.student_id}</p>
                            </div>
                            <button onclick="openDeleteModal(${app.id})" class="btn-cancel">Cancel Session</button>
                        `;
        container.appendChild(card);
      });
    }
  } catch (e) {
    console.error(e);
  }
}

const modalDelete = document.getElementById("modal-delete");
function openDeleteModal(id) {
  deleteId = id;
  modalDelete.classList.add("show");
  setTimeout(() => modalDelete.classList.add("visible"), 10);
}
function closeDeleteModal() {
  modalDelete.classList.remove("visible");
  setTimeout(() => {
    modalDelete.classList.remove("show");
    deleteId = null;
  }, 300);
}
document
  .getElementById("confirm-delete-btn")
  .addEventListener("click", async () => {
    if (!deleteId) return;
    try {
      await api(`/appointments/${deleteId}`, { method: "DELETE" });
      closeDeleteModal();
      fetchAppointments(currentUser.role);
    } catch (e) {
      closeDeleteModal();
    }
  });

// Initialize App
updateNav();
navigate("home");

// Optional MockDB logic wrapper updated internally for Date logic if backend is unavailable.
const mockDB = {
  students: { S101: { name: "Alice Johnson", pwd: "1234" } },
  supervisors: { T101: { name: "Dr. Alan Turing", pwd: "1234" } },
  slots: ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM"],
  appointments: [],
  stuCount: 101,
  tCount: 101,
};
const originalApi = api;
api = async function (endpoint, options) {
  try {
    return await originalApi(endpoint, options);
  } catch (err) {
    console.warn("Using local Mock DB because server is down", err);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const method = options.method || "GET";
        if (endpoint === "/login") {
          const { id, password } = JSON.parse(options.body);
          if (
            id.startsWith("S") &&
            mockDB.students[id] &&
            mockDB.students[id].pwd === password
          )
            resolve({ id, name: mockDB.students[id].name, role: "student" });
          else if (
            id.startsWith("T") &&
            mockDB.supervisors[id] &&
            mockDB.supervisors[id].pwd === password
          )
            resolve({ id, name: mockDB.supervisors[id].name, role: "teacher" });
          else reject(new Error("Invalid ID or Password"));
        } else if (endpoint === "/register") {
          const { name, password, role } = JSON.parse(options.body);
          let newId;
          if (role === "student") {
            mockDB.stuCount++;
            newId = "S" + mockDB.stuCount;
            mockDB.students[newId] = { name, pwd: password };
          } else {
            mockDB.tCount++;
            newId = "T" + mockDB.tCount;
            mockDB.supervisors[newId] = { name, pwd: password };
          }
          resolve({ id: newId, name, role });
        } else if (endpoint === "/supervisors") {
          resolve({
            supervisors: Object.keys(mockDB.supervisors).map((k) => ({
              id: k,
              name: mockDB.supervisors[k].name,
            })),
          });
        } else if (endpoint.startsWith("/slots/")) {
          const urlObj = new URL("http://mock" + endpoint);
          const sup = decodeURIComponent(urlObj.pathname.split("/").pop());
          const date = urlObj.searchParams.get("date");
          const booked = mockDB.appointments
            .filter((a) => a.supervisor === sup && a.date === date)
            .map((a) => a.slot);
          resolve({
            availableSlots: mockDB.slots.filter((s) => !booked.includes(s)),
          });
        } else if (endpoint === "/book") {
          const data = JSON.parse(options.body);
          if (
            mockDB.appointments.some(
              (a) =>
                a.supervisor === data.supervisor &&
                a.date === data.date &&
                a.slot === data.slot,
            )
          )
            reject(new Error("Slot booked."));
          else {
            mockDB.appointments.push({
              id: Date.now(),
              student_id: data.student_id,
              student_name: mockDB.students[data.student_id].name,
              supervisor: data.supervisor,
              date: data.date,
              slot: data.slot,
            });
            resolve({ success: true, message: "Session booked successfully!" });
          }
        } else if (endpoint.startsWith("/appointments")) {
          const urlParams = new URLSearchParams(endpoint.split("?")[1]);
          let apps = mockDB.appointments;
          if (urlParams.has("student_id"))
            apps = apps.filter(
              (a) => a.student_id === urlParams.get("student_id"),
            );
          if (urlParams.has("teacher_name"))
            apps = apps.filter(
              (a) => a.supervisor === urlParams.get("teacher_name"),
            );
          resolve({ appointments: apps });
        } else if (
          endpoint.startsWith("/appointments/") &&
          method === "DELETE"
        ) {
          const id = parseInt(endpoint.split("/").pop());
          mockDB.appointments = mockDB.appointments.filter((a) => a.id !== id);
          resolve({ success: true });
        } else reject(new Error("Not found"));
      }, 300);
    });
  }
};
