import {useState,useRef, useEffect} from "react";
import data from "../../assets/data/data.json"
import "../../assets/styles/FourWord.css";
import thangBgm from "../../../public/bgm/thang.mp3"
 
function FourWord() {
  const [firstWord, setFirstWord]   = useState('단');
  const [secondWord, setSecondWord] = useState('어');
  const [thirdWord, setThirdWord]   = useState('게');
  const [fourthWord, setFourthWord] = useState('임');
  const [answer, setAnswer]         = useState('');
  const [on,setOn]                  = useState('screen'); // screen || answer
  const audioRef                    = useRef(null);

  const [level, setLevel] = useState('high');

  function randomWord(){
    let word = data.fourWord[Math.floor(Math.random()*data.fourWord.length)];
    setAnswer(word);
    setOn('screen');
    if(level === "high"){
      let a = Math.floor(Math.random()*4);
      let b = Math.floor(Math.random()*4);
      while(a - b == 0)b = Math.floor(Math.random()*4);
      setFirstWord( (a===0||b===0)?'O':word[0]);
      setSecondWord((a===1||b===1)?'O':word[1]);
      setThirdWord( (a===2||b===2)?'O':word[2]);
      setFourthWord((a===3||b===3)?'O':word[3]);
      } else if(level === "middle"){
      let random = Math.floor(Math.random()*2);
      setFirstWord(random===0?'O':word[0]);
      setSecondWord(random===0?'O':word[1]);
      setThirdWord(random===1?'O':word[2]);
      setFourthWord(random===1?'O':word[3]);
    } else {
      setFirstWord(word[0]);
      setSecondWord(word[1]);
      setThirdWord('O');
      setFourthWord('O');
    }
  }

  function thang(){
    audioRef.current.currentTime = 0; // 처음부터
    audioRef.current.play();
  }

  return (
    <div>
      <div className="title">4글자 게임</div>
      <div className={`screen ${on==='screen'?"screen_on":""}`}>{firstWord} {secondWord} {thirdWord} {fourthWord}</div>
      <div className={`answer_screen  ${on==='answer'?"screen_on":""}`}>{answer}</div>

      <div className={`word_btn_box`}>
        <div onClick={()=>randomWord()} className="btn">단어</div>
        <div onClick={()=>thang()} className="btn">땡!</div>
        <div onClick={()=>setOn('answer')} className="btn">정답</div>
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

export default FourWord;