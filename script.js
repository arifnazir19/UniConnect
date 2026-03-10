
      // Media query for Header button via JS to match CSS media queries purely
      if (window.innerWidth >= 768) {
        document.querySelector("header .btn-primary").style.display =
          "inline-flex";
      }

      // ==========================================
      // CONFIG & MOCK API FALLBACK
      // ==========================================
      const API_BASE = "http://localhost:8000/api";

      
      async function api(endpoint, options = {}) {
        
          const res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: { "Content-Type": "application/json", ...options.headers },
          });
          if (!res.ok) {
            const errorMsg = await res.json().catch(()=>({}));
            throw new Error(errorMsg.error || "Server Error");
          }
          return await res.json();
      }


      // ==========================================
      // NAVIGATION
      // ==========================================
      function navigate(pageId) {
        document
          .querySelectorAll(".page-section")
          .forEach((sec) => sec.classList.remove("active"));
        document.getElementById(pageId).classList.add("active");

        document.querySelectorAll(".nav-btn").forEach((btn) => {
          if (btn.dataset.target === pageId) {
            btn.classList.add("active");
          } else {
            btn.classList.remove("active");
          }
        });

        if (pageId === "booking") initBooking();
        if (pageId === "appointments") fetchAppointments();

        // Clear msgs
        document.getElementById("msg-box").classList.add("hidden");
      }

      // ==========================================
      // BOOKING LOGIC & CUSTOM UI
      // ==========================================
      const supervisorSelect = document.getElementById("supervisor");
      const slotContainer = document.getElementById("slot-container");
      const hiddenSlotInput = document.getElementById("slot");

      async function initBooking() {
        if (supervisorSelect.options.length > 1) return; // already loaded
        try {
          const data = await api("/supervisors");
          data.supervisors.forEach((sup) => {
            const opt = document.createElement("option");
            opt.value = sup.name;
            opt.textContent = sup.name;
            supervisorSelect.appendChild(opt);
          });
        } catch (e) {
          console.error(e);
        }
      }

      supervisorSelect.addEventListener("change", async (e) => {
        const sup = e.target.value;
        if (!sup) return;

        document.getElementById("slot-loader").classList.remove("hidden");
        slotContainer.innerHTML = "";
        hiddenSlotInput.value = "";

        try {
          const data = await api(`/slots/${encodeURIComponent(sup)}`);
          document.getElementById("slot-loader").classList.add("hidden");

          if (data.availableSlots.length === 0) {
            slotContainer.innerHTML = `<div class="slots-empty" style="color: #dc2626;">No slots available for ${sup}</div>`;
            return;
          }

          // Render aesthetic pills
          data.availableSlots.forEach((slot) => {
            const pill = document.createElement("div");
            pill.className = "slot-pill";
            pill.textContent = slot;
            pill.onclick = () => selectSlot(pill, slot);
            slotContainer.appendChild(pill);
          });
        } catch (e) {
          console.error(e);
        }
      });

      function selectSlot(element, slotValue) {
        document
          .querySelectorAll(".slot-pill")
          .forEach((el) => el.classList.remove("selected"));
        element.classList.add("selected");
        hiddenSlotInput.value = slotValue;
      }

      document
        .getElementById("booking-form")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const slotVal = hiddenSlotInput.value;
          if (!slotVal) {
            showMsg("Please select a time slot.", "error");
            return;
          }

          const btn = document.getElementById("btn-submit");
          btn.innerHTML = "Processing...";
          btn.style.opacity = "0.7";
          btn.disabled = true;

          const payload = {
            student_id: document
              .getElementById("student_id")
              .value.trim()
              .toUpperCase(),
            supervisor: supervisorSelect.value,
            slot: slotVal,
          };

          try {
            const res = await api("/book", {
              method: "POST",
              body: JSON.stringify(payload),
            });
            showMsg(res.message, "success");
            e.target.reset();
            hiddenSlotInput.value = "";
            slotContainer.innerHTML =
              '<div class="slots-empty">Please select a supervisor first to view times.</div>';
          } catch (error) {
            showMsg(error.message, "error");
          } finally {
            btn.innerHTML = "Submit Booking";
            btn.style.opacity = "1";
            btn.disabled = false;
          }
        });

      function showMsg(text, type) {
        const box = document.getElementById("msg-box");
        box.textContent = text;
        box.className = `msg-box ${type === "success" ? "msg-success" : "msg-error"}`;
      }

      // ==========================================
      // APPOINTMENTS LOGIC
      // ==========================================
      let deleteId = null;

      async function fetchAppointments() {
        const container = document.getElementById("appointments-container");
        const empty = document.getElementById("empty-state");
        container.innerHTML = "";

        try {
          const data = await api("/appointments");
          if (data.appointments.length === 0) {
            empty.classList.remove("hidden");
          } else {
            empty.classList.add("hidden");

            data.appointments.forEach((app) => {
              const card = document.createElement("div");
              card.className = "appointment-card";
              card.innerHTML = `
                            <div class="card-accent-bar"></div>
                            <div class="card-content">
                                <div class="card-top">
                                    <span class="badge-slot">${app.slot}</span>
                                    <span class="badge-id">ID: ${app.student_id}</span>
                                </div>
                                <h4>${app.supervisor}</h4>
                                <p>Student: ${app.student_name}</p>
                            </div>
                            <button onclick="openModal(${app.id})" class="btn-cancel">
                                Cancel Session
                            </button>
                        `;
              container.appendChild(card);
            });
          }
        } catch (e) {
          console.error(e);
        }
      }

      // Modal Logic
      const modal = document.getElementById("modal");

      function openModal(id) {
        deleteId = id;
        modal.classList.add("show");
        setTimeout(() => {
          modal.classList.add("visible");
        }, 10);
      }

      function closeModal() {
        modal.classList.remove("visible");
        setTimeout(() => {
          modal.classList.remove("show");
          deleteId = null;
        }, 300);
      }

      document
        .getElementById("confirm-delete-btn")
        .addEventListener("click", async () => {
          if (!deleteId) return;
          const btn = document.getElementById("confirm-delete-btn");
          btn.textContent = "...";

          try {
            await api(`/appointments/${deleteId}`, { method: "DELETE" });
            closeModal();
            fetchAppointments();
          } catch (e) {
            alert("Failed to delete.");
            closeModal();
          } finally {
            btn.textContent = "Delete";
          }
        });

      // Start
      navigate("home");
