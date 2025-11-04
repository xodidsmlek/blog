import React from "react";
import { marked } from "marked";
import "../assets/styles/PostCard.css";

function PostCard({ post }) {
  // markdown → HTML 변환
  const htmlContent = marked(post.content || "");

  return (
    <div className="post-card">
      <h2 className="post-title">{post.title}</h2>
      <div
        className="post-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}

export default PostCard;
