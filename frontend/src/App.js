import React, { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import PostCard from "./components/PostCard";
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
        <div className="posts-container">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
