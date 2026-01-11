const Database = require('better-sqlite3');

// DB 파일 생성 (없으면 자동 생성)
const db = new Database('./db/data.db', {
  verbose: console.log // 쿼리 로그 (선택)
});

// WAL 모드 (동시성 + 성능 안정)
db.pragma('journal_mode = WAL');

// 테이블 생성
db.prepare(`
  CREATE TABLE IF NOT EXISTS team_user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    f_nm TEXT NOT NULL,
    l_nm TEXT NOT NULL,
    team TEXT NOT NULL,
    use_yn TEXT DEFAULT 'Y',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

module.exports = db;
