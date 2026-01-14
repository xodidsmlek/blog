const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();

app.use(express.json());           // ⭐ 필수
app.use(express.urlencoded({ extended: true })); // 선
app.use(cors({
  origin: ['https://xodidsmlek.github.io','http://localhost:5173'],
  methods: ['GET', 'POST'],
  credentials: true
}));

const POSTS_DIR = path.join(__dirname, 'posts');

// 팀리스트 전체 조회
app.get('/team_list', async (req, res) => {
  console.log("Received request for /team_list");
  
  const result = db.prepare(
    'SELECT id, f_nm, l_nm, team FROM team_user WHERE use_yn = \'Y\' ORDER BY team DESC'
  ).all();

  res.json(result);
});

// 팀명리스트 전체 조회
app.get('/team_nm_list', async (req, res) => {
  console.log("Received request for /team_list");
  
  const result = db.prepare(
    'SELECT DISTINCT team FROM team_user WHERE use_yn = \'Y\' ORDER BY id'
  ).all();

  res.json(result);
});

// 특정 팀리스트 조회
app.post('/detail_team_list', async (req, res) => {
  console.log("Received request for /detail_team_list");
  const {team } = req.body;
  
  const result = db.prepare(
    'SELECT id, f_nm, l_nm, team FROM team_user WHERE use_yn = \'Y\' AND team = ? ORDER BY team DESC'
  ).all(team);
  res.json(result);
});

// 등록
app.post('/teamInsert', (req, res) => {
  const { f_nm, l_nm, team, pw } = req.body;
  if(pw != "20yearsoldup")return res.status(401).json({ message: '땡!' });

  const result = db.prepare(
    'INSERT INTO team_user (f_nm, l_nm, team) VALUES (?, ?, ?)'
  ).run(f_nm, l_nm, team);

  res.json();
});

// 수정
app.post('/teamUpdate', (req, res) => {
  const { id, f_nm, l_nm, team, pw } = req.body;
  if(pw != "20yearsoldup")return res.status(401).json({ message: '땡!' });

  const result = db.prepare(
    'UPDATE team_user SET f_nm = ?, l_nm = ?, team = ? WHERE id = ?'
  ).run(f_nm, l_nm, team, id);

  res.json();
});

// 삭제
app.post('/idDelete', (req, res) => {
  const { id, pw } = req.body;
  if(pw != "20yearsoldup")return res.status(401).json({ message: '땡!' });

  const result = db.prepare(
    'DELETE FROM team_user WHERE id = ?'
  ).run(id);

  res.json();
});

// 팀 전체 삭제
app.post('/teamDelete', (req, res) => {
  const { team, pw } = req.body;
  if(pw != "20yearsoldup")return res.status(401).json({ message: '땡!' });

  const result = db.prepare(
    'DELETE FROM team_user WHERE team = ?'
  ).run(team);

  res.json();
});


app.listen(4000, () => {
  console.log('✅ Server running on http://localhost:4000');
});