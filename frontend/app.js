// Tennis Partner Finder Frontend (API version)

const API_BASE = 'http://localhost:3000'; // Change to your Render URL after deployment

let currentUser = null;
let slots = [];

// DOM elements
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const userForm = signupForm; // For compatibility with old code
const availabilityForm = document.getElementById('availability-form');
const matchesDiv = document.getElementById('matches');
const matchList = document.getElementById('match-list');
const dayPicker = document.getElementById('day-picker');
const startPicker = document.getElementById('start-picker');
const endPicker = document.getElementById('end-picker');
const addSlotBtn = document.getElementById('add-slot');
const slotsList = document.getElementById('slots-list');
const findPartnersBtn = availabilityForm.querySelector('button[type="submit"]');
const showSignupBtn = document.getElementById('show-signup');
const showLoginBtn = document.getElementById('show-login');
const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');

function showSection(section) {
  loginForm.style.display = 'none';
  signupForm.style.display = 'none';
  availabilityForm.style.display = 'none';
  matchesDiv.style.display = 'none';
  section.style.display = 'block';
}

// --- API Calls ---
async function lookupUser(name, email) {
  const res = await fetch(`${API_BASE}/api/users?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`);
  if (res.ok) return res.json();
  throw new Error('User not found');
}
async function registerUser(name, email, skill) {
  const res = await fetch(`${API_BASE}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, skill })
  });
  return res.json();
}
async function addAvailability(email, slots) {
  const res = await fetch(`${API_BASE}/api/availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, slots })
  });
  return res.json();
}
async function getMatches(email) {
  const res = await fetch(`${API_BASE}/api/matches?email=${encodeURIComponent(email)}`);
  return res.json();
}

// --- Login Flow ---
loginForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  loginError.textContent = '';
  const name = document.getElementById('login-name').value.trim();
  const email = document.getElementById('login-email').value.trim();
  if (!name || !email) return;
  try {
    const result = await lookupUser(name, email);
    currentUser = result.user;
    // Go directly to matching page
    const matchResult = await getMatches(currentUser.email);
    showMatches(matchResult.matches);
    showSection(matchesDiv);
  } catch (err) {
    loginError.textContent = 'User not found. Please sign up.';
  }
});

// --- Sign Up Flow ---
showSignupBtn.addEventListener('click', () => {
  signupError.textContent = '';
  showSection(signupForm);
});
showLoginBtn.addEventListener('click', () => {
  loginError.textContent = '';
  showSection(loginForm);
});
signupForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  signupError.textContent = '';
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const skill = document.getElementById('signup-skill').value;
  if (!name || !email || !skill) return;
  const result = await registerUser(name, email, skill);
  if (result.success) {
    currentUser = { name, email, skill };
    showSection(availabilityForm);
  } else {
    signupError.textContent = result.error || 'Registration failed';
  }
});

// --- Availability & Matching (as before) ---
function updateFindPartnersBtn() {
  const pickersEmpty = !dayPicker.value && !startPicker.value && !endPicker.value;
  const enabled = slots.length > 0 && pickersEmpty;
  findPartnersBtn.disabled = !enabled;
}
dayPicker.addEventListener('change', updateFindPartnersBtn);
startPicker.addEventListener('change', updateFindPartnersBtn);
endPicker.addEventListener('change', updateFindPartnersBtn);

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
  updateFindPartnersBtn();
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
      updateFindPartnersBtn();
    };
    li.appendChild(removeBtn);
    slotsList.appendChild(li);
  });
  updateFindPartnersBtn();
}
availabilityForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  if (slots.length === 0) return;
  await addAvailability(currentUser.email, slots);
  const matchResult = await getMatches(currentUser.email);
  showMatches(matchResult.matches);
  showSection(matchesDiv);
  slots = [];
  renderSlots();
});
function showMatches(matches) {
  matchList.innerHTML = '';
  if (!matches || matches.length === 0) {
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
showSection(loginForm);
updateFindPartnersBtn();
renderSlots(); 