import React, { useState, useEffect } from "react";

const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:4000"
  : "https://blog-nvf1.onrender.com";

function StockAdmin() {
  const [games, setGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [gameStatus, setGameStatus] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [news, setNews] = useState([]);
  const [users, setUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(false);

  // 입력 폼 상태
  const [newStockName, setNewStockName] = useState("");
  const [newStockPrice, setNewStockPrice] = useState("");
  const [editPriceMap, setEditPriceMap] = useState({}); // stockId -> price
  const [noticeText, setNoticeText] = useState("");
  const [newNewsTurn, setNewNewsTurn] = useState("");
  const [newNewsContent, setNewNewsContent] = useState("");

  const [error, setError] = useState("");

  // 오픈된 게임 목록 불러오기
  useEffect(() => {
    fetchOpenGames();
  }, []);

  const fetchOpenGames = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/games`);
      const data = await res.json();
      if (res.ok) {
        // Open: Y (is_open === true) 상태인 게임만 관리 가능
        const openGames = data.filter((g) => g.isOpen);
        setGames(openGames);
      }
    } catch (err) {
      setError("게임 리스트 로딩 실패");
    }
  };

  // 선택한 게임의 상세 정보(턴, 주식, 속보) 페치
  useEffect(() => {
    if (selectedGameId) {
      fetchGameDetails();
      setShowUsers(false); // 게임 변경 시 유저 리스트 가리기
      setUsers([]);
    } else {
      setGameStatus(null);
      setStocks([]);
      setNews([]);
    }
  }, [selectedGameId]);

  const fetchGameDetails = async () => {
    if (!selectedGameId) return;
    try {
      // 1) 상태 및 턴 정보
      const statusRes = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/status`);
      const statusData = await statusRes.json();
      if (statusRes.ok) {
        setGameStatus(statusData);
        setNewNewsTurn(statusData.currentTurn);
      }

      // 2) 주식 정보
      const stockRes = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/stocks`);
      const stockData = await stockRes.json();
      if (stockRes.ok) {
        setStocks(stockData);
        // 수동 수정 폼용 기본값 매핑
        const priceMap = {};
        stockData.forEach((s) => {
          priceMap[s.id] = s.currentPrice;
        });
        setEditPriceMap(priceMap);
      }

      // 3) 속보 정보
      const newsRes = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/news`);
      const newsData = await newsRes.json();
      if (newsRes.ok) {
        setNews(newsData);
      }
    } catch (err) {
      setError("상세 정보를 가져오는 데 실패했습니다.");
    }
  };

  // 장 오픈/잠금 토글
  const handleToggleLock = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/turn/toggle-lock`, {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchGameDetails();
      }
    } catch (err) {
      alert("서버 연결 에러");
    }
  };

  // 자동 판매 활성화 여부 토글
  const handleToggleAutoSell = async (currentAutoSell) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/turn/toggle-auto-sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoSell: !currentAutoSell })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchGameDetails();
      }
    } catch (err) {
      alert("서버 연결 에러");
    }
  };

  // 턴 마감 (다음 턴 진행)
  const handleNextTurn = async () => {
    if (!window.confirm("정말 현재 턴을 마감하고 다음 턴으로 넘어가시겠습니까?\n이때 주가 변동 및 설정에 따라 주식 자동판매가 진행됩니다.")) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/turn/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notice: noticeText })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setNoticeText("");
        fetchGameDetails();
        // 유저 정보도 만약 열려있다면 새로고침
        if (showUsers) {
          fetchUsers();
        }
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("서버 연결 에러");
    }
  };

  // 주식 추가
  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!newStockName.trim() || !newStockPrice) return alert("종목명과 주가를 입력하세요.");

    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/stocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockName: newStockName, price: newStockPrice })
      });
      if (res.ok) {
        setNewStockName("");
        setNewStockPrice("");
        fetchGameDetails();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      alert("주식 추가 에러");
    }
  };

  // 주가 수동 강제 변경
  const handleUpdateStockPrice = async (stockId) => {
    const editPrice = editPriceMap[stockId];
    if (editPrice === undefined || editPrice === "") return alert("수정할 주가를 입력해 주세요.");

    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/stocks/${stockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: Number(editPrice) })
      });
      if (res.ok) {
        alert("주가가 성공적으로 수정되었습니다.");
        fetchGameDetails();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      alert("주식 수정 에러");
    }
  };

  // 주식 삭제
  const handleDeleteStock = async (stockId) => {
    if (!window.confirm("정말 이 주식 종목을 삭제하시겠습니까?\n유저가 보유한 해당 주식 데이터도 모두 파기됩니다.")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/stocks/${stockId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchGameDetails();
      }
    } catch (err) {
      alert("주식 삭제 에러");
    }
  };

  // 속보 추가
  const handleAddNews = async (e) => {
    e.preventDefault();
    if (!newNewsTurn || !newNewsContent.trim()) return alert("턴 번호와 속보 내용을 입력하세요.");

    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/news`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnNo: Number(newNewsTurn), content: newNewsContent })
      });
      if (res.ok) {
        setNewNewsContent("");
        fetchGameDetails();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      alert("속보 등록 실패");
    }
  };

  // 유저 목록 조회 (조회 버튼 클릭 시에만 로드)
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${selectedGameId}/users`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
        setShowUsers(true);
      } else {
        alert(data.error || "유저 목록 로딩 실패");
      }
    } catch (err) {
      alert("서버 연결 실패");
    }
  };

  return (
    <div className="stock-container max-w-md mx-auto p-4 space-y-6">
      <div className="bg-gray-800 text-white p-4 rounded-xl shadow-md">
        <h2 className="font-bold text-lg text-center mb-4">👑 주식게임 매니저 콘솔</h2>
        
        {/* 게임 선택 셀렉트 */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">관리할 게임 선택 (오픈 상태인 게임만 노출)</label>
          <select
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none border border-gray-600 text-sm"
          >
            <option value="">-- 관리할 게임을 선택하세요 --</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.gameName} (ID: {g.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-200">{error}</div>}

      {/* 게임 상태 및 제어 판넬 */}
      {selectedGameId && gameStatus && (
        <div className="space-y-6">
          
          {/* 1. 턴 및 상태 관리 카드 */}
          <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="text-base font-bold text-gray-800">🏁 턴 및 장 상태</span>
              <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-1 rounded-md">
                현재 턴: {gameStatus.currentTurn}턴
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col justify-between">
                <span className="text-gray-400 font-medium mb-1">현재 장 상태</span>
                <span className={`font-bold text-sm ${gameStatus.isLocked ? "text-red-500" : "text-green-500"}`}>
                  {gameStatus.isLocked ? "마감 (잠김)" : "오픈 (거래가능)"}
                </span>
                <button
                  onClick={handleToggleLock}
                  className="mt-2 text-[10px] bg-gray-200 hover:bg-gray-300 font-bold py-1.5 rounded-md transition"
                >
                  상태 토글
                </button>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col justify-between">
                <span className="text-gray-400 font-medium mb-1">턴 종료 자동판매</span>
                <span className={`font-bold text-sm ${gameStatus.autoSellOnTurnEnd ? "text-blue-600" : "text-gray-500"}`}>
                  {gameStatus.autoSellOnTurnEnd ? "활성화(ON)" : "비활성화(OFF)"}
                </span>
                <button
                  onClick={() => handleToggleAutoSell(gameStatus.autoSellOnTurnEnd)}
                  className="mt-2 text-[10px] bg-gray-200 hover:bg-gray-300 font-bold py-1.5 rounded-md transition"
                >
                  기능 토글
                </button>
              </div>
            </div>

            {/* 다음 턴 진행 폼 */}
            <div className="border-t border-gray-100 pt-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">새 공지사항 (턴이 넘어갈 때 유저화면에 노출됨)</label>
                <input
                  type="text"
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                  placeholder="예: 금리 인상 발표 예정, 관련주 변동폭 확대"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleNextTurn}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg text-xs transition"
              >
                턴 마감 ➔ 다음 턴 진행 (주가 자동 변동)
              </button>
            </div>
          </div>

          {/* 2. 주식 종목 제어 카드 */}
          <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 space-y-4">
            <h3 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3">📈 주식 종목 관리</h3>

            {/* 신규 주식 등록 폼 */}
            <form onSubmit={handleAddStock} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-[10px] text-gray-400 mb-1">주식명</label>
                <input
                  type="text"
                  value={newStockName}
                  onChange={(e) => setNewStockName(e.target.value)}
                  placeholder="예: 삼성전자"
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                />
              </div>
              <div className="w-24">
                <label className="block text-[10px] text-gray-400 mb-1">주가 (원)</label>
                <input
                  type="number"
                  value={newStockPrice}
                  onChange={(e) => setNewStockPrice(e.target.value)}
                  placeholder="10000"
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white font-bold px-3.5 py-2.5 rounded-lg text-xs hover:bg-blue-700 transition"
              >
                추가
              </button>
            </form>

            {/* 주식 리스트 및 수동 조작 */}
            <div className="space-y-3 pt-2">
              <span className="block text-[11px] font-semibold text-gray-400">등록된 종목 및 가격 강제 변경</span>
              {stocks.length === 0 ? (
                <p className="text-gray-400 text-xs text-center py-4">등록된 주식이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {stocks.map((s) => (
                    <div key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs gap-2">
                      <div className="flex flex-col flex-1">
                        <span className="font-bold text-gray-700">{s.stockName}</span>
                        <span className="text-[10px] text-gray-400">
                          이전: {s.prevPrice ? `${s.prevPrice.toLocaleString()}원` : "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={editPriceMap[s.id] || ""}
                          onChange={(e) => setEditPriceMap({ ...editPriceMap, [s.id]: e.target.value })}
                          className="w-16 px-1.5 py-1 border border-gray-200 rounded-md text-center text-xs font-semibold"
                        />
                        <button
                          onClick={() => handleUpdateStockPrice(s.id)}
                          className="bg-gray-800 text-white px-2 py-1 rounded-md text-[10px] hover:bg-gray-700"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteStock(s.id)}
                          className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-2 py-1 rounded-md text-[10px] transition"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. 속보 등록 카드 */}
          <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 space-y-4">
            <h3 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3">📰 실시간 속보 발송</h3>
            <form onSubmit={handleAddNews} className="space-y-3">
              <div className="flex gap-2">
                <div className="w-20">
                  <label className="block text-[10px] text-gray-400 mb-1">노출 턴</label>
                  <input
                    type="number"
                    value={newNewsTurn}
                    onChange={(e) => setNewNewsTurn(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-center font-bold"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] text-gray-400 mb-1">속보 내용</label>
                  <input
                    type="text"
                    value={newNewsContent}
                    onChange={(e) => setNewNewsContent(e.target.value)}
                    placeholder="예: OO전자 해외 수주 잭팟! 다음 턴 상승 예고"
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-gray-900 text-white font-bold py-2 rounded-lg text-xs hover:bg-gray-800 transition"
              >
                속보 송출하기
              </button>
            </form>

            {/* 송출 완료된 속보 리스트 */}
            <div className="pt-2 max-h-36 overflow-y-auto space-y-1.5">
              <span className="block text-[11px] font-semibold text-gray-400">송출된 속보 내역</span>
              {news.length === 0 ? (
                <p className="text-gray-400 text-xs text-center py-2">등록된 속보가 없습니다.</p>
              ) : (
                news.map((n) => (
                  <div key={n.id} className="text-xs p-2 bg-gray-50 rounded-lg border border-gray-100 flex justify-between">
                    <span className="text-gray-600 font-medium">[턴 {n.turnNo}] {n.content}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 4. 유저 자산 현황 조회 (클릭 시에만 노출) */}
          <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-800">👥 유저 자산 정보</h3>
              <button
                onClick={fetchUsers}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition"
              >
                참가 유저 현황 조회
              </button>
            </div>

            {showUsers && (
              <div className="space-y-4">
                {users.length === 0 ? (
                  <p className="text-gray-400 text-xs text-center py-6">참가 중인 유저가 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {users.map((u) => (
                      <div key={u.id} className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-800 text-sm">{u.userName}</span>
                          <span className="font-bold text-blue-600">
                            총 자산: {u.totalAssets.toLocaleString()}원
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 space-y-1">
                          <div>예수금: {u.cash.toLocaleString()}원</div>
                          <div>
                            보유주식:{" "}
                            {u.holdings.length === 0 ? (
                              <span className="text-gray-400">없음</span>
                            ) : (
                              u.holdings.map((h, i) => (
                                <span key={h.stockId}>
                                  {i > 0 && ", "}
                                  {h.stockName} ({h.quantity}주, 평단: {h.averagePrice.toLocaleString()}원)
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default StockAdmin;
