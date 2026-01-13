import { useEffect, useState, useRef } from "react";
import "../../assets/styles/Picture.css";
import data from "../../assets/data/data.json"
import thangBgm from "../../../public/bgm/thang.mp3"

function Picture() {
  const audioRef = useRef(null);
  const [name, setName] = useState("이구동성 그림그리기");
  const [img, setImg] = useState("../../../public/images/people1.jpg");
  
  function pictureWord(){
    let word = data.picture[Math.floor(Math.random()*data.picture.length)];
    setName(word);
  }

  function thang(){
    audioRef.current.currentTime = 0; // 처음부터
    audioRef.current.play();
  }

  return (
    <div>
      <div className="title">이구동성 그림그리기</div>
      <div className={`picture_screen`}>
        <div className="picture_img"><img src={img}/></div>
        <div className="picture_name">{name}</div>
      </div>
      <div className={`pitch_btn_box`}>
        <div onClick={()=>pictureWord()} className="btn">단어</div>
        <div onClick={()=>thang()} className="btn">땡!</div>
      </div>

      <audio ref={audioRef} src={thangBgm} />
    </div>
  );
}

export default Picture;
