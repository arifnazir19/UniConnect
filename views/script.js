
      const API_BASE = "http://localhost:8000/api";
      let currentUser =
        JSON.parse(localStorage.getItem("uniconnect_user")) || null;

      function updateNav() {
        document.getElementById("nav-guest").classList.add("hidden");
        document.getElementById("nav-user").classList.add("hidden");
        document
          .querySelectorAll(".auth-student")
          .forEach((el) => el.classList.add("hidden"));
        document
          .querySelectorAll(".auth-teacher")
          .forEach((el) => el.classList.add("hidden"));

        if (!currentUser) {
          document.getElementById("nav-guest").classList.remove("hidden");
        } else {
          document.getElementById("nav-user").classList.remove("hidden");
          document.getElementById("nav-user-name").textContent =
            currentUser.name;
          document.getElementById("nav-user-id").textContent = currentUser.id;
          if (currentUser.role === "student")
            document
              .querySelectorAll(".auth-student")
              .forEach((el) => el.classList.remove("hidden"));
          else if (currentUser.role === "teacher")
            document
              .querySelectorAll(".auth-teacher")
              .forEach((el) => el.classList.remove("hidden"));
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
        const activeBtn = document.querySelector(
          `.nav-btn[data-target="${pageId}"]`,
        );
        if (activeBtn) activeBtn.classList.add("active");

        if (pageId === "booking") initBooking();
        if (pageId === "appointments") fetchAppointments("student");
        if (pageId === "teacher-dashboard") fetchAppointments("teacher");
        document
          .querySelectorAll(".msg-box")
          .forEach((b) => b.classList.add("hidden"));
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
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Server Error");
        return data;
      }

      document
        .getElementById("login-form")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          try {
            const res = await api("/login", {
              method: "POST",
              body: JSON.stringify({
                id: document
                  .getElementById("login-id")
                  .value.trim()
                  .toUpperCase(),
                password: document.getElementById("login-pwd").value,
              }),
            });
            currentUser = res;
            localStorage.setItem(
              "uniconnect_user",
              JSON.stringify(currentUser),
            );
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
            localStorage.setItem(
              "uniconnect_user",
              JSON.stringify(currentUser),
            );
            updateNav();
            e.target.reset();
            document.getElementById("new-user-id").textContent = res.id;
            document
              .getElementById("id-display-modal")
              .classList.add("show", "visible");
          } catch (err) {
            const b = document.getElementById("msg-auth");
            b.textContent = err.message;
            b.className = "msg-box msg-error";
            b.classList.remove("hidden");
          }
        });

      function closeIdModal() {
        document
          .getElementById("id-display-modal")
          .classList.remove("show", "visible");
        handleHomeAction();
      }
      function logout() {
        currentUser = null;
        localStorage.removeItem("uniconnect_user");
        updateNav();
        navigate("home");
      }

      const supervisorSelect = document.getElementById("supervisor"),
        slotContainer = document.getElementById("slot-container"),
        hiddenSlotInput = document.getElementById("slot");
      async function initBooking() {
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

      supervisorSelect.addEventListener("change", async (e) => {
        slotContainer.innerHTML = "";
        hiddenSlotInput.value = "";
        try {
          const data = await api(
            `/slots/${encodeURIComponent(e.target.value)}`,
          );
          if (data.availableSlots.length === 0) {
            slotContainer.innerHTML = `<div style="grid-column: 1/-1; color: #dc2626; font-weight: 600; text-align: center;">No slots available</div>`;
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
      });

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
            const res = await api("/book", {
              method: "POST",
              body: JSON.stringify({
                student_id: currentUser.id,
                supervisor: supervisorSelect.value,
                slot: hiddenSlotInput.value,
              }),
            });
            const mb = document.getElementById("msg-booking");
            mb.textContent = res.message;
            mb.className = "msg-box msg-success";
            mb.classList.remove("hidden");
            e.target.reset();
            hiddenSlotInput.value = "";
            slotContainer.innerHTML =
              '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-weight: 500;">Please select a teacher first to view times.</div>';
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

              // Clean HTML rendering for the Cards replacing inline styles
              card.innerHTML = `
                            <div class="card-accent-bar"></div>
                            <div class="card-content">
                                <div class="card-top">
                                    <span class="badge-slot">${app.slot}</span>
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

      updateNav();
      navigate("home");
