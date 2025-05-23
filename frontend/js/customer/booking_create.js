// booking_create.js
import { BASE_URL } from "./../config.js";

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    window.location.href = "/frontend/login.html";
    return;
  }
  if (localStorage.getItem("role")!="customer") {
      alert("You Are not authorised to view this page");
      window.location.href = "/frontend/index.html";
      return;
    }
});

const customerCardsContainer = document.getElementById("customer-cards-container");
const addPersonBtn = document.getElementById("add-person-btn");
const submitBookingBtn = document.getElementById("submit-booking-btn");
const bookingDateInput = document.getElementById("booking-date");
const slotStartSelect = document.getElementById("slot-start");
const slotEndSelect = document.getElementById("slot-end");
const errorMessage = document.getElementById("error-message");

// Generate time options from 8:00 AM to 9:00 PM with 10-minute intervals
function generateTimeOptions(selectElement) {
  selectElement.innerHTML = "";
  const start = new Date();
  start.setHours(8, 0, 0, 0);
  for (let i = 0; i <= 78; i++) {
    const hours = start.getHours().toString().padStart(2, '0');
    const minutes = start.getMinutes().toString().padStart(2, '0');
    const option = document.createElement("option");
    option.value = `${hours}:${minutes}`;
    option.textContent = `${hours}:${minutes}`;
    selectElement.appendChild(option);
    start.setMinutes(start.getMinutes() + 10);
  }
}

// Create a customer info card
function createCustomerCard(index = 0) {
  const card = document.createElement("div");
  card.className = "customer-card";

  card.innerHTML = `
    <label>Customer Id: <input type="number" class="customer-id"/></label>
    <label>Full Name: <input type="text" class="full-name" required /></label>
    <label>Age: <input type="number" class="age" required min="1" /></label>
    <label>Gender: 
      <select class="gender">
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
      </select>
    </label>
    <label>Needs Swimwear: 
      <select class="needs-swimwear">
        <option value="No">No</option>
        <option value="Yes">Yes</option>
      </select>
    </label>
    <label class="swimwear-type-container" style="display:none;">Swimwear Type: 
      <select class="swimwear-type">
        <option value="shorts">shorts</option>
        <option value="shorts+tshirt">shorts+tshirt</option>
        <option value="female-set">female-set</option>
      </select>
    </label>
    <label>Needs Tube: 
      <select class="needs-tube">
        <option value="No">No</option>
        <option value="Yes">Yes</option>
      </select>
    </label>
    <label>Needs Goggles: 
      <select class="needs-goggles">
        <option value="No">No</option>
        <option value="Yes">Yes</option>
      </select>
    </label>
    ${index > 0 ? '<button class="delete-btn">Delete</button>' : ''}
  `;

  const needsSwimwearSelect = card.querySelector(".needs-swimwear");
  const swimwearContainer = card.querySelector(".swimwear-type-container");

  needsSwimwearSelect.addEventListener("change", (e) => {
    swimwearContainer.style.display = e.target.value === "Yes" ? "block" : "none";
  });

  const deleteBtn = card.querySelector(".delete-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => card.remove());
  }

  customerCardsContainer.appendChild(card);
}

// Validate booking date and time
function validateDateTime() {
  const selectedDate = new Date(bookingDateInput.value);
  const now = new Date();
  selectedDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  if (selectedDate < now) {
    errorMessage.textContent = "Booking date cannot be in the past.";
    return false;
  }

  const startTime = slotStartSelect.value;
  const endTime = slotEndSelect.value;
  if (startTime >= endTime) {
    errorMessage.textContent = "Slot end time must be after start time.";
    return false;
  }

  errorMessage.textContent = "";
  return true;
}

// Add new person
addPersonBtn.addEventListener("click", () => {
    const newIndex = document.querySelectorAll(".customer-card").length;
    createCustomerCard(newIndex);
  });

// Submit booking
submitBookingBtn.addEventListener("click", async () => {
  if (!validateDateTime()) return;

  const bookingDate = bookingDateInput.value;
  const slotStart = slotStartSelect.value;
  const slotEnd = slotEndSelect.value;
  const now = new Date();
  const slotDateTime = new Date(`${bookingDate}T${slotStart}`);
  if (slotDateTime < now) {
    alert("Cannot book a past time slot.");
    return;
  }

  const cards = document.querySelectorAll(".customer-card");
  const bookings = [];

  cards.forEach((card) => {
    const customerId = card.querySelector(".customer-id").value.trim();
    const fullName = card.querySelector(".full-name").value.trim();
    const uage = parseInt(card.querySelector(".age").value);
    const ugender = card.querySelector(".gender").value;
    const needsSwimwear = card.querySelector(".needs-swimwear").value === "Yes";
    const swimwearType = needsSwimwear ? card.querySelector(".swimwear-type").value : null;
    const needsTube = card.querySelector(".needs-tube").value === "Yes";
    const needsGoggles = card.querySelector(".needs-goggles").value === "Yes";

    const bookingTime = new Date().toISOString().slice(0, 19).replace("T", " ");

    bookings.push({
      customer_id: customerId,
      full_name: fullName,
      age: uage,
      gender:ugender,
      needs_swimwear: needsSwimwear,
      swimwear_type: swimwearType,
      needs_tube: needsTube,
      needs_goggles: needsGoggles,
      booking_date: bookingDate,
      slot_start: slotStart,
      slot_end: slotEnd,
      booking_time: bookingTime,
    });
  });

  // Submit to backend
  try {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${BASE_URL}/bookings/CustomerCreateBooking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bookings),
    });

    if (!res.ok) throw new Error("Booking failed.");

    alert("Booking successful!");
    window.location.href = "/frontend/index.html";
  } catch (err) {
    console.error("Booking error:", err);
    alert("Something went wrong. Try again.");
  }
});

// Init on load
window.addEventListener("DOMContentLoaded", () => {
  generateTimeOptions(slotStartSelect);
  generateTimeOptions(slotEndSelect);
  createCustomerCard(0);
});
