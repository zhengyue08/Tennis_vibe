import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/debug/users', (req, res) => {
  res.json({ users });
}); 
// In-memory storage
const users = []; // { name, email, skill, availability: [] }

app.post('/api/users', (req, res) => {
  const { name, email, skill } = req.body;
  if (!name || !email || !skill) return res.status(400).json({ error: 'Missing fields' });
  let user = users.find(u => u.email === email);
  if (!user) {
    user = { name, email, skill, availability: [] };
    users.push(user);
  } else {
    user.name = name;
    user.skill = skill;
  }
  res.json({ success: true, user });
});

app.post('/api/availability', (req, res) => {
  const { email, slots } = req.body;
  if (!email || !Array.isArray(slots)) return res.status(400).json({ error: 'Missing fields' });
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.availability = slots;
  res.json({ success: true });
});

function parseSlot(slot) {
  // Example slot: "Monday 09:00-10:00"
  const [day, time] = slot.split(' ');
  const [start, end] = time.split('-');
  return { day, start, end };
}

function getOverlap(slotA, slotB) {
  if (slotA.day !== slotB.day) return null;
  const start = slotA.start > slotB.start ? slotA.start : slotB.start;
  const end = slotA.end < slotB.end ? slotA.end : slotB.end;
  if (start < end) return { day: slotA.day, start, end };
  return null;
}

app.get('/api/matches', (req, res) => {
  const { email } = req.query;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const matches = [];

  users.forEach(u => {
    if (u.email === user.email || u.skill !== user.skill) return;
    const overlaps = [];
    user.availability.forEach(slotA => {
      const parsedA = parseSlot(slotA);
      u.availability.forEach(slotB => {
        const parsedB = parseSlot(slotB);
        const overlap = getOverlap(parsedA, parsedB);
        if (overlap) {
          overlaps.push(`${overlap.day} ${overlap.start}-${overlap.end}`);
        }
      });
    });
    if (overlaps.length > 0) {
      matches.push({
        name: u.name,
        email: u.email,
        overlaps
      });
    }
  });

  res.json({ matches });
});

// Lookup user by name and email
app.get('/api/users', (req, res) => {
  const { name, email } = req.query;
  if (!name || !email) return res.status(400).json({ error: 'Missing fields' });
  const user = users.find(u => u.name === name && u.email === email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

app.get('/', (req, res) => {
  res.send('Tennis Partner Finder Backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 