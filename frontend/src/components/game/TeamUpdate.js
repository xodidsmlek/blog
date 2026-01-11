import React, { useEffect, useState } from "react";

function TeamUpdate() {
  const [id, setId] = useState("");
  const [f_nm, setF_nm] = useState("");
  const [l_nm, setL_nm] = useState("");
  const [team, setTeam] = useState("");

  function fetchTeamMembers() {
    // 조원 조회 로직 구현
    console.log("조원 조회 버튼 클릭됨");
    // fetch("https://blog-nvf1.onrender.com/team_list")
    fetch("http://localhost:4000/team_list")
      .then((res) => res.json())
      .then(data => {
        console.log("조원 목록:", data);
      });
  }

  function insertTeamMember() {
    // 조원 추가 로직 구현
    console.log("조원 추가 버튼 클릭됨");

    // fetch("https://blog-nvf1.onrender.com/team_list")
    fetch("http://localhost:4000/teamInsert",{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        f_nm,
        l_nm,
        team
      })    
    }).then();
  }

  function updateTeamMember() {
    // 조원 추가 로직 구현
    console.log("조원 수정 버튼 클릭됨");

    // fetch("https://blog-nvf1.onrender.com/team_list")
    fetch("http://localhost:4000/teamUpdate",{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        f_nm,
        l_nm,
        team
      })    
    }).then();
  }

  function deleteTeamMember() {
    // 조원 추가 로직 구현
    console.log("조원 삭제 버튼 클릭됨");
    // fetch("https://blog-nvf1.onrender.com/team_list")
    fetch("http://localhost:4000/teamDelete",{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id
      })    
    }).then();
  }
  
  return (
    <div>
      <input type="text" placeholder="이름(성)"   value={f_nm} onChange={(e) => setF_nm(e.target.value)} />
      <input type="text" placeholder="이름(이름)" value={l_nm} onChange={(e) => setL_nm(e.target.value)} />
      <input type="text" placeholder="팀"        value={team} onChange={(e) => setTeam(e.target.value)} />
      <button onClick={insertTeamMember}>조원 추가</button>
      <h2>전체목록 조회</h2>
      <button onClick={fetchTeamMembers}>조원 조회</button>
      <input type="text" placeholder="아이디"  value={id} onChange={(e) => setId(e.target.value)} />
      <button onClick={updateTeamMember}>조원 수정</button>
      <button onClick={deleteTeamMember}>조원 삭제</button>
    </div>
  );
}

export default TeamUpdate;