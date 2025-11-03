import React, { useState } from "react";
import "./Sidebar.css";

function Sidebar({ posts }) {
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <aside className="sidebar">
      <div className="menu">
        <div
          className={`menu-item ${openMenu === "posts" ? "open" : ""}`}
          onClick={() => toggleMenu("posts")}
        >
          Posts
        </div>
        {openMenu === "posts" && (
          <div className="submenu">
            {posts.map((post) => (
              <div key={post.id} className="submenu-item">
                {post.title}
              </div>
            ))}
          </div>
        )}

        <div
          className={`menu-item ${openMenu === "record" ? "open" : ""}`}
          onClick={() => toggleMenu("record")}
        >
          Record
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
