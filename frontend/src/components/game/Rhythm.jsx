import {useState,useRef, useEffect, use} from "react";
import rhythmBgm from "../../../public/bgm/rhythm.mp3"
import "../../assets/styles/Rhythm.css";

function Rhythm() {
    const URL = "https://blog-nvf1.onrender.com";
    // const URL = "http://localhost:4000";
    
    const [selectedTeam, setSelectedTeam] = useState(null);
    const audioRef = useRef(null);
    const [running, setRunning] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);
    const [teamNames, setTeamNames] = useState([]);
    const [activeCnt, setActiveCnt] = useState(0);
    const [level, setLevel] = useState("high");

    // 카드 생성을 위한 변수
    const [cards, setCards] = useState([]);
    const timeoutRef = useRef(null);
    const intervalRef = useRef(null);
    const directionRef = useRef("wait"); // add | remove | stop
    const addCountRef = useRef(0);
    const roundRef = useRef(0);
    const cardTypeCnt = useRef(2);
    const cardCnt = useRef(0);

    function handleTeamClick(team) {
        setSelectedTeam(team);
        let round = 0;
        resetGame();

        if(audioRef.current.currentTime !== 0 && team === selectedTeam) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0; // 처음부터
            setRunning(false);
            clearInterval(intervalRef.current);
            return;
        }else{
            audioRef.current.currentTime = 0; // 처음부터
            audioRef.current.play();
        };

        setRunning(true);
        let tmpList = [...teamMembers[team]]; // 복사
        let newCards = [];
        let roundCard = [];

        intervalRef.current = setInterval(()=>{
            console.log(directionRef.current);
            // END
            if(directionRef.current === "end"){
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            // WAIT
            if (directionRef.current === "wait") {
                addCountRef.current += 1;

                if (addCountRef.current % 6 === 0) {
                    let name = "";

                    round++;
                    if (round === 1) {
                        directionRef.current = "add";
                    } else if(round === 6){
                        directionRef.current = "end";
                        return;
                    } else {
                        directionRef.current = "update";
                        cardTypeCnt.current += 1;
                    }
                    roundRef.current += 1;

                    if (cardTypeCnt.current > teamMembers[team].length) {
                    cardTypeCnt.current = teamMembers[team].length;
                    }

                    if(round > 1){
                        cardTypeCnt.current = 1;
                        if(tmpList.length == 0)cardTypeCnt.current = 0;
                    }

                    // 라운드 카드 생성
                    for (let i = 0; i < cardTypeCnt.current; i++) {
                        const id = Math.floor(Math.random() * tmpList.length);
                        if(level === "high")name = tmpList[id].f_nm + tmpList[id].l_nm;
                        if(level === "middle"){
                            if(roundRef.current > 1)name = tmpList[id].f_nm + tmpList[id].l_nm;
                            else name = tmpList[id].l_nm;
                        }
                        if(level === "low")name = tmpList[id].l_nm;
                        
                        roundCard.push(name);
                        tmpList.splice(id, 1);
                    }

                    newCards = [];
                    // 8장 카드 생성
                    for (let i = 0; i < 8; i++) {
                        newCards.push(
                            roundCard[Math.floor(Math.random() * roundCard.length)]
                        );
                    }

                    // ✅ 여기서 딱 한 번
                    setCards(newCards);
                }

                return;
            }

            // ADD
            if(directionRef.current === "add"){
                cardCnt.current += 1;
                if(cardCnt.current < 9){
                    setActiveCnt(prev=>prev+1);
                }
                if(cardCnt.current === 9){
                    directionRef.current = "wait";
                    cardCnt.current = 0;
                }
            }

            // UPDATE
            if(directionRef.current === "update"){
                cardCnt.current += 1;
                if(cardCnt.current === 9){
                    directionRef.current = "wait";
                    cardCnt.current = 0;
                }
            }
        },360);
    }

    useEffect(() => {
    }, [running]);

    useEffect(() => {
        fetch(URL+"/team_list")
        .then((res) => res.json())
        .then(data => {
            const grouped = data.reduce((acc, cur) => {
                if (!acc[cur.team]) acc[cur.team] = [];
                acc[cur.team].push(cur);
                return acc;
            }, {});
            setTeamMembers(grouped);
        });

        fetch(URL+"/team_nm_list")
        .then((res) => res.json())
        .then(data => {
            setTeamNames(data);
        });
    }, []);

    function resetGame() {
        // 🔴 interval 정리
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // 🔴 direction / ref 초기화
        directionRef.current = "wait";
        roundRef.current = 0;
        addCountRef.current = 0;
        cardCnt.current = 0;
        cardTypeCnt.current = 2;

        // 🔴 state 초기화
        setCards([]);
        setActiveCnt(0);
        setRunning(false);
    }

    return (
    <div>
        <div className={`round`}>{roundRef.current}/5</div>
        <div className="deck">
            <div className={`card ${activeCnt > 0 ? "action" : ""}`}><div className="card-name">{cards[0]}</div></div>
            <div className={`card ${activeCnt > 1 ? "action" : ""}`}><div className="card-name">{cards[1]}</div></div>
            <div className={`card ${activeCnt > 2 ? "action" : ""}`}><div className="card-name">{cards[2]}</div></div>
            <div className={`card ${activeCnt > 3 ? "action" : ""}`}><div className="card-name">{cards[3]}</div></div>
            <div className={`card ${activeCnt > 4 ? "action" : ""}`}><div className="card-name">{cards[4]}</div></div>
            <div className={`card ${activeCnt > 5 ? "action" : ""}`}><div className="card-name">{cards[5]}</div></div>
            <div className={`card ${activeCnt > 6 ? "action" : ""}`}><div className="card-name">{cards[6]}</div></div>
            <div className={`card ${activeCnt > 7 ? "action" : ""}`}><div className="card-name">{cards[7]}</div></div>
        </div>

        <div className="team-list">
            {teamNames.map(team => (
                <div key={team.team} onClick={() => handleTeamClick(team.team)} className={`team ${selectedTeam === team.team ? "selected" : ""}`}>{team.team}</div>
            ))}
        </div>
        <div className="level-list">
            <div onClick={() => setLevel("high")}   className={`level ${level ==="high"?"selected":""}`}>상</div>
            <div onClick={() => setLevel("middle")} className={`level ${level ==="middle"?"selected":""}`}>중</div>
            <div onClick={() => setLevel("low")}    className={`level ${level ==="low"?"selected":""}`}>하</div>
        </div>
        <audio ref={audioRef} src={rhythmBgm} />
    </div>
    );
}

export default Rhythm;