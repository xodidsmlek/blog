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
  const [tradeQty, setTradeQty] = useState(1);

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
    if (tradeQty <= 0) return alert("거래할 수량을 1주 이상 입력해 주세요.");
    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          stockId: selectedStock.id,
          type: tradeType,
          quantity: Number(tradeQty)
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
    setTradeQty(1);
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
    <div className="stock-container max-w-md mx-auto p-4 space-y-6">
      
      {/* 1. 게임방 대기 및 선택 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 rounded-2xl shadow-lg space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg">📈 모바일 주식 거래소</span>
          {selectedGameId && (
            <button
              onClick={handleManualRefresh}
              className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
            >
              🔄 시세 새로고침
            </button>
          )}
        </div>
        
        <div>
          <label className="block text-[11px] font-semibold text-blue-200 mb-1">참여할 주식 게임방 선택</label>
          <select
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
            className="w-full px-3 py-2 bg-white/10 text-white rounded-lg focus:outline-none border border-white/20 text-sm"
          >
            <option value="" className="text-gray-700">-- 주식게임방을 선택하세요 --</option>
            {games.map((g) => (
              <option key={g.id} value={g.id} className="text-gray-700">
                {g.gameName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-200">{error}</div>}

      {selectedGameId && (
        <div className="space-y-5">

          {/* 2. 장 정보 헤더 */}
          {gameStatus && (
            <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center text-xs">
              <span className="font-bold text-gray-700">현재 {gameStatus.currentTurn}턴 진행중</span>
              <span className={`font-semibold px-2.5 py-1 rounded-md ${
                gameStatus.isLocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
              }`}>
                {gameStatus.isLocked ? "장 마감 🚫" : "장 오픈 🟢"}
              </span>
            </div>
          )}

          {/* 3. 유저 로그인 / 참가 폼 */}
          {!userId ? (
            <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 space-y-4">
              <h3 className="text-base font-bold text-gray-800">🎮 주식게임 참가</h3>
              <p className="text-xs text-gray-400">참가할 유저명을 적고 입장하세요. 기본 1,000만 원 가상 예수금이 지급됩니다.</p>
              <form onSubmit={handleJoinGame} className="flex gap-2">
                <input
                  type="text"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder="닉네임 입력 (예: 버핏짱)"
                  maxLength={10}
                  className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition"
                >
                  가입/참가
                </button>
              </form>
            </div>
          ) : (
            /* 4. 내 포트폴리오 카드 */
            portfolio && (
              <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400">참가 닉네임</span>
                    <span className="font-bold text-gray-800 text-base">{userName}님</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-[10px] text-gray-400 hover:text-red-500 underline"
                  >
                    로그아웃 (방 나가기)
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-[10px] text-gray-400 block mb-0.5">총 평가 자산</span>
                    <span className="font-bold text-gray-900 text-sm">
                      {portfolio.totalAssets.toLocaleString()}원
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-[10px] text-gray-400 block mb-0.5">보유 예수금</span>
                    <span className="font-bold text-blue-600 text-sm">
                      {portfolio.cash.toLocaleString()}원
                    </span>
                  </div>
                </div>

                {/* 보유 주식 리스트 */}
                <div className="pt-2">
                  <span className="block text-[11px] font-bold text-gray-400 mb-2">내가 가진 주식 현황</span>
                  {portfolio.holdings.length === 0 ? (
                    <p className="text-gray-400 text-xs py-2 text-center">보유 주식이 없습니다.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {portfolio.holdings.map((h) => {
                        const returnPct = h.averagePrice > 0 ? Math.round(((h.currentPrice - h.averagePrice) / h.averagePrice) * 100) : 0;
                        return (
                          <div key={h.stockId} className="flex justify-between items-center text-xs p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                            <div>
                              <div className="font-bold text-gray-700">{h.stockName}</div>
                              <div className="text-[10px] text-gray-400">
                                {h.quantity}주 | 평단 {h.averagePrice.toLocaleString()}원
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-gray-800">
                                {h.evaluationAmount.toLocaleString()}원
                              </div>
                              <span className={`text-[10px] font-bold ${returnPct > 0 ? "text-red-500" : returnPct < 0 ? "text-blue-500" : "text-gray-400"}`}>
                                {returnPct > 0 ? `+${returnPct}%` : `${returnPct}%`}
                              </span>
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
          {news.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl shadow-sm text-xs space-y-2">
              <span className="font-bold text-amber-800 flex items-center gap-1">🚨 [턴 {gameStatus?.currentTurn} 뉴스 속보]</span>
              <div className="space-y-1.5 max-h-20 overflow-y-auto">
                {news.filter((n) => n.turnNo === gameStatus?.currentTurn).map((n) => (
                  <p key={n.id} className="text-amber-900 font-semibold leading-relaxed">
                    - {n.content}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 6. 주가 시세표 */}
          <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 space-y-3">
            <h3 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-2">📊 현재 주식 호가판</h3>
            {stocks.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-6">상장된 종목이 아직 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {stocks.map((s) => {
                  const change = calculateChange(s.currentPrice, s.prevPrice);
                  return (
                    <div key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs gap-3">
                      <div className="flex-1">
                        <div className="font-bold text-gray-800 text-sm">{s.stockName}</div>
                        <div className="text-[10px] text-gray-400">
                          이전가: {s.prevPrice ? `${s.prevPrice.toLocaleString()}원` : "없음"}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-gray-900">{s.currentPrice.toLocaleString()}원</div>
                        <div className={change.className}>{change.text}</div>
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => openTradeModal(s, "BUY")}
                          disabled={gameStatus?.isLocked}
                          className="bg-red-500 text-white font-bold px-3 py-2 rounded-lg text-[10px] hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                        >
                          매수
                        </button>
                        <button
                          onClick={() => openTradeModal(s, "SELL")}
                          disabled={gameStatus?.isLocked}
                          className="bg-blue-600 text-white font-bold px-3 py-2 rounded-lg text-[10px] hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-sm w-full rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="font-bold text-base text-gray-800">
                {selectedStock.stockName} {tradeType === "BUY" ? "매수" : "매도"}
              </span>
              <button
                onClick={() => setTradeModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="text-xs space-y-1.5 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-400">현재가</span>
                <span className="font-bold text-gray-800">{selectedStock.currentPrice.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">나의 예수금</span>
                <span className="font-bold text-blue-600">{(portfolio?.cash || 0).toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">보유량</span>
                <span className="font-bold text-gray-800">
                  {portfolio?.holdings.find(h => h.stockId === selectedStock.id)?.quantity || 0}주
                </span>
              </div>
            </div>

            {/* 수량 입력 */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">주문 수량(주)</label>
              <input
                type="number"
                min="1"
                value={tradeQty}
                onChange={(e) => setTradeQty(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center font-bold focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 예상 결제 금액 */}
            <div className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded-xl">
              <span className="font-semibold text-gray-600">예상 결제 금액</span>
              <span className={`font-bold ${tradeType === "BUY" ? "text-red-500" : "text-blue-600"}`}>
                {(selectedStock.currentPrice * tradeQty).toLocaleString()}원
              </span>
            </div>

            <button
              onClick={handleExecuteTrade}
              className={`w-full font-bold py-2.5 rounded-xl text-sm text-white transition ${
                tradeType === "BUY"
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {tradeType === "BUY" ? "매수하기" : "매도하기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockUser;
