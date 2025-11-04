import React, { useEffect } from "react";
import { marked } from "marked";
import "../assets/styles/PostCard.css";

function PostCard({ post }) {
  const htmlContent = marked(post.content || "");

  // 포스트 열릴 때 상단으로 자동 스크롤
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [post]);

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
