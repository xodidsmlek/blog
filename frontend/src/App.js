import React, { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import PostCard from "./components/PostCard";
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
      <Sidebar posts={posts} onSelectPost={setSelectedPost} />
      <main className="main-content">
		{!selectedPost ? (
          <>
            <h1>Welcome to My Blog</h1>
            <div className="posts-container">
				{posts.map((post) => (
					<PostCard key={post.id} post={post} onSelectPost={setSelectedPost} />
				))}
			</div>
          </>
        ) : (
          <PostCard post={selectedPost} />
        )}
      </main>
    </div>
  );
}

export default App;
