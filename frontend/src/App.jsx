import React, { useEffect, useState } from "react";
import "./assets/styles/App.css";
import Main from "./components/Main";


function App() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(''); // 선택된 포스트 상태

  useEffect(() => {
    console.log("Fetching team list...");
    fetch("https://blog-nvf1.onrender.com/team_list")
    // fetch("http://localhost:4000/team_list")
      .then((res) => res.json())
      .then(setPosts);
  }, []);

  return (
    <div className="app-container">
      <aside className="sidebar">
        <li onClick={()=>setSelectedPost('teamUpdate')}>조원 수정</li>
        <li onClick={()=>setSelectedPost('rhythm')}>8박자 리듬게임</li>
        <li onClick={()=>setSelectedPost('fourWord') }>4글자 게임</li>
      </aside>

      <main className="main-content">
        <Main menu={selectedPost} />
		  </main>
    </div>
  );
}

export default App;
