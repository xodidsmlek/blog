import React, { useEffect, useState } from "react";
import { marked } from "marked";

function App() {
  const [posts, setPosts] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch("https://blog-nvf1.onrender.com/posts")
      .then(res => res.json())
      .then(setPosts);
  }, []);

  const openPost = (slug) => {
    fetch(`https://blog-nvf1.onrender.com/posts/${slug}`)
      .then(res => res.json())
      .then(setSelected);
  };

  return (
    <div style={{ display: "flex", padding: 20 }}>
      <div style={{ width: "30%", borderRight: "1px solid #ddd" }}>
        <h2>📜 Posts</h2>
        <ul>
          {posts.map(post => (
            <li key={post.slug} style={{ cursor: "pointer" }} onClick={() => openPost(post.slug)}>
              {post.title}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ padding: 20, flex: 1 }}>
        {selected ? (
          <>
            <h1>{selected.title}</h1>
            <p>{selected.date}</p>
            <div dangerouslySetInnerHTML={{ __html: marked(selected.content) }} />
          </>
        ) : (
          <p>Select a post to view.</p>
        )}
      </div>
    </div>
  );
}

export default App;