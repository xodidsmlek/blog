import { useEffect, useState, useRef } from "react";
import "../../assets/styles/AbsolutePitch.css";
import data from "../../assets/data/data.json"
import thangBgm from "../../../public/bgm/thang.mp3"

function AbsolutePitch() {
  const audioRef = useRef(null);
  const [level,setLevel] = useState("high");
  const [answer, setAnswer] = useState("청개구리 절대음감");
  
  function pitchWord(){
    let word = data.pitchWordHigh[Math.floor(Math.random()*data.pitchWordHigh.length)];
    if(level === "high"){
      setAnswer(word);
    } else if(level === "middle"){
      word = Math.floor(Math.random()*2)==0?word:data.pitchWordMiddle[Math.floor(Math.random()*data.pitchWordMiddle.length)];
      setAnswer(word);
    } else {
      word = Math.floor(Math.random()*2)==0?word:data.pitchWordMiddle[Math.floor(Math.random()*data.pitchWordMiddle.length)];
      word = Math.floor(Math.random()*2)==0?word:data.pitchWordLow[Math.floor(Math.random()*data.pitchWordLow.length)];
      setAnswer(word);
    }
  }

  function thang(){
    audioRef.current.currentTime = 0; // 처음부터
    audioRef.current.play();
  }

  return (
    <div>
      <div className="title">청개구리 절대음감</div>
      <div className={`answer_screen screen_on`}>
        <div className="answer">{answer}</div>
      </div>
      <div className={`pitch_btn_box`}>
        <div onClick={()=>pitchWord()} className="btn">단어</div>
        <div onClick={()=>thang()} className="btn">땡!</div>
      </div>

      <div className="level-list">
        <div onClick={() => setLevel("high")}   className={`level ${level ==="high"?"selected":""}`}>상</div>
        <div onClick={() => setLevel("middle")} className={`level ${level ==="middle"?"selected":""}`}>중</div>
        <div onClick={() => setLevel("low")}    className={`level ${level ==="low"?"selected":""}`}>하</div>
      </div>

      <audio ref={audioRef} src={thangBgm} />
    </div>
  );
}

export default AbsolutePitch;
