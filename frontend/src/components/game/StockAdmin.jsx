import React, { useState, useEffect } from "react";

const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:4000"
  : "https://blog-nvf1.onrender.com";

const ADMIN_PASSWORD = "turnstockadmin123";

/* ─── 공통 인라인 스타일 팔레트 ─── */
const S = {
  page:    { padding: "12px", maxWidth: "100%", boxSizing: "border-box", fontFamily: "sans-serif" },
  card:    { background: "#fff", borderRadius: 14, boxShadow: "0 2px 10px rgba(0,0,0,.07)", border: "1px solid #f0f0f0", marginBottom: 14, padding: "16px" },
  header:  { background: "#1f2937", borderRadius: 14, padding: "16px", marginBottom: 14, color: "#fff" },
  label:   { display: "block", fontSize: 11, color: "#9ca3af", marginBottom: 4, fontWeight: 600 },
  input:   { width: "100%", boxSizing: "border-box", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none" },
  inputSm: { boxSizing: "border-box", padding: "6px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, outline: "none" },
  btnPrimary:  { background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  btnDanger:   { background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  btnDark:     { background: "#1f2937", color: "#fff", border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  btnGray:     { background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  btnSuccess:  { background: "#059669", color: "#fff", border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  btnBlock:    { width: "100%", display: "block", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  divider:     { borderTop: "1px solid #f3f4f6", margin: "12px 0" },
  row:         { display: "flex", alignItems: "center", gap: 8 },
  rowBetween:  { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  badge:       (color) => ({ background: color + "1a", color, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700 }),
  sectionTitle:{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 10 },
};

function StockAdmin() {
  const [screenPw, setScreenPw]           = useState("");
  const [isAuthorized, setIsAuthorized]   = useState(false);
  const [serverPw, setServerPw]           = useState("");
  const [games, setGames]                 = useState([]);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [gameStatus, setGameStatus]       = useState(null);
  const [stocks, setStocks]               = useState([]);
  const [news, setNews]                   = useState([]);
  const [users, setUsers]                 = useState([]);
  const [showUsers, setShowUsers]         = useState(false);

  // 입력 폼 상태
  const [newStockName, setNewStockName]   = useState("");
  const [newStockPrice, setNewStockPrice] = useState("");
  const [editPriceMap, setEditPriceMap]   = useState({});  // stockId → 수정가격(string)
  const [editNameMap, setEditNameMap]     = useState({});  // stockId → 수정종목명(string)
  const [expandedStockId, setExpandedStockId] = useState(null); // 수정 패널 열린 stockId

  const [newNewsTurn, setNewNewsTurn]     = useState("");
  const [newNewsContent, setNewNewsContent] = useState("");
  const [adjustCashMap, setAdjustCashMap] = useState({});  // userId → amount(string)

  const [error, setError]   = useState("");
  const [toast, setToast]   = useState("");  // 성공 메시지 토스트

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  // ── Auth ─────────────────────────────────────────
  useEffect(() => {
    if (isAuthorized) fetchOpenGames();
  }, [isAuthorized]);

  const handleAuthorize = (e) => {
    e.preventDefault();
    if (screenPw === ADMIN_PASSWORD) {
      setIsAuthorized(true);
      setServerPw(screenPw);
      setError("");
    } else {
      setError("비밀번호가 올바르지 않습니다.");
    }
  };

  // ── 게임 목록 ────────────────────────────────────
  const fetchOpenGames = async () => {
    try {
      const res  = await fetch(`${API_BASE_URL}/api/games`);
      const data = await res.json();
      if (res.ok) setGames(data.filter((g) => g.isOpen));
    } catch { setError("게임 리스트 로딩 실패"); }
  };

  useEffect(() => {
    if (selectedGameId) {
      fetchGameDetails();
      setShowUsers(false);
      setUsers([]);
      setExpandedStockId(null);
    } else {
      setGameStatus(null);
      setStocks([]);
      setNews([]);
    }
  }, [selectedGameId]);

  // ── 게임 상세 ────────────────────────────────────
  const fetchGameDetails = async () => {
    if (!selectedGameId) return;
    try {
      const [statusRes, stockRes, newsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/games/${selectedGameId}/status`),
        fetch(`${API_BASE_URL}/api/games/${selectedGameId}/stocks`),
        fetch(`${API_BASE_URL}/api/games/${selectedGameId}/news`),
      ]);

      if (statusRes.ok) {
        const d = await statusRes.json();
        setGameStatus(d);
        setNewNewsTurn(d.currentTurn);
      }
      if (stockRes.ok) {
        const d = await stockRes.json();
        setStocks(d);
        const pm = {}, nm = {};
        d.forEach((s) => { pm[s.id] = String(s.currentPrice); nm[s.id] = s.stockName; });
        setEditPriceMap(pm);
        setEditNameMap(nm);
      }
      if (newsRes.ok) {
        const d = await newsRes.json();
        setNews(d);
      }
    } catch { setError("상세 정보를 가져오는 데 실패했습니다."); }
  };

  // ── 장 오픈/잠금 ──────────────────────────────────
  const handleToggleLock = async () => {
    try {
      const res  = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/turn/toggle-lock`, { method: "POST" });
      const data = await res.json();
      if (res.ok) { showToast(data.message); fetchGameDetails(); }
    } catch { alert("서버 연결 에러"); }
  };

  // ── 자동판매 토글 ─────────────────────────────────
  const handleToggleAutoSell = async () => {
    const cur = gameStatus?.autoSellOnTurnEnd;
    try {
      const res  = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/turn/toggle-auto-sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoSell: !cur }),
      });
      const data = await res.json();
      if (res.ok) { showToast(data.message); fetchGameDetails(); }
    } catch { alert("서버 연결 에러"); }
  };

  // ── 다음 턴 진행 ──────────────────────────────────
  const handleNextTurn = async () => {
    if (!window.confirm("정말 현재 턴을 마감하고 다음 턴으로 넘어가시겠습니까?\n이때 주가 변동 및 설정에 따라 주식 자동판매가 진행됩니다.")) return;
    try {
      const res  = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/turn/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) { showToast(data.message); fetchGameDetails(); if (showUsers) fetchUsers(); }
      else alert(data.error);
    } catch { alert("서버 연결 에러"); }
  };

  // ── 주식 추가 ────────────────────────────────────
  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!newStockName.trim() || !newStockPrice) return alert("종목명과 주가를 입력하세요.");
    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/stocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockName: newStockName.trim(), price: Number(newStockPrice) }),
      });
      if (res.ok) { showToast("주식이 추가되었습니다."); setNewStockName(""); setNewStockPrice(""); fetchGameDetails(); }
      else { const d = await res.json(); alert(d.error); }
    } catch { alert("주식 추가 에러"); }
  };

  // ── 주식 수정 (종목명 + 주가 동시) ──────────────────
  const handleUpdateStock = async (stockId) => {
    const newPrice = editPriceMap[stockId];
    const newName  = editNameMap[stockId];
    if (newPrice === "" || newPrice === undefined) return alert("수정할 주가를 입력해 주세요.");

    const body = {};
    if (newName && newName.trim()) body.stockName = newName.trim();
    if (newPrice !== "") body.price = Number(newPrice);

    try {
      const res  = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/stocks/${stockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("주가가 수정되었습니다.");
        setExpandedStockId(null);
        fetchGameDetails();
      } else {
        alert(data.error || "수정 실패");
      }
    } catch { alert("주식 수정 에러"); }
  };

  // ── 주식 삭제 ────────────────────────────────────
  const handleDeleteStock = async (stockId, stockName) => {
    if (!window.confirm(`정말 [${stockName}] 종목을 삭제하시겠습니까?\n유저가 보유한 해당 주식 데이터도 모두 파기됩니다.`)) return;
    try {
      const res  = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/stocks/${stockId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) { showToast("주식이 삭제되었습니다."); fetchGameDetails(); }
      else alert(data.error || "삭제 실패");
    } catch { alert("주식 삭제 에러"); }
  };

  // ── 속보 추가 ────────────────────────────────────
  const handleAddNews = async (e) => {
    e.preventDefault();
    if (!newNewsTurn || !newNewsContent.trim()) return alert("턴 번호와 속보 내용을 입력하세요.");
    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/news`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnNo: Number(newNewsTurn), content: newNewsContent.trim() }),
      });
      if (res.ok) { showToast("속보가 송출되었습니다!"); setNewNewsContent(""); fetchGameDetails(); }
      else { const d = await res.json(); alert(d.error); }
    } catch { alert("속보 등록 실패"); }
  };

  // ── 유저 목록 ────────────────────────────────────
  const fetchUsers = async () => {
    try {
      const res  = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/users`);
      const data = await res.json();
      if (res.ok) { setUsers(data); setShowUsers(true); }
      else alert(data.error || "유저 목록 로딩 실패");
    } catch { alert("서버 연결 실패"); }
  };

  // ── 예수금 조정 ──────────────────────────────────
  const handleAdjustCash = async (userId, uName) => {
    const amount = adjustCashMap[userId];
    if (!amount || isNaN(Number(amount))) return alert("변경할 금액을 숫자로 입력해 주세요.");
    try {
      const res  = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/users/${userId}/add-cash`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), server_pw: serverPw }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`${uName}님 예수금 변경 완료 (${Number(amount) >= 0 ? "+" : ""}${Number(amount).toLocaleString()}원)`);
        setAdjustCashMap({ ...adjustCashMap, [userId]: "" });
        fetchUsers();
      } else alert(data.error);
    } catch { alert("예수금 변경 실패"); }
  };

  // ── 유저 삭제 ────────────────────────────────────
  const handleDeleteUser = async (userId, uName) => {
    if (!window.confirm(`정말 [${uName}] 유저를 강제 추방/삭제하시겠습니까?\n모든 가상 자산과 거래 내역이 삭제됩니다.`)) return;
    try {
      const res  = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/users/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ server_pw: serverPw }),
      });
      const data = await res.json();
      if (res.ok) { showToast("유저가 삭제되었습니다."); fetchUsers(); }
      else alert(data.error);
    } catch { alert("유저 삭제 실패"); }
  };

  // ═══════════════════════════════════════════════════
  // 로그인 화면
  // ═══════════════════════════════════════════════════
  if (!isAuthorized) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: 16 }}>
        <div style={{ ...S.card, maxWidth: 360, width: "100%", padding: 28 }}>
          <h2 style={{ textAlign: "center", fontSize: 20, fontWeight: 800, marginBottom: 6, color: "#111827" }}>👑 매니저 로그인</h2>
          <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginBottom: 20 }}>관리자 비밀번호를 입력하세요.</p>
          <form onSubmit={handleAuthorize}>
            <input
              type="password"
              value={screenPw}
              onChange={(e) => setScreenPw(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              style={{ ...S.input, marginBottom: 8 }}
              autoFocus
            />
            {error && <p style={{ color: "#dc2626", fontSize: 12, marginBottom: 8, textAlign: "center" }}>{error}</p>}
            <button type="submit" style={{ ...S.btnBlock, background: "#2563eb", color: "#fff" }}>
              매니저 화면 활성화
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // 메인 관리 화면
  // ═══════════════════════════════════════════════════
  return (
    <div style={S.page}>

      {/* 토스트 알림 */}
      {toast && (
        <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: "#1f2937", color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,.2)", whiteSpace: "nowrap" }}>
          ✅ {toast}
        </div>
      )}

      {/* 헤더 */}
      <div style={S.header}>
        <h2 style={{ textAlign: "center", fontWeight: 800, fontSize: 16, margin: "0 0 12px" }}>👑 주식게임 매니저 콘솔</h2>
        <label style={{ ...S.label, color: "#9ca3af" }}>관리할 게임 선택 (오픈된 게임만 표시)</label>
        <select
          value={selectedGameId}
          onChange={(e) => setSelectedGameId(e.target.value)}
          style={{ ...S.input, background: "#374151", color: "#fff", border: "1px solid #4b5563" }}
        >
          <option value="">-- 게임을 선택하세요 --</option>
          {games.map((g) => (
            <option key={g.id} value={g.id}>{g.gameName}</option>
          ))}
        </select>
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: 10, fontSize: 12, marginBottom: 12 }}>{error}</div>}

      {selectedGameId && gameStatus && (
        <>
          {/* ── 1. 턴 & 장 상태 카드 ── */}
          <div style={S.card}>
            <div style={S.rowBetween}>
              <span style={S.sectionTitle}>🏁 턴 & 장 상태</span>
              <span style={S.badge("#2563eb")}>현재 {gameStatus.currentTurn}턴</span>
            </div>

            {/* 장 상태 / 자동판매 - 2열 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px", border: "1px solid #f0f0f0" }}>
                <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 4 }}>현재 장 상태</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: gameStatus.isLocked ? "#dc2626" : "#059669", marginBottom: 8 }}>
                  {gameStatus.isLocked ? "🔴 마감" : "🟢 오픈"}
                </div>
                <button onClick={handleToggleLock} style={{ ...S.btnGray, width: "100%", fontSize: 11 }}>
                  상태 토글
                </button>
              </div>
              <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px", border: "1px solid #f0f0f0" }}>
                <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 4 }}>턴종료 자동판매</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: gameStatus.autoSellOnTurnEnd ? "#2563eb" : "#9ca3af", marginBottom: 8 }}>
                  {gameStatus.autoSellOnTurnEnd ? "✅ ON" : "⬜ OFF"}
                </div>
                <button onClick={handleToggleAutoSell} style={{ ...S.btnGray, width: "100%", fontSize: 11 }}>
                  기능 토글
                </button>
              </div>
            </div>

            <div style={S.divider} />
            <button
              onClick={handleNextTurn}
              style={{ ...S.btnBlock, background: "#dc2626", color: "#fff" }}
            >
              🔄 턴 마감 → 다음 턴 진행 (주가 자동 변동)
            </button>
          </div>

          {/* ── 2. 주식 종목 관리 카드 ── */}
          <div style={S.card}>
            <div style={S.sectionTitle}>📈 주식 종목 관리</div>

            {/* 신규 추가 폼 */}
            <form onSubmit={handleAddStock}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 60px", gap: 8, alignItems: "flex-end" }}>
                <div>
                  <label style={S.label}>종목명</label>
                  <input
                    type="text"
                    value={newStockName}
                    onChange={(e) => setNewStockName(e.target.value)}
                    placeholder="예: 삼성전자"
                    style={S.input}
                  />
                </div>
                <div>
                  <label style={S.label}>주가(원)</label>
                  <input
                    type="number"
                    value={newStockPrice}
                    onChange={(e) => setNewStockPrice(e.target.value)}
                    placeholder="10000"
                    style={S.input}
                  />
                </div>
                <button type="submit" style={{ ...S.btnPrimary, padding: "8px 0", width: "100%" }}>추가</button>
              </div>
            </form>

            <div style={S.divider} />

            {/* 종목 리스트 */}
            <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700, marginBottom: 8 }}>등록된 종목</div>
            {stocks.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: 12, textAlign: "center", padding: "16px 0" }}>등록된 주식이 없습니다.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {stocks.map((s) => {
                  const isExpanded = expandedStockId === s.id;
                  const priceDiff  = s.prevPrice ? s.currentPrice - s.prevPrice : null;
                  return (
                    <div key={s.id} style={{ background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                      {/* 요약 행 */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#111827", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {s.stockName}
                          </div>
                          <div style={{ ...S.row, gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#1f2937" }}>{s.currentPrice?.toLocaleString()}원</span>
                            {priceDiff !== null && (
                              <span style={{ fontSize: 11, color: priceDiff >= 0 ? "#dc2626" : "#2563eb", fontWeight: 600 }}>
                                ({priceDiff >= 0 ? "+" : ""}{priceDiff?.toLocaleString()}원)
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button
                            onClick={() => setExpandedStockId(isExpanded ? null : s.id)}
                            style={{ ...S.btnDark, fontSize: 11, padding: "6px 10px" }}
                          >
                            {isExpanded ? "닫기" : "수정"}
                          </button>
                          <button
                            onClick={() => handleDeleteStock(s.id, s.stockName)}
                            style={{ ...S.btnDanger, fontSize: 11, padding: "6px 10px" }}
                          >
                            삭제
                          </button>
                        </div>
                      </div>

                      {/* 수정 패널 (접었다 펼치기) */}
                      {isExpanded && (
                        <div style={{ borderTop: "1px solid #e5e7eb", padding: "12px", background: "#fff", display: "flex", flexDirection: "column", gap: 8 }}>
                          <div>
                            <label style={S.label}>종목명 변경</label>
                            <input
                              type="text"
                              value={editNameMap[s.id] ?? s.stockName}
                              onChange={(e) => setEditNameMap({ ...editNameMap, [s.id]: e.target.value })}
                              style={S.input}
                            />
                          </div>
                          <div>
                            <label style={S.label}>주가 강제 변경 (원)</label>
                            <input
                              type="number"
                              value={editPriceMap[s.id] ?? s.currentPrice}
                              onChange={(e) => setEditPriceMap({ ...editPriceMap, [s.id]: e.target.value })}
                              style={S.input}
                            />
                          </div>
                          <button
                            onClick={() => handleUpdateStock(s.id)}
                            style={{ ...S.btnSuccess, width: "100%", padding: "9px 0" }}
                          >
                            ✅ 수정 저장
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── 3. 속보 발송 카드 ── */}
          <div style={S.card}>
            <div style={S.sectionTitle}>📰 실시간 속보 발송</div>
            <form onSubmit={handleAddNews} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 8 }}>
                <div>
                  <label style={S.label}>노출 턴</label>
                  <input
                    type="number"
                    value={newNewsTurn}
                    onChange={(e) => setNewNewsTurn(e.target.value)}
                    style={{ ...S.input, textAlign: "center", fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={S.label}>속보 내용</label>
                  <input
                    type="text"
                    value={newNewsContent}
                    onChange={(e) => setNewNewsContent(e.target.value)}
                    placeholder="예: OO전자 해외 수주 잭팟!"
                    style={S.input}
                  />
                </div>
              </div>
              <button type="submit" style={{ ...S.btnBlock, background: "#111827", color: "#fff" }}>
                📡 속보 송출하기
              </button>
            </form>

            {/* 송출된 속보 내역 */}
            <div style={S.divider} />
            <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700, marginBottom: 8 }}>송출된 속보 내역</div>
            {news.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: 12, textAlign: "center", padding: "12px 0" }}>등록된 속보가 없습니다.</p>
            ) : (
              <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                {news.map((n) => (
                  <div key={n.id} style={{ background: "#f9fafb", borderRadius: 8, padding: "8px 12px", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={S.badge("#d97706")}>{n.turnNo}턴</span>
                    <span style={{ fontSize: 12, color: "#374151", flex: 1 }}>{n.content}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── 4. 유저 자산 현황 카드 ── */}
          <div style={S.card}>
            <div style={{ ...S.rowBetween, marginBottom: 12 }}>
              <span style={S.sectionTitle}>👥 유저 자산 현황</span>
              <button onClick={fetchUsers} style={{ ...S.btnPrimary, fontSize: 11, padding: "6px 12px" }}>
                현황 조회
              </button>
            </div>

            {showUsers && (
              users.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: 12, textAlign: "center", padding: "16px 0" }}>참가 중인 유저가 없습니다.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {users.map((u) => (
                    <div key={u.id} style={{ background: "#f9fafb", borderRadius: 12, border: "1px solid #e5e7eb", padding: "12px 14px" }}>
                      {/* 유저 기본 정보 */}
                      <div style={S.rowBetween}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: "#111827" }}>{u.userName}</span>
                        <span style={{ ...S.badge("#2563eb"), fontSize: 12 }}>총 {u.totalAssets?.toLocaleString()}원</span>
                      </div>

                      <div style={{ fontSize: 12, color: "#6b7280", margin: "8px 0" }}>
                        <div>💰 예수금: <strong>{u.cash?.toLocaleString()}원</strong></div>
                        <div style={{ marginTop: 4 }}>
                          📦 보유주식:{" "}
                          {u.holdings?.length === 0
                            ? <span style={{ color: "#9ca3af" }}>없음</span>
                            : u.holdings?.map((h, i) => (
                              <span key={h.stockId}>
                                {i > 0 && ", "}
                                {h.stockName} ({h.quantity}주, 평단 {h.averagePrice?.toLocaleString()}원)
                              </span>
                            ))
                          }
                        </div>
                      </div>

                      {/* 예수금 조정 */}
                      <div style={S.divider} />
                      <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700, marginBottom: 6 }}>예수금 조정 (양수=추가, 음수=차감)</div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <input
                          type="number"
                          placeholder="금액 입력"
                          value={adjustCashMap[u.id] || ""}
                          onChange={(e) => setAdjustCashMap({ ...adjustCashMap, [u.id]: e.target.value })}
                          style={{ ...S.inputSm, flex: 1, minWidth: 100 }}
                        />
                        <button onClick={() => handleAdjustCash(u.id, u.userName)} style={{ ...S.btnPrimary, fontSize: 11, padding: "7px 12px", flexShrink: 0 }}>
                          예수금 변경
                        </button>
                        <button onClick={() => handleDeleteUser(u.id, u.userName)} style={{ ...S.btnDanger, fontSize: 11, padding: "7px 12px", flexShrink: 0 }}>
                          유저 삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </>
      )}

      {selectedGameId && !gameStatus && (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontSize: 13 }}>
          게임 정보를 불러오는 중...
        </div>
      )}

      {!selectedGameId && (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontSize: 13 }}>
          위에서 관리할 게임을 선택해 주세요.
        </div>
      )}
    </div>
  );
}

export default StockAdmin;
