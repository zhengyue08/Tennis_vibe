// In-memory storage for users
const users = [];
let currentUser = null;

const userForm = document.getElementById('user-form');
const availabilityForm = document.getElementById('availability-form');
const matchesDiv = document.getElementById('matches');
const matchList = document.getElementById('match-list');
const dayPicker = document.getElementById('day-picker');
const startPicker = document.getElementById('start-picker');
const endPicker = document.getElementById('end-picker');
const addSlotBtn = document.getElementById('add-slot');
const slotsList = document.getElementById('slots-list');
let slots = [];

const findPartnersBtn = availabilityForm.querySelector('button[type="submit"]');

userForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const skill = document.getElementById('skill').value;
  if (!name || !email || !skill) return;
  currentUser = { name, email, skill, availability: [] };
  userForm.style.display = 'none';
  availabilityForm.style.display = 'block';
});

// Populate time pickers (e.g., 06:00 to 22:00, every 30 min)
function populateTimePicker(select, startHour, endHour) {
  select.innerHTML = '<option value="">'+(select.id==='start-picker'?'Start...':'End...')+'</option>';
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, '0');
      const min = m.toString().padStart(2, '0');
      const val = `${hour}:${min}`;
      select.innerHTML += `<option value="${val}">${val}</option>`;
    }
  }
}
populateTimePicker(startPicker, 6, 22);
populateTimePicker(endPicker, 6, 22);

addSlotBtn.addEventListener('click', function() {
  const day = dayPicker.value;
  const start = startPicker.value;
  const end = endPicker.value;
  let warning = document.getElementById('slot-warning');
  if (warning) warning.remove();
  if (!day || !start || !end) return;
  if (end <= start) {
    showSlotWarning('End time must be after start time.');
    return;
  }
  const slot = `${day} ${start}-${end}`;
  if (slots.includes(slot)) {
    showSlotWarning('This slot is already added.');
    return;
  }
  slots.push(slot);
  renderSlots();
  // Reset pickers
  dayPicker.value = '';
  startPicker.value = '';
  endPicker.value = '';
});

function showSlotWarning(msg) {
  let warning = document.createElement('div');
  warning.id = 'slot-warning';
  warning.textContent = msg;
  warning.style.color = '#c00';
  warning.style.margin = '4px 0 8px 0';
  warning.style.fontSize = '0.98em';
  addSlotBtn.parentNode.insertBefore(warning, addSlotBtn.nextSibling);
}

function renderSlots() {
  slotsList.innerHTML = '';
  slots.forEach((slot, idx) => {
    const li = document.createElement('li');
    li.textContent = slot;
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '✕';
    removeBtn.title = 'Remove';
    removeBtn.onclick = () => {
      slots.splice(idx, 1);
      renderSlots();
    };
    li.appendChild(removeBtn);
    slotsList.appendChild(li);
  });
}

availabilityForm.addEventListener('submit', function(e) {
  e.preventDefault();
  console.log('Find Partners button clicked');
  if (slots.length === 0) return;
  currentUser.availability = [...slots];
  users.push(currentUser);
  showMatches();
  availabilityForm.style.display = 'none';
  matchesDiv.style.display = 'block';
  slots = [];
  renderSlots();
});

function showMatches() {
  matchList.innerHTML = '';
  if (!currentUser) return;
  // Find users with same skill and overlapping availability, excluding self
  const matches = users.filter(u =>
    u !== currentUser &&
    u.skill === currentUser.skill &&
    u.availability.some(slot => currentUser.availability.includes(slot))
  );
  if (matches.length === 0) {
    matchList.innerHTML = '<li>No matching partners found.</li>';
    return;
  }
  matches.forEach(u => {
    const li = document.createElement('li');
    li.textContent = `${u.name} (${u.email})`;
    matchList.appendChild(li);
  });
}

// Initial state
renderSlots(); 