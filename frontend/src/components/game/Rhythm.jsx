import { useState, useRef, useEffect, use } from "react";
import rhythmBgm from "../../../public/bgm/rhythm.mp3"
import "../../assets/styles/Rhythm.css";

// ==========================================
// 각 라운드별 오디오 싱크 매칭용 시간 제어 설정 (사용자가 직접 정밀 조절하는 곳)
// ==========================================
// - beatMs: 1비트(박자)당 시간(밀리초). 숫자가 작을수록 흐름이 빨라집니다.
// - waitBeats: 라운드 시작 전 대기할 박자(비트)의 개수입니다.
const ROUND_TIMINGS = {
    round0: { beatMs: 50, waitBeats: 53, delayMs: 0 },
    round1: { beatMs: 360, waitBeats: 6, delayMs: 200 },
    round2: { beatMs: 360, waitBeats: 6, delayMs: 150 },
    round3: { beatMs: 360, waitBeats: 6, delayMs: 200 },
    round4: { beatMs: 360, waitBeats: 6, delayMs: 200 },
    round5: { beatMs: 360, waitBeats: 6, delayMs: 0 }
};

function Rhythm() {
    //const URL = "https://blog-nvf1.onrender.com";
    const URL = "http://localhost:4000";

    const [selectedTeam, setSelectedTeam] = useState(null);
    const audioRef = useRef(null);
    const [running, setRunning] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);
    const [teamNames, setTeamNames] = useState([]);
    const [activeCnt, setActiveCnt] = useState(0);
    const [level, setLevel] = useState("high");
    const [roundNum, setRoundNum] = useState(0);

    // 카드 생성을 위한 변수
    const [cards, setCards] = useState([]);
    const timeoutRef = useRef(null);
    const intervalRef = useRef(null);
    const directionRef = useRef("wait"); // add | remove | stop
    const addCountRef = useRef(0);
    const roundRef = useRef(0);
    const cardTypeCnt = useRef(2);
    const cardCnt = useRef(0);
    const beatIndexRef = useRef(0);

    function handleTeamClick(team) {
        setSelectedTeam(team);
        resetGame();

        if (audioRef.current.currentTime !== 0 && team === selectedTeam) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0; // 처음부터
            setRunning(false);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            if (audioRef.current) {
                audioRef.current.onplaying = null;
            }
            return;
        } else {
            audioRef.current.currentTime = 0; // 처음부터

            // 실제 음원 재생이 시작될 때 타이머 실행 (동기화 보조)
            audioRef.current.onplaying = () => {
                setRunning(true);
                let tmpList = [...teamMembers[team]]; // 복사
                let newCards = [];
                let roundCard = [];

                // 각 페이즈별 시작 및 종료 타임스탬프 계산 (ms)
                const phaseTimes = [];
                let currentOffset = 0;
                for (let r = 0; r <= 5; r++) {
                    const config = ROUND_TIMINGS[`round${r}`];
                    if (!config) continue;

                    // 0라운드는 대기(WAIT) 및 지연(DELAY)만 진행하고 카드 출현 게임(ADD)은 생략함
                    if (r === 0) {
                        const waitDuration = config.waitBeats * config.beatMs;
                        phaseTimes.push({
                            round: r,
                            type: "wait",
                            start: currentOffset,
                            end: currentOffset + waitDuration,
                            beatMs: config.beatMs
                        });
                        currentOffset += waitDuration;

                        if (config.delayMs && config.delayMs > 0) {
                            phaseTimes.push({
                                round: r,
                                type: "delay",
                                start: currentOffset,
                                end: currentOffset + config.delayMs,
                                beatMs: config.beatMs
                            });
                            currentOffset += config.delayMs;
                        }
                        continue;
                    }

                    // 1~5라운드: ADD(카드 순차 출현) -> WAIT(대기 및 유지) -> DELAY(지연 추가) 순서로 구성
                    // ADD 페이즈
                    const addDuration = 8 * config.beatMs;
                    phaseTimes.push({
                        round: r,
                        type: "add",
                        start: currentOffset,
                        end: currentOffset + addDuration,
                        beatMs: config.beatMs
                    });
                    currentOffset += addDuration;

                    // WAIT 페이즈
                    const waitDuration = config.waitBeats * config.beatMs;
                    phaseTimes.push({
                        round: r,
                        type: "wait",
                        start: currentOffset,
                        end: currentOffset + waitDuration,
                        beatMs: config.beatMs
                    });
                    currentOffset += waitDuration;

                    // DELAY 페이즈
                    if (config.delayMs && config.delayMs > 0) {
                        phaseTimes.push({
                            round: r,
                            type: "delay",
                            start: currentOffset,
                            end: currentOffset + config.delayMs,
                            beatMs: config.beatMs
                        });
                        currentOffset += config.delayMs;
                    }
                }

                const startTime = performance.now();
                const totalDuration = currentOffset;
                const lastGeneratedRound = { current: 0 }; // 틱 감시용 상태 변수

                if (intervalRef.current) clearInterval(intervalRef.current);

                intervalRef.current = setInterval(() => {
                    const elapsed = performance.now() - startTime;

                    // 게임 타임라인 최대 시간 도달 시 자동 종료
                    if (elapsed >= totalDuration) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                        setRunning(false);
                        return;
                    }

                    // 현재 재생 시간대에 해당하는 페이즈 획득
                    const currentPhase = phaseTimes.find(p => elapsed >= p.start && elapsed < p.end);
                    if (!currentPhase) return;

                    // 라운드 번호 동적 업데이트
                    if (roundRef.current !== currentPhase.round) {
                        roundRef.current = currentPhase.round;
                        setRoundNum(currentPhase.round);
                    }

                    // WAIT 및 DELAY 페이즈 진입 시 동작
                    if (currentPhase.type === "wait" || currentPhase.type === "delay") {
                        // 0라운드 대기 페이즈(초기 대기)만 0장으로 유지하고, 
                        // 1~5라운드로 넘어가는 대기페이즈 동안은 이전 라운드의 완성된 8장 카드를 유지함
                        if (currentPhase.round === 0) {
                            setActiveCnt(0);
                        } else {
                            setActiveCnt(8);
                        }
                    }

                    // ADD 페이즈 진입 시 순차 출현 제어
                    if (currentPhase.type === "add") {
                        // 각 라운드 진입 직후 딱 최초 1회만 단어 카드풀 무작위 셔플
                        if (lastGeneratedRound.current < currentPhase.round) {
                            lastGeneratedRound.current = currentPhase.round;

                            let name = "";
                            let targetCardTypeCnt = currentPhase.round === 1 ? 2 : 1;
                            if (tmpList.length === 0) targetCardTypeCnt = 0;
                            cardTypeCnt.current = targetCardTypeCnt;

                            if (cardTypeCnt.current > teamMembers[team].length) {
                                cardTypeCnt.current = teamMembers[team].length;
                            }

                            // 라운드 카드 추가 생성 및 tmpList에서 소진 (기존 누적 데이터 유지)
                            for (let i = 0; i < cardTypeCnt.current; i++) {
                                const id = Math.floor(Math.random() * tmpList.length);
                                if (level === "high") name = tmpList[id].f_nm + tmpList[id].l_nm;
                                if (level === "middle") {
                                    if (currentPhase.round > 1) name = tmpList[id].f_nm + tmpList[id].l_nm;
                                    else name = tmpList[id].l_nm;
                                }
                                if (level === "low") name = tmpList[id].l_nm;

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

                            setCards(newCards);
                        }

                        const currentBeatIndex = Math.floor((elapsed - currentPhase.start) / currentPhase.beatMs);
                        const targetActive = Math.min(currentBeatIndex + 1, 8);
                        setActiveCnt(targetActive);
                    }
                }, 30);
            };
            audioRef.current.play();
        }
    }

    useEffect(() => {
    }, [running]);

    useEffect(() => {
        fetch(URL + "/team_list")
            .then((res) => res.json())
            .then(data => {
                const grouped = data.reduce((acc, cur) => {
                    if (!acc[cur.team]) acc[cur.team] = [];
                    acc[cur.team].push(cur);
                    return acc;
                }, {});
                setTeamMembers(grouped);
            });

        fetch(URL + "/team_nm_list")
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
        if (audioRef.current) {
            audioRef.current.onplaying = null;
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
        setRoundNum(0);
        beatIndexRef.current = 0;
    }

    return (
        <div className={`rhythm-game-root round-theme-${roundNum}`}>
            <div className={`round`}>{roundNum}/5</div>
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
                <div onClick={() => setLevel("high")} className={`level ${level === "high" ? "selected" : ""}`}>상</div>
                <div onClick={() => setLevel("middle")} className={`level ${level === "middle" ? "selected" : ""}`}>중</div>
                <div onClick={() => setLevel("low")} className={`level ${level === "low" ? "selected" : ""}`}>하</div>
            </div>
            <audio ref={audioRef} src={rhythmBgm} />
        </div>
    );
}

export default Rhythm;