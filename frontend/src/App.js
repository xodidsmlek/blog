import React, { useEffect, useState } from "react";
import "./assets/styles/App.css";

function App() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(''); // 선택된 포스트 상태

  useEffect(() => {
    fetch("https://blog-nvf1.onrender.com/posts")
      .then((res) => res.json())
      .then(setPosts);
  }, []);

  return (
    <div className="app-container">
      <aside className="sidebar">
        {posts}
        <li onClick={()=>setSelectedPost('test')}>Test Post 1</li>
      </aside>

      <main className="main-content">
        {selectedPost}
		  </main>
    </div>
  );
}

export default App;
