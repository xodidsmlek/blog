import React, { useState, useEffect } from "react";

// 🔴 비밀번호 설정 주석
// 관리자 비밀번호: "turnstockadmin123"
const ADMIN_PASSWORD = "turnstockadmin123";

const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:4000"
  : "https://blog-nvf1.onrender.com";

function StockGameManager() {
  const [screenPw, setScreenPw] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [serverPw, setServerPw] = useState("");
  const [games, setGames] = useState([]);
  const [newGameName, setNewGameName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isAuthorized) {
      fetchGames();
    }
  }, [isAuthorized]);

  // 화면 암호 체크
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

  // 게임 목록 조회
  const fetchGames = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/games`);
      const data = await res.json();
      if (res.ok) {
        setGames(data);
      } else {
        setError(data.error || "게임 목록을 불러오지 못했습니다.");
      }
    } catch (err) {
      setError("서버와의 통신이 원활하지 않습니다.");
    }
  };

  // 게임 추가
  const handleCreateGame = async (e) => {
    e.preventDefault();
    if (!newGameName.trim()) return setError("게임명을 입력해주세요.");
    if (!serverPw) return setError("서버 비밀번호를 입력해주세요.");

    try {
      const res = await fetch(`${API_BASE_URL}/api/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameName: newGameName, server_pw: serverPw })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("새로운 게임이 성공적으로 생성되었습니다.");
        setNewGameName("");
        setError("");
        fetchGames();
      } else {
        setError(data.error || "게임 생성 실패");
      }
    } catch (err) {
      setError("서버 통신 실패");
    }
  };

  // 게임 오픈 토글
  const handleToggleOpen = async (gameId, currentOpen) => {
    if (!serverPw) {
      alert("서버 비밀번호를 먼저 입력해주세요.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${gameId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: !currentOpen, server_pw: serverPw })
      });
      const data = await res.json();
      if (res.ok) {
        fetchGames();
        alert(data.message);
      } else {
        alert(data.error || "상태 변경 실패");
      }
    } catch (err) {
      alert("서버 통신 실패");
    }
  };

  // 게임 삭제
  const handleDeleteGame = async (gameId) => {
    if (!serverPw) {
      alert("서버 비밀번호를 입력해 주세요.");
      return;
    }
    if (!window.confirm("정말 이 게임과 모든 데이터를 영구 삭제하시겠습니까?")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${gameId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ server_pw: serverPw })
      });
      const data = await res.json();
      if (res.ok) {
        fetchGames();
        alert("게임이 삭제되었습니다.");
      } else {
        alert(data.error || "게임 삭제 실패");
      }
    } catch (err) {
      alert("서버 통신 실패");
    }
  };

  // 1차 인증 전 비밀번호 입력 화면
  if (!isAuthorized) {
    return (
      <div className="stock-pw-screen">
        <div className="card shadow-lg p-6 max-w-sm w-full mx-auto mt-12 bg-white rounded-2xl">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">⚙️ Game Manager</h2>
          <form onSubmit={handleAuthorize} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">화면 비밀번호 입력</label>
              <input
                type="password"
                value={screenPw}
                onChange={(e) => setScreenPw(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition duration-200"
            >
              화면 활성화
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="stock-container max-w-md mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center bg-gray-800 text-white p-4 rounded-xl shadow-md">
        <span className="font-bold text-lg">⚙️ Game Manager Console</span>
        <button
          onClick={() => setIsAuthorized(false)}
          className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-md"
        >
          잠금
        </button>
      </div>



      {/* 새 게임 생성 */}
      <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
        <h3 className="text-base font-bold text-gray-800 mb-4">🆕 새 주식게임 생성</h3>
        <form onSubmit={handleCreateGame} className="space-y-4">
          <div>
            <input
              type="text"
              value={newGameName}
              onChange={(e) => setNewGameName(e.target.value)}
              placeholder="주식게임명 (예: 주식동호회 A방)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          {message && <p className="text-green-600 text-xs">{message}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition"
          >
            게임방 개설하기
          </button>
        </form>
      </div>

      {/* 개설된 게임 목록 */}
      <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
        <h3 className="text-base font-bold text-gray-800 mb-4">📋 개설된 게임 리스트 ({games.length})</h3>
        {games.length === 0 ? (
          <p className="text-gray-400 text-xs text-center py-6">개설된 게임이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {games.map((g) => (
              <div key={g.id} className="flex justify-between items-center p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex flex-col">
                  <span className="font-bold text-gray-700 text-sm">{g.gameName}</span>
                  <span className="text-[10px] text-gray-400">ID: {g.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleOpen(g.id, g.isOpen)}
                    className={`text-xs px-3 py-1.5 rounded-md font-semibold ${
                      g.isOpen
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                  >
                    {g.isOpen ? "Open: Y" : "Open: N"}
                  </button>
                  <button
                    onClick={() => handleDeleteGame(g.id)}
                    className="text-xs bg-gray-200 text-gray-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md transition"
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
  );
}

export default StockGameManager;
