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

app.get('/api/matches', (req, res) => {
  const { email } = req.query;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const matches = users.filter(u =>
    u.email !== user.email &&
    u.skill === user.skill &&
    u.availability.some(slot => user.availability.includes(slot))
  );
  res.json({ matches });
});

app.get('/', (req, res) => {
  res.send('Tennis Partner Finder Backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 