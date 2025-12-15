import React, { useEffect, useState } from "react";
import "./assets/styles/App.css";

function App() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null); // 선택된 포스트 상태

  useEffect(() => {
    fetch("https://blog-nvf1.onrender.com/posts")
      .then((res) => res.json())
      .then(setPosts);
  }, []);

  return (
    <div className="app-container">
      <aside className="sidebar">
        {posts.map(post => (
          <li>{post}</li>
        ))}
        
      </aside>

      <main className="main-content">
        
		  </main>
    </div>
  );
}

export default App;
