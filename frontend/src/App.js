import React, { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import "./assets/styles/App.css";

function App() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch("https://blog-nvf1.onrender.com/posts")
      .then((res) => res.json())
      .then(setPosts);
  }, []);

  return (
    <div className="app-container">
      <Sidebar posts={posts} />
      <main className="main-content">
        <h1>Welcome to My Blog</h1>
        <p>여기에 포스트 내용을 표시할 예정입니다.</p>
      </main>
    </div>
  );
}

export default App;
