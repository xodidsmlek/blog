import React, { useState } from "react";
import "../assets/styles/Sidebar.css";

function Sidebar({ posts }) {
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <aside className="sidebar">
      <div className="menu">
		{/* Posts 메뉴 */}
        <div
		 className={`menu-item ${openMenu === "posts" ? "open" : ""}`}
		 onClick={() => toggleMenu("posts")}
        >
          Posts
        </div>
		
        {openMenu === "posts" && (
          <div className="submenu">
            {posts.map((post) => (
              <div key={post.id} className="submenu-item"
			   onClick={() => onSelectPost(post)} // 클릭 시 상위(App)에 전달
			  >
                {post.title}
              </div>
            ))}
          </div>
        )}

		{/* Record 메뉴 */}
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
