import React, { useState, useEffect } from "react";

const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:4000"
  : "https://blog-nvf1.onrender.com";

function StockUser() {
  const [games, setGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [gameStatus, setGameStatus] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [news, setNews] = useState([]);
  
  // 로그인 및 포트폴리오 유저 데이터
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [portfolio, setPortfolio] = useState(null);
  
  // 가입 폼 상태
  const [joinName, setJoinName] = useState("");
  
  // 거래 모달 상태
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [tradeType, setTradeType] = useState("BUY"); // BUY or SELL
  const [tradeQty, setTradeQty] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 오픈된 게임방 로드
  useEffect(() => {
    fetchOpenGames();
  }, []);

  const fetchOpenGames = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/games`);
      const data = await res.json();
      if (res.ok) {
        // Open: Y (is_open === true) 상태인 게임만 노출
        const openGames = data.filter((g) => g.isOpen);
        setGames(openGames);
      }
    } catch (err) {
      setError("게임방 목록을 불러오지 못했습니다.");
    }
  };

  // 게임방 선택 변경 시 유저 세션 복구 및 기본 데이터 로드
  useEffect(() => {
    if (selectedGameId) {
      setError("");
      const savedUserId = localStorage.getItem(`stock_uid_${selectedGameId}`);
      const savedUserName = localStorage.getItem(`stock_uname_${selectedGameId}`);
      
      if (savedUserId && savedUserName) {
        setUserId(savedUserId);
        setUserName(savedUserName);
        // 사용자 데이터가 존재하면 관련 시세 및 포트폴리오를 새로고침함
        refreshData(savedUserId);
      } else {
        setUserId("");
        setUserName("");
        setPortfolio(null);
        // 비회원이어도 기본적인 시세판은 볼 수 있도록 로드
        refreshData("");
      }
    } else {
      setGameStatus(null);
      setStocks([]);
      setNews([]);
      setPortfolio(null);
      setUserId("");
    }
  }, [selectedGameId]);

  // 통합 시세 새로고침 함수 (사용자가 🔄 버튼을 누르거나 액션 성공 시 수동 호출)
  const handleManualRefresh = () => {
    if (!selectedGameId) return;
    refreshData(userId);
    alert("시세 및 자산 정보가 새로고침되었습니다.");
  };

  const refreshData = async (targetUserId = userId) => {
    if (!selectedGameId) return;
    setLoading(true);
    try {
      // 1) 턴 정보 및 장 오픈 상태
      const statusRes = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/status`);
      const statusData = await statusRes.json();
      if (statusRes.ok) {
        setGameStatus(statusData);
      }

      // 2) 주가 시세표
      const stockRes = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/stocks`);
      const stockData = await stockRes.json();
      if (stockRes.ok) {
        setStocks(stockData);
      }

      // 3) 속보 리스트
      const newsRes = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/news`);
      const newsData = await newsRes.json();
      if (newsRes.ok) {
        setNews(newsData);
      }

      // 4) 유저 포트폴리오 (로그인한 경우에만)
      if (targetUserId) {
        const portRes = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/users/${targetUserId}/portfolio`);
        const portData = await portRes.json();
        if (portRes.ok) {
          setPortfolio(portData);
        } else {
          // 서버 측에서 유저가 유실되었거나 삭제된 경우 로그아웃 처리
          handleLogout();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(`stock_uid_${selectedGameId}`);
    localStorage.removeItem(`stock_uname_${selectedGameId}`);
    setUserId("");
    setUserName("");
    setPortfolio(null);
  };

  // 게임방 회원가입 (참가)
  const handleJoinGame = async (e) => {
    e.preventDefault();
    if (!joinName.trim()) return alert("유저명을 입력하세요.");

    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/users/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: joinName })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem(`stock_uid_${selectedGameId}`, data.id);
        localStorage.setItem(`stock_uname_${selectedGameId}`, data.userName);
        setUserId(data.id);
        setUserName(data.userName);
        setJoinName("");
        refreshData(data.id);
      } else {
        alert(data.error || "가입 오류");
      }
    } catch (err) {
      alert("서버 연결 실패");
    }
  };

  // 거래 실행 (매수/매도)
  const handleExecuteTrade = async () => {
    const qty = Number(tradeQty);
    if (!qty || qty <= 0) return alert("거래할 수량을 1주 이상 입력해 주세요.");
    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          stockId: selectedStock.id,
          type: tradeType,
          quantity: qty
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setTradeModalOpen(false);
        refreshData(userId); // 내 자산 갱신
      } else {
        alert(data.error || "거래 실패");
      }
    } catch (err) {
      alert("서버 통신 실패");
    }
  };

  // 거래창(모달) 오픈
  const openTradeModal = (stock, type) => {
    if (!userId) {
      alert("로그인(게임 가입) 후 거래를 하실 수 있습니다.");
      return;
    }
    if (gameStatus?.isLocked) {
      alert("장이 마감되어 거래할 수 없습니다.");
      return;
    }
    setSelectedStock(stock);
    setTradeType(type);
    setTradeQty("");
    setTradeModalOpen(true);
  };

  // 등락폭 백분율 계산 함수
  const calculateChange = (current, prev) => {
    if (!prev) return { text: "-", className: "text-gray-400" };
    const pct = ((current - prev) / prev) * 100;
    const rounded = (pct > 0 ? Math.floor(pct) : Math.ceil(pct));
    if (rounded > 0) return { text: `▲${rounded}%`, className: "text-red-500 font-bold" };
    if (rounded < 0) return { text: `▼${Math.abs(rounded)}%`, className: "text-blue-500 font-bold" };
    return { text: "0%", className: "text-gray-500" };
  };

  return (
    <div style={{ padding: "12px", maxWidth: "100%", boxSizing: "border-box", fontFamily: "sans-serif" }}>
      
      {/* 1. 게임방 대기 및 선택 헤더 */}
      <div style={{ background: "linear-gradient(135deg, #2563eb, #4338ca)", color: "#fff", padding: "16px", borderRadius: 14, marginBottom: 14, boxShadow: "0 2px 10px rgba(37,99,235,.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>📈 모바일 주식 거래소</span>
          {selectedGameId && (
            <button
              onClick={handleManualRefresh}
              style={{ background: "rgba(255,255,255,.2)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
            >
              🔄 시세 새로고침
            </button>
          )}
        </div>
        <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,.7)", marginBottom: 4, fontWeight: 600 }}>참여할 주식 게임방 선택</label>
        <select
          value={selectedGameId}
          onChange={(e) => setSelectedGameId(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, fontSize: 13, outline: "none" }}
        >
          <option value="" style={{ color: "#333" }}>-- 주식게임방을 선택하세요 --</option>
          {games.map((g) => (
            <option key={g.id} value={g.id} style={{ color: "#333" }}>{g.gameName}</option>
          ))}
        </select>
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: 10, fontSize: 12, marginBottom: 10 }}>{error}</div>}

      {selectedGameId && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* 2. 장 정보 헤더 */}
          {gameStatus && (
            <div style={{ background: "#fff", borderRadius: 10, padding: "10px 14px", border: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
              <span style={{ fontWeight: 700, color: "#374151" }}>현재 {gameStatus.currentTurn}턴 진행중</span>
              <span style={{ fontWeight: 700, padding: "4px 10px", borderRadius: 6, background: gameStatus.isLocked ? "#fee2e2" : "#dcfce7", color: gameStatus.isLocked ? "#dc2626" : "#15803d" }}>
                {gameStatus.isLocked ? "장 마감 🚫" : "장 오픈 🟢"}
              </span>
            </div>
          )}

          {/* 3. 유저 로그인 / 참가 폼 */}
          {!userId ? (
            <div style={{ background: "#fff", borderRadius: 14, padding: "16px", border: "1px solid #e5e7eb" }}>
              <h3 style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>🎮 주식게임 참가</h3>
              <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>참가할 유저명을 적고 입장하세요. 기본 1,000만 원 가상 예수금이 지급됩니다.</p>
              <form onSubmit={handleJoinGame} style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder="닉네임 입력 (예: 버핏짱)"
                  maxLength={10}
                  style={{ flex: 1, minWidth: 0, boxSizing: "border-box", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, outline: "none" }}
                />
                <button
                  type="submit"
                  style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
                >
                  가입/참가
                </button>
              </form>
            </div>
          ) : (
            /* 4. 내 포트폴리오 카드 */
            portfolio && (
              <div style={{ background: "#fff", borderRadius: 14, padding: "16px", border: "1px solid #e5e7eb" }}>
                <div style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>참가 닉네임</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#111827" }}>{userName}님</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  <div style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>총 평가 자산</div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "#111827" }}>{portfolio.totalAssets.toLocaleString()}원</div>
                  </div>
                  <div style={{ background: "#eff6ff", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>보유 예수금</div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "#2563eb" }}>{portfolio.cash.toLocaleString()}원</div>
                  </div>
                </div>

                {/* 보유 주식 리스트 */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 6 }}>내가 가진 주식 현황</div>
                  {portfolio.holdings.length === 0 ? (
                    <p style={{ color: "#9ca3af", fontSize: 12, textAlign: "center", padding: "8px 0" }}>보유 주식이 없습니다.</p>
                  ) : (
                    <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                      {portfolio.holdings.map((h) => {
                        const returnPct = h.averagePrice > 0 ? Math.round(((h.currentPrice - h.averagePrice) / h.averagePrice) * 100) : 0;
                        return (
                          <div key={h.stockId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}>
                            <div>
                              <div style={{ fontWeight: 700, color: "#374151" }}>{h.stockName}</div>
                              <div style={{ fontSize: 10, color: "#9ca3af" }}>{h.quantity}주 | 평단 {h.averagePrice.toLocaleString()}원</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontWeight: 700, color: "#111827" }}>{h.evaluationAmount.toLocaleString()}원</div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: returnPct > 0 ? "#dc2626" : returnPct < 0 ? "#2563eb" : "#9ca3af" }}>
                                {returnPct > 0 ? `+${returnPct}%` : `${returnPct}%`}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {/* 5. 실시간 속보 뉴스 카드 */}
          {news.filter((n) => n.turnNo === gameStatus?.currentTurn).length > 0 && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontWeight: 800, fontSize: 12, color: "#92400e", marginBottom: 6 }}>🚨 [{gameStatus?.currentTurn}턴 뉴스 속보]</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 80, overflowY: "auto" }}>
                {news.filter((n) => n.turnNo === gameStatus?.currentTurn).map((n) => (
                  <p key={n.id} style={{ fontSize: 12, color: "#78350f", fontWeight: 600, margin: 0 }}>- {n.content}</p>
                ))}
              </div>
            </div>
          )}

          {/* 6. 주가 시세표 */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "14px", border: "1px solid #e5e7eb" }}>
            <h3 style={{ fontWeight: 800, fontSize: 14, color: "#111827", marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>📊 현재 주식 호가판</h3>
            {stocks.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: 12, textAlign: "center", padding: "24px 0" }}>상장된 종목이 아직 없습니다.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {stocks.map((s) => {
                  const change = calculateChange(s.currentPrice, s.prevPrice);
                  return (
                    <div key={s.id} style={{ background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb", padding: "10px 12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: "#111827" }}>{s.stockName}</div>
                          <div style={{ fontSize: 10, color: "#9ca3af" }}>이전가: {s.prevPrice ? `${s.prevPrice.toLocaleString()}원` : "없음"}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: "#111827" }}>{s.currentPrice.toLocaleString()}원</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: change.className.includes("red") ? "#dc2626" : change.className.includes("blue") ? "#2563eb" : "#9ca3af" }}>{change.text}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => openTradeModal(s, "BUY")}
                          disabled={gameStatus?.isLocked}
                          style={{ flex: 1, background: gameStatus?.isLocked ? "#e5e7eb" : "#ef4444", color: gameStatus?.isLocked ? "#9ca3af" : "#fff", border: "none", borderRadius: 8, padding: "9px", fontSize: 13, fontWeight: 800, cursor: gameStatus?.isLocked ? "not-allowed" : "pointer" }}
                        >
                          매수
                        </button>
                        <button
                          onClick={() => openTradeModal(s, "SELL")}
                          disabled={gameStatus?.isLocked}
                          style={{ flex: 1, background: gameStatus?.isLocked ? "#e5e7eb" : "#2563eb", color: gameStatus?.isLocked ? "#9ca3af" : "#fff", border: "none", borderRadius: 8, padding: "9px", fontSize: 13, fontWeight: 800, cursor: gameStatus?.isLocked ? "not-allowed" : "pointer" }}
                        >
                          매도
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* 7. 거래 팝업 모달 */}
      {tradeModalOpen && selectedStock && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, width: "100%", maxWidth: 360, boxSizing: "border-box", boxShadow: "0 8px 32px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f3f4f6", paddingBottom: 10, marginBottom: 14 }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: "#111827" }}>
                {selectedStock.stockName} {tradeType === "BUY" ? "매수" : "매도"}
              </span>
              <button onClick={() => setTradeModalOpen(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>×</button>
            </div>

            <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px", marginBottom: 12, display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#9ca3af" }}>현재가</span>
                <span style={{ fontWeight: 700, color: "#111827" }}>{selectedStock.currentPrice.toLocaleString()}원</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#9ca3af" }}>나의 예수금</span>
                <span style={{ fontWeight: 700, color: "#2563eb" }}>{(portfolio?.cash || 0).toLocaleString()}원</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#9ca3af" }}>보유량</span>
                <span style={{ fontWeight: 700, color: "#111827" }}>
                  {portfolio?.holdings.find(h => h.stockId === selectedStock.id)?.quantity || 0}주
                </span>
              </div>
            </div>

            {/* 수량 입력 */}
            {(() => {
              const holdingQty = portfolio?.holdings.find(h => h.stockId === selectedStock.id)?.quantity || 0;
              const maxBuy = selectedStock.currentPrice > 0 ? Math.floor((portfolio?.cash || 0) / selectedStock.currentPrice) : 0;
              const maxQty = tradeType === "BUY" ? maxBuy : holdingQty;
              const parsedQty = Number(tradeQty) || 0;
              return (
                <>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>주문 수량(주)</label>
                      <span style={{ fontSize: 11, color: "#6b7280" }}>최대 <strong style={{ color: tradeType === "BUY" ? "#dc2626" : "#2563eb" }}>{maxQty.toLocaleString()}주</strong></span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="number"
                        min="1"
                        max={maxQty}
                        value={tradeQty}
                        onChange={(e) => setTradeQty(e.target.value)}
                        placeholder="수량 입력"
                        style={{ flex: 1, boxSizing: "border-box", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 15, textAlign: "center", fontWeight: 800, outline: "none" }}
                      />
                      <button
                        onClick={() => setTradeQty(String(maxQty))}
                        style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, color: "#374151", cursor: "pointer", flexShrink: 0 }}
                      >
                        최대
                      </button>
                    </div>
                  </div>

                  {/* 예상 결제 금액 */}
                  <div style={{ display: "flex", justifyContent: "space-between", background: "#f9fafb", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
                    <span style={{ fontWeight: 600, color: "#6b7280" }}>예상 결제 금액</span>
                    <span style={{ fontWeight: 800, color: tradeType === "BUY" ? "#dc2626" : "#2563eb" }}>
                      {(selectedStock.currentPrice * parsedQty).toLocaleString()}원
                    </span>
                  </div>
                  {/* 매수/매도 버튼 */}
                  <button
                    onClick={handleExecuteTrade}
                    style={{ width: "100%", background: tradeType === "BUY" ? "#ef4444" : "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 800, cursor: "pointer" }}
                  >
                    {tradeType === "BUY" ? "매수하기" : "매도하기"}
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default StockUser;
