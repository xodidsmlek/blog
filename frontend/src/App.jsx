import React, { useEffect, useState } from "react";
import "./assets/styles/App.css";
import Main from "./components/Main";


function App() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(''); // 선택된 포스트 상태
  const [onSidebar, setOnSidebar] = useState('');

  useEffect(() => {
    console.log("Fetching team list...");
    fetch("https://blog-nvf1.onrender.com/team_list")
    // fetch("http://localhost:4000/team_list")
      .then((res) => res.json())
      .then(setPosts);
  }, []);

  return (
    <div className="app-container">
      <aside className={`sidebar ${onSidebar}`}>
        <div className="btn_box"><button className="btn" onClick={()=>setOnSidebar('')}>X</button></div>
        <div className="side_menu" onClick={()=>setSelectedPost('teamUpdate')}>조원 수정</div>
        <div className="side_menu" onClick={()=>setSelectedPost('rhythm')}>8박자 리듬게임</div>
        <div className="side_menu" onClick={()=>setSelectedPost('fourWord') }>4글자 게임</div>
        <div className="side_menu" onClick={()=>setSelectedPost('absolutePitch') }>청개구리 절대음감</div>
        <div className="side_menu" onClick={()=>setSelectedPost('picture') }>이구동성 그림그리기</div>
      </aside>

      <main className="main-content">
        <button className="btn floatL" onClick={()=>setOnSidebar('on')}>menu</button>
        <Main menu={selectedPost} />
		  </main>
    </div>
  );
}

export default App;
