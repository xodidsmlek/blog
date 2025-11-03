import React from "react";
import "./PostCard.css";

function PostCard({ post }) {
  return (
    <div className="post-card">
      <h2 className="post-title">{post.title}</h2>
      <p className="post-summary">{post.summary || "요약 내용이 없습니다."}</p>
    </div>
  );
}

export default PostCard;
