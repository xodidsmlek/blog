import React, { useEffect, useState } from "react";
import "../../assets/styles/TeamUpdate.css";

function TeamUpdate() {
  const [id, setId] = useState("");
  const [f_nm, setF_nm] = useState("");
  const [l_nm, setL_nm] = useState("");
  const [team, setTeam] = useState("");
  const [pw, setPw] = useState("");
  const [list, setList] = useState([]);
  const URL = "https://blog-nvf1.onrender.com";
  // const URL = "http://localhost:4000";

  // 조원 전체 조회
  function fetchTeamMembers() {
    console.log("조원 조회 버튼 클릭됨");
    fetch(URL+"/team_list")
      .then((res) => res.json())
      .then(data => {
        console.log("조원 목록:", data);
        setList(data);
      });
  }

  // 조원 추가
  function insertTeamMember() {
    console.log("조원 추가 버튼 클릭됨");
    if(!pw)return;

    fetch(URL+"/teamInsert",{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        f_nm,
        l_nm,
        team,
        pw
      })    
    }).then();
  }

  // 조원 수정
  function updateTeamMember() {
    console.log("조원 수정 버튼 클릭됨");
    if(!id)return;
    if(!pw)return;

    fetch(URL+"/teamUpdate",{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        f_nm,
        l_nm,
        team,
        pw
      })    
    }).then();
  }

  // 팀 전체 삭제
  function deleteTeamMember() {
    console.log("조원 삭제 버튼 클릭됨");
    if(!team)return;
    if(!pw)return;
    confirm("진짜 팀 버려?");

    fetch(URL+"/teamDelete",{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        team,
        pw
      })    
    }).then();
  }

  // 조원 삭제
  function deleteIdMember() {
    console.log("조원 삭제 버튼 클릭됨");
    if(!id)return;
    if(!pw)return;
    confirm("진짜 팀원버려?");
    
    fetch(URL+"/idDelete",{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        pw
      })    
    }).then();
  }
  
  return (
    <div>
      <div className="title">전체목록 조회</div>
      <div className="input_box">
        <input type="text" placeholder="이름(성)"   value={f_nm} onChange={(e) => setF_nm(e.target.value)} />
        <input type="text" placeholder="이름(이름)" value={l_nm} onChange={(e) => setL_nm(e.target.value)} onKeyDown={(e) => {if (e.key === 'Enter') {insertTeamMember();}}}/>
        <input type="text" placeholder="팀"        value={team} onChange={(e) => setTeam(e.target.value)} onKeyDown={(e) => {if (e.key === 'Enter') {deleteTeamMember();}}}/>
        <input type="text" placeholder="아이디"     value={id} onChange={(e) => setId(e.target.value)} onKeyDown={(e) => {if (e.key === 'Enter') {deleteIdMember();}}}/>
        <input type="password" placeholder="비밀번호"  value={pw} onChange={(e) => setPw(e.target.value)} />
        <button className="input_btn" onClick={insertTeamMember}>조원 추가</button>
        <button className="input_btn" onClick={fetchTeamMembers}>조원 조회</button>
        <button className="input_btn" onClick={updateTeamMember}>조원 수정</button>
        <br></br>
        <button className="input_btn" onClick={deleteTeamMember}>팀 삭제</button>
        <button className="input_btn" onClick={deleteIdMember}>조원 삭제</button>
      </div>
      <div className="list_box">
        <h1>조회 목록</h1>
        {list.map(detail => (
          <div key={detail.id}>
            {detail.id} : {detail.f_nm} {detail.l_nm} ({detail.team})
          </div>
        ))}
      </div>
      
    </div>
  );
}

export default TeamUpdate;