import React, { useEffect, useState } from "react";
import "./assets/styles/App.css";
import Main from "./components/Main";


function App() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState('rhythm'); // Default to rhythm game
  const [onSidebar, setOnSidebar] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    console.log("Fetching team list...");
    fetch("https://blog-nvf1.onrender.com/team_list")
      // fetch("http://localhost:4000/team_list")
      .then((res) => res.json())
      .then(setPosts);

    // URL query parameter ?admin=true 체크
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "true") {
      setIsAdmin(true);
      localStorage.setItem("show_admin_menu", "true");
    } else if (localStorage.getItem("show_admin_menu") === "true") {
      setIsAdmin(true);
    }
  }, []);

  const handleBrandDoubleClick = () => {
    const pw = prompt("관리자 비밀키를 입력하세요:");
    if (pw === "turnstockadmin123") {
      setIsAdmin((prev) => {
        const next = !prev;
        localStorage.setItem("show_admin_menu", next ? "true" : "false");
        alert(next ? "⚙️ 관리자 메뉴가 활성화되었습니다." : "⚙️ 관리자 메뉴가 비활성화(숨김)되었습니다.");
        return next;
      });
    } else {
      alert("비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <div className="app-container">
      {onSidebar === 'on' && (
        <div className="sidebar-backdrop" onClick={() => setOnSidebar('')}></div>
      )}

      <aside className={`sidebar ${onSidebar}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">GAME PORTAL</span>
          <button className="sidebar-close-btn" onClick={() => setOnSidebar('')}>&times;</button>
        </div>
        <div className="sidebar-menu-list">
          <div className={`side_menu ${selectedPost === 'teamUpdate' ? 'active' : ''}`} onClick={() => { setSelectedPost('teamUpdate'); setOnSidebar(''); }}>조원 수정</div>
          <div className={`side_menu ${selectedPost === 'rhythm' ? 'active' : ''}`} onClick={() => { setSelectedPost('rhythm'); setOnSidebar(''); }}>8박자 리듬게임</div>
          <div className={`side_menu ${selectedPost === 'fourWord' ? 'active' : ''}`} onClick={() => { setSelectedPost('fourWord'); setOnSidebar(''); }}>4글자 게임</div>
          <div className={`side_menu ${selectedPost === 'absolutePitch' ? 'active' : ''}`} onClick={() => { setSelectedPost('absolutePitch'); setOnSidebar(''); }}>절대음감 / 청개구리 절대음감</div>
          <div className={`side_menu ${selectedPost === 'picture' ? 'active' : ''}`} onClick={() => { setSelectedPost('picture'); setOnSidebar(''); }}>이구동성 그림그리기</div>
          
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", margin: "12px 0" }}></div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", padding: "0 16px 6px 16px", textTransform: "uppercase", fontWeight: "bold", letterSpacing: "0.5px" }}>주식 게임</div>
          
          <div className={`side_menu ${selectedPost === 'stockUser' ? 'active' : ''}`} onClick={() => { setSelectedPost('stockUser'); setOnSidebar(''); }}>📈 주식게임 유저 화면</div>
          {isAdmin && (
            <>
              <div className={`side_menu ${selectedPost === 'stockAdmin' ? 'active' : ''}`} onClick={() => { setSelectedPost('stockAdmin'); setOnSidebar(''); }}>👑 주식게임 매니저 화면</div>
              <div className={`side_menu ${selectedPost === 'stockGameManager' ? 'active' : ''}`} onClick={() => { setSelectedPost('stockGameManager'); setOnSidebar(''); }}>⚙️ 게임 마스터 (게임관리)</div>
            </>
          )}
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <button className="menu-toggle-btn" onClick={() => setOnSidebar('on')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
            <span>Menu</span>
          </button>
          <div className="app-brand" onDoubleClick={handleBrandDoubleClick} style={{ cursor: "pointer", userSelect: "none" }}>GAMES</div>
        </header>
        <div className="content-body">
          <Main menu={selectedPost} />
        </div>
      </main>
    </div>
  );
}

export default App;
