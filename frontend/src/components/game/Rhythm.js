import {useState,useRef, useEffect, use} from "react";
import "../../assets/styles/Rhythm.css";

function Rhythm() {
    const [selectedTeam, setSelectedTeam] = useState(null);
    const audioRef = useRef(null);
    const [running, setRunning] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);
    const [teamNames, setTeamNames] = useState([]);

    function handleTeamClick(team) {
        setSelectedTeam(team);

        if(audioRef.current.currentTime !== 0 && team === selectedTeam) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0; // 처음부터
            setRunning(false);
            return;
        }else{
            audioRef.current.currentTime = 0; // 처음부터
            audioRef.current.play();
        };

        setRunning(true);
    }

    useEffect(() => {
        console.log("확인", running);
    }, [running]);

    useEffect(() => {
        // fetch("https://blog-nvf1.onrender.com/team_list")
        fetch("http://localhost:4000/team_list")
        .then((res) => res.json())
        .then(data => {
            console.log("조원 목록:", data);
            setTeamMembers(data);
        });

        fetch("http://localhost:4000/team_nm_list")
        .then((res) => res.json())
        .then(data => {
            console.log("팀명 목록:", data);
            setTeamNames(data);
        });
    }, []);

    return (
    <div>
        <div className="round">1/5</div>
        <div className="deck">
            <div className="card">
                <div className="card-image">
                <img src="/blog/images/people1.jpg" />
            </div>

            <div className="card-name">
                고윤정
            </div>
            </div>
            <div className="card">1</div>
            <div className="card">3</div>
            <div className="card">4</div>
            <div className="card">5</div>
            <div className="card">6</div>
            <div className="card">7</div>
            <div className="card">8</div>
        </div>

        <div className="team-list">
            {teamNames.map(team => (
                <div key={team.team} onClick={() => handleTeamClick(team.team)} className={`team ${selectedTeam === team.team ? "selected" : ""}`}>{team.team}</div>
            ))}
        </div>
        <audio ref={audioRef} src="/blog/bgm/rhythm.mp3" />
    </div>
    );
}

export default Rhythm;