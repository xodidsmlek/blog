const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();

app.use(express.json());           // ⭐ 필수
app.use(express.urlencoded({ extended: true })); // 선
app.use(cors({
  origin: ['https://xodidsmlek.github.io','http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
}));

const POSTS_DIR = path.join(__dirname, 'posts');

// 팀리스트 전체 조회
app.get('/team_list', async (req, res) => {
  console.log("Received request for /team_list");
  
  const result = db.prepare(
    'SELECT id, f_nm, l_nm, team FROM team_user WHERE use_yn = \'Y\' ORDER BY team DESC'
  ).all();

  res.json(result);
});

// 팀명리스트 전체 조회
app.get('/team_nm_list', async (req, res) => {
  console.log("Received request for /team_list");
  
  const result = db.prepare(
    'SELECT DISTINCT team FROM team_user WHERE use_yn = \'Y\' ORDER BY team'
  ).all();

  res.json(result);
});

// 특정 팀리스트 조회
app.post('/detail_team_list', async (req, res) => {
  console.log("Received request for /detail_team_list");
  const {team } = req.body;
  
  const result = db.prepare(
    'SELECT id, f_nm, l_nm, team FROM team_user WHERE use_yn = \'Y\' AND team = ? ORDER BY team DESC'
  ).all(team);
  res.json(result);
});

// 등록
app.post('/teamInsert', (req, res) => {
  const { f_nm, l_nm, team, pw } = req.body;
  if(pw != "20yearsoldup")return res.status(401).json({ message: '땡!' });

  const result = db.prepare(
    'INSERT INTO team_user (f_nm, l_nm, team) VALUES (?, ?, ?)'
  ).run(f_nm, l_nm, team);

  res.json();
});

// 수정
app.post('/teamUpdate', (req, res) => {
  const { id, f_nm, l_nm, team, pw } = req.body;
  if(pw != "20yearsoldup")return res.status(401).json({ message: '땡!' });

  const result = db.prepare(
    'UPDATE team_user SET f_nm = ?, l_nm = ?, team = ? WHERE id = ?'
  ).run(f_nm, l_nm, team, id);

  res.json();
});

// 삭제
app.post('/idDelete', (req, res) => {
  const { id, pw } = req.body;
  if(pw != "20yearsoldup")return res.status(401).json({ message: '땡!' });

  const result = db.prepare(
    'DELETE FROM team_user WHERE id = ?'
  ).run(id);

  res.json();
});

// 팀 전체 삭제
app.post('/teamDelete', (req, res) => {
  const { team, pw } = req.body;
  if(pw != "20yearsoldup")return res.status(401).json({ message: '땡!' });

  const result = db.prepare(
    'DELETE FROM team_user WHERE team = ?'
  ).run(team);

  res.json();
});

// --- 턴제 주식 게임 API ---
const { db: firestore } = require('./firebase');

// 🔴 서버 관리자 2차 비밀번호 설정
// 보안을 위해 실제 서비스 시에는 Render 환경 변수(SERVER_ADMIN_PASSWORD)로 관리하는 것을 추천합니다.
const SERVER_ADMIN_PASSWORD = process.env.SERVER_ADMIN_PASSWORD || "turnstockadmin123";

// Firebase 연결 여부 체크 미들웨어
const checkFirestore = (req, res, next) => {
  if (!firestore) {
    return res.status(500).json({ error: "Firebase DB가 설정되지 않았습니다. 백엔드 서버 설정을 확인하세요." });
  }
  next();
};

// 1. 모든 게임 리스트 조회
app.get('/api/games', checkFirestore, async (req, res) => {
  try {
    const snapshot = await firestore.collection('games').orderBy('createdAt', 'desc').get();
    const games = [];
    snapshot.forEach(doc => {
      games.push({ id: doc.id, ...doc.data() });
    });
    res.json(games);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "게임 목록을 불러오지 못했습니다." });
  }
});

// 2. 새로운 주식 게임 추가 (게임 매니저)
app.post('/api/games', checkFirestore, async (req, res) => {
  const { gameName, server_pw } = req.body;
  if (server_pw !== SERVER_ADMIN_PASSWORD) {
    return res.status(401).json({ error: "비밀번호가 일치하지 않습니다." });
  }
  if (!gameName || !gameName.trim()) {
    return res.status(400).json({ error: "게임명을 입력해주세요." });
  }

  try {
    const gameRef = await firestore.collection('games').add({
      gameName: gameName.trim(),
      isOpen: false,
      createdAt: new Date()
    });

    await firestore.collection('turns').doc(gameRef.id).set({
      gameName: gameName.trim(),
      currentTurn: 1,
      notice: null,
      isLocked: false,
      autoSellOnTurnEnd: false,
      updatedAt: new Date()
    });

    res.json({ id: gameRef.id, message: "게임이 추가되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "게임 생성 중 오류가 발생했습니다." });
  }
});

// 3. 게임 Open 유무 상태 변경 (게임 매니저)
app.post('/api/games/:id/toggle', checkFirestore, async (req, res) => {
  const { id } = req.params;
  const { isOpen, server_pw } = req.body;
  if (server_pw !== SERVER_ADMIN_PASSWORD) {
    return res.status(401).json({ error: "비밀번호가 일치하지 않습니다." });
  }

  try {
    await firestore.collection('games').doc(id).update({
      isOpen: !!isOpen
    });
    res.json({ message: `게임 상태가 ${isOpen ? '오픈' : '비공개'}으로 변경되었습니다.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "게임 상태 변경 중 오류가 발생했습니다." });
  }
});

// 4. 게임 삭제 (게임 매니저)
app.post('/api/games/:id/delete', checkFirestore, async (req, res) => {
  const { id } = req.params;
  const { server_pw } = req.body;
  if (server_pw !== SERVER_ADMIN_PASSWORD) {
    return res.status(401).json({ error: "비밀번호가 일치하지 않습니다." });
  }

  try {
    const batch = firestore.batch();

    const collectionsToClean = ['stocks', 'users', 'user_stocks', 'news'];
    for (const col of collectionsToClean) {
      const snap = await firestore.collection(col).where('game', '==', id).get();
      snap.forEach(doc => {
        batch.delete(doc.ref);
      });
    }

    batch.delete(firestore.collection('games').doc(id));
    batch.delete(firestore.collection('turns').doc(id));

    await batch.commit();
    res.json({ message: "게임과 관련된 모든 데이터가 삭제되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "게임 삭제 중 오류가 발생했습니다." });
  }
});

// 5. 특정 게임의 턴/공지/잠금 상태 및 오픈상태 조회
app.get('/api/games/:id/status', checkFirestore, async (req, res) => {
  const { id } = req.params;
  try {
    const gameDoc = await firestore.collection('games').doc(id).get();
    const turnDoc = await firestore.collection('turns').doc(id).get();

    if (!gameDoc.exists || !turnDoc.exists) {
      return res.status(404).json({ error: "게임을 찾을 수 없습니다." });
    }

    res.json({
      gameId: id,
      isOpen: gameDoc.data().isOpen,
      ...turnDoc.data()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "게임 상태 조회 중 오류가 발생했습니다." });
  }
});

// 6. 장 오픈 / 마감 상태 토글 (매니저)
app.post('/api/games/:id/turn/toggle-lock', checkFirestore, async (req, res) => {
  const { id } = req.params;
  try {
    const turnRef = firestore.collection('turns').doc(id);
    const doc = await turnRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "게임 턴 정보를 찾을 수 없습니다." });
    }

    const currentLock = doc.data().isLocked;
    const newLock = !currentLock;

    await turnRef.update({
      isLocked: newLock,
      updatedAt: new Date()
    });

    res.json({ isLocked: newLock, message: `장이 ${newLock ? '마감' : '오픈'}되었습니다.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "장 상태 변경 실패" });
  }
});

// 7. 자동 판매 활성화 여부 변경 (매니저)
app.post('/api/games/:id/turn/toggle-auto-sell', checkFirestore, async (req, res) => {
  const { id } = req.params;
  const { autoSell } = req.body;
  try {
    await firestore.collection('turns').doc(id).update({
      autoSellOnTurnEnd: !!autoSell,
      updatedAt: new Date()
    });
    res.json({ autoSellOnTurnEnd: !!autoSell, message: `자동판매 기능이 ${autoSell ? '활성화' : '비활성화'} 되었습니다.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "자동판매 옵션 변경 실패" });
  }
});

// 8. 턴 마감 및 다음 턴 진행 (매니저)
app.post('/api/games/:id/turn/next', checkFirestore, async (req, res) => {
  const { id } = req.params;
  const { notice } = req.body;

  try {
    const turnRef = firestore.collection('turns').doc(id);
    const turnDoc = await turnRef.get();
    if (!turnDoc.exists) {
      return res.status(404).json({ error: "게임 턴 정보를 찾을 수 없습니다." });
    }

    const turnData = turnDoc.data();
    const curTurn = turnData.currentTurn;
    const autoSellEnabled = turnData.autoSellOnTurnEnd;

    const dbBatch = firestore.batch();

    // 1) 주식 리스트 가져오기
    const stockSnap = await firestore.collection('stocks').where('game', '==', id).get();
    const stockMap = {};

    stockSnap.forEach(doc => {
      const data = doc.data();
      const curPrice = data.currentPrice;

      // 지정된 다음 턴 변동률이 있으면 사용하고 없으면 -5% ~ +15% 랜덤값 사용
      const customRate = (data.nextTurnChangeRate !== undefined && data.nextTurnChangeRate !== null)
        ? data.nextTurnChangeRate
        : null;

      const changePercent = customRate !== null
        ? customRate
        : ((Math.random() * 0.2) - 0.05);

      const newPrice = Math.max(1, Math.ceil(curPrice * (1 + changePercent)));

      stockMap[doc.id] = {
        id: doc.id,
        stockName: data.stockName,
        oldPrice: curPrice,
        newPrice: newPrice
      };

      dbBatch.update(doc.ref, {
        prevPrice: curPrice,
        currentPrice: newPrice,
        nextTurnChangeRate: null // 변동이 반영되었으므로 다시 null로 리셋
      });
    });

    // 2) 턴 종료 자동 판매
    if (autoSellEnabled) {
      const userStockSnap = await firestore.collection('user_stocks').where('game', '==', id).get();
      const userSales = {};

      userStockSnap.forEach(doc => {
        const data = doc.data();
        const stkId = data.stock;
        const uId = data.user;
        const qty = data.quantity;

        if (qty > 0 && stockMap[stkId]) {
          const curPriceVal = stockMap[stkId].oldPrice;
          const saleValue = curPriceVal * qty;
          userSales[uId] = (userSales[uId] || 0) + saleValue;
          dbBatch.delete(doc.ref);
        }
      });

      for (const uId of Object.keys(userSales)) {
        const userRef = firestore.collection('users').doc(uId);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
          const currentCash = userDoc.data().cash || 0;
          dbBatch.update(userRef, {
            cash: currentCash + userSales[uId]
          });
        }
      }
    }

    // 3) 턴 업데이트
    dbBatch.update(turnRef, {
      currentTurn: curTurn + 1,
      notice: notice || null,
      isLocked: true,
      updatedAt: new Date()
    });

    await dbBatch.commit();
    res.json({
      success: true,
      message: `턴이 마감되고 ${curTurn + 1}턴이 시작되었습니다. 장은 일시 마감(잠금) 상태입니다.`,
      currentTurn: curTurn + 1
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "턴 마감 처리 중 오류가 발생했습니다." });
  }
});

// 9. 특정 게임의 주식 목록 조회
app.get('/api/games/:id/stocks', checkFirestore, async (req, res) => {
  const { id } = req.params;
  try {
    const snapshot = await firestore.collection('stocks').where('game', '==', id).get();
    const stocks = [];
    snapshot.forEach(doc => {
      stocks.push({ id: doc.id, ...doc.data() });
    });
    res.json(stocks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "주식 목록 조회 실패" });
  }
});

// 10. 주식 종목 추가 (매니저)
app.post('/api/games/:id/stocks', checkFirestore, async (req, res) => {
  const { id } = req.params;
  const { stockName, price } = req.body;
  if (!stockName || !price) {
    return res.status(400).json({ error: "주식명과 주가를 정확히 입력해 주세요." });
  }

  try {
    const docRef = await firestore.collection('stocks').add({
      game: id,
      stockName: stockName.trim(),
      currentPrice: Number(price),
      prevPrice: null,
      createdAt: new Date()
    });
    res.json({ id: docRef.id, message: "주식이 추가되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "주식 추가 실패" });
  }
});

// 11. 주식 정보 수정 (매니저 - 수동 조작)
app.put('/api/games/:id/stocks/:stockId', checkFirestore, async (req, res) => {
  const { id, stockId } = req.params;
  const { stockName, price, nextTurnChangeRate } = req.body;

  try {
    const stockRef = firestore.collection('stocks').doc(stockId);
    const doc = await stockRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "주식 종목을 찾을 수 없습니다." });
    }

    const gameId = doc.data().game || doc.data().game_id;
    if (gameId !== id) {
      return res.status(403).json({ error: "이 게임에 속하지 않은 주식입니다." });
    }

    const updates = {};
    if (stockName) updates.stockName = stockName.trim();
    if (price !== undefined && price !== null && price !== "") {
      const newPrice = Number(price);
      if (newPrice !== doc.data().currentPrice) {
        updates.prevPrice = doc.data().currentPrice;
        updates.currentPrice = newPrice;
      }
    }
    if (nextTurnChangeRate !== undefined) {
      updates.nextTurnChangeRate = (nextTurnChangeRate === null || nextTurnChangeRate === "")
        ? null
        : Number(nextTurnChangeRate);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "수정할 데이터가 없습니다." });
    }

    await stockRef.update(updates);
    res.json({ message: "주식 정보가 강제 변경되었습니다." });
  } catch (error) {
    console.error("Stock Update Error:", error);
    res.status(500).json({ error: "주식 정보 수정 실패" });
  }
});

// 12. 주식 삭제 (매니저)
app.delete('/api/games/:id/stocks/:stockId', checkFirestore, async (req, res) => {
  const { id, stockId } = req.params;
  try {
    const stockRef = firestore.collection('stocks').doc(stockId);
    const doc = await stockRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "주식을 찾을 수 없습니다." });
    }

    const gameId = doc.data().game || doc.data().game_id;
    if (gameId !== id) {
      return res.status(403).json({ error: "이 게임에 속하지 않은 주식입니다." });
    }

    const batch = firestore.batch();
    batch.delete(stockRef);

    const userStockSnap = await firestore.collection('user_stocks').where('stock', '==', stockId).get();
    userStockSnap.forEach(userStockDoc => {
      batch.delete(userStockDoc.ref);
    });

    await batch.commit();
    res.json({ message: "주식이 성공적으로 삭제되었습니다." });
  } catch (error) {
    console.error("Stock Delete Error:", error);
    res.status(500).json({ error: "주식 삭제 실패" });
  }
});

// 13. 유저 추가 (최초 진입 시 가입)
app.post('/api/games/:id/users/join', checkFirestore, async (req, res) => {
  const { id } = req.params;
  const { userName } = req.body;

  if (!userName || !userName.trim()) {
    return res.status(400).json({ error: "유저명을 입력해 주세요." });
  }

  try {
    const dupCheck = await firestore.collection('users')
      .where('game', '==', id)
      .where('userName', '==', userName.trim())
      .get();

    if (!dupCheck.empty) {
      return res.status(400).json({ error: "이미 존재하는 유저명입니다. 다른 이름으로 가입하세요." });
    }

    const userRef = await firestore.collection('users').add({
      game: id,
      userName: userName.trim(),
      cash: 10000000,
      createdAt: new Date()
    });

    res.json({ id: userRef.id, userName: userName.trim(), message: "주식게임 참가가 완료되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "유저 생성 실패" });
  }
});

// 14. 전체 참가자 리스트 및 상세 자산 정보 조회 (매니저용 조회 버튼 기능)
app.get('/api/games/:id/users', checkFirestore, async (req, res) => {
  const { id } = req.params;
  try {
    const userSnap = await firestore.collection('users').where('game', '==', id).get();

    const stockSnap = await firestore.collection('stocks').where('game', '==', id).get();
    const stocksMap = {};
    stockSnap.forEach(doc => {
      stocksMap[doc.id] = doc.data();
    });

    const userStockSnap = await firestore.collection('user_stocks').where('game', '==', id).get();
    const holdingsMap = {};
    userStockSnap.forEach(doc => {
      const data = doc.data();
      const uId = data.user;
      if (!holdingsMap[uId]) holdingsMap[uId] = [];

      const stockInfo = stocksMap[data.stock] || { stockName: "미확인 종목", currentPrice: 0 };
      holdingsMap[uId].push({
        stockId: data.stock,
        stockName: stockInfo.stockName,
        quantity: data.quantity,
        averagePrice: data.averagePrice,
        currentPrice: stockInfo.currentPrice
      });
    });

    const userList = [];
    userSnap.forEach(doc => {
      const data = doc.data();
      const holdings = holdingsMap[doc.id] || [];
      const cash = data.cash || 0;

      const stockEvaluation = holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
      const totalAssets = cash + stockEvaluation;

      userList.push({
        id: doc.id,
        userName: data.userName,
        cash: cash,
        holdings: holdings,
        totalAssets: totalAssets
      });
    });

    res.json(userList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "유저 자산 정보 조회 실패" });
  }
});

// 15. 특정 유저의 예수금 및 보유 주식 현황 조회 (유저 대시보드용)
app.get('/api/games/:id/users/:userId/portfolio', checkFirestore, async (req, res) => {
  const { id, userId } = req.params;
  try {
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists || userDoc.data().game !== id) {
      return res.status(404).json({ error: "유저 정보를 찾을 수 없습니다." });
    }

    const userData = userDoc.data();

    const stockSnap = await firestore.collection('stocks').where('game', '==', id).get();
    const stocksMap = {};
    stockSnap.forEach(doc => {
      stocksMap[doc.id] = doc.data();
    });

    const userStockSnap = await firestore.collection('user_stocks')
      .where('game', '==', id)
      .where('user', '==', userId)
      .get();

    const holdings = [];
    let stockEvaluation = 0;

    userStockSnap.forEach(doc => {
      const data = doc.data();
      const stkId = data.stock;
      const stockInfo = stocksMap[stkId] || { stockName: "미확인 종목", currentPrice: 0 };

      const evalAmt = data.quantity * stockInfo.currentPrice;
      stockEvaluation += evalAmt;

      holdings.push({
        stockId: stkId,
        stockName: stockInfo.stockName,
        quantity: data.quantity,
        averagePrice: data.averagePrice,
        currentPrice: stockInfo.currentPrice,
        evaluationAmount: evalAmt
      });
    });

    res.json({
      userId: userId,
      userName: userData.userName,
      cash: userData.cash,
      stockEvaluation: stockEvaluation,
      totalAssets: userData.cash + stockEvaluation,
      holdings: holdings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "포트폴리오 조회 실패" });
  }
});

// 16. 가상 주식 매수/매도 거래 요청
app.post('/api/games/:id/trade', checkFirestore, async (req, res) => {
  const { id } = req.params;
  const { userId, stockId, type, quantity } = req.body;

  if (!userId || !stockId || !type || !quantity || quantity <= 0) {
    return res.status(400).json({ error: "잘못된 거래 요청 파라미터입니다." });
  }

  try {
    const turnDoc = await firestore.collection('turns').doc(id).get();
    if (!turnDoc.exists) {
      return res.status(404).json({ error: "게임 장 상태를 읽을 수 없습니다." });
    }
    if (turnDoc.data().isLocked) {
      return res.status(400).json({ error: "장이 마감(잠금)되어 거래가 불가능합니다." });
    }

    const stockDoc = await firestore.collection('stocks').doc(stockId).get();
    if (!stockDoc.exists || stockDoc.data().game !== id) {
      return res.status(404).json({ error: "유효하지 않은 주식 정보입니다." });
    }
    const currentPrice = stockDoc.data().currentPrice;
    const requiredAmount = currentPrice * Number(quantity);

    const userRef = firestore.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists || userDoc.data().game !== id) {
      return res.status(404).json({ error: "참가자 정보를 찾을 수 없습니다." });
    }
    const userCash = userDoc.data().cash;

    const userStockDocId = `${userId}_${stockId}`;
    const userStockRef = firestore.collection('user_stocks').doc(userStockDocId);
    const userStockDoc = await userStockRef.get();

    await firestore.runTransaction(async (transaction) => {
      if (type === 'BUY') {
        if (userCash < requiredAmount) {
          throw new Error("예수금이 부족하여 주식을 살 수 없습니다.");
        }

        transaction.update(userRef, { cash: userCash - requiredAmount });

        if (userStockDoc.exists) {
          const prevQty = userStockDoc.data().quantity || 0;
          const prevAvg = userStockDoc.data().averagePrice || 0;
          const newQty = prevQty + Number(quantity);
          const newAvg = Math.ceil(((prevAvg * prevQty) + requiredAmount) / newQty);

          transaction.update(userStockRef, {
            quantity: newQty,
            averagePrice: newAvg,
            updatedAt: new Date()
          });
        } else {
          transaction.set(userStockRef, {
            game: id,
            user: userId,
            stock: stockId,
            quantity: Number(quantity),
            averagePrice: currentPrice,
            updatedAt: new Date()
          });
        }
      } else if (type === 'SELL') {
        if (!userStockDoc.exists || userStockDoc.data().quantity < Number(quantity)) {
          throw new Error("보유하고 있는 주식 수량이 부족합니다.");
        }

        const prevQty = userStockDoc.data().quantity;
        const newQty = prevQty - Number(quantity);

        transaction.update(userRef, { cash: userCash + requiredAmount });

        if (newQty === 0) {
          transaction.delete(userStockRef);
        } else {
          transaction.update(userStockRef, {
            quantity: newQty,
            updatedAt: new Date()
          });
        }
      } else {
        throw new Error("유효하지 않은 거래 타입입니다.");
      }
    });

    res.json({ message: "거래가 정상적으로 완료되었습니다." });

  } catch (error) {
    console.error("Trade Error:", error.message);
    res.status(400).json({ error: error.message || "거래 처리 중 오류가 발생했습니다." });
  }
});

// 17. 특정 게임의 전체 속보 목록 조회
app.get('/api/games/:id/news', checkFirestore, async (req, res) => {
  const { id } = req.params;
  try {
    const snap = await firestore.collection('news')
      .where('game', '==', id)
      .get();

    const news = [];
    snap.forEach(doc => {
      news.push({ id: doc.id, ...doc.data() });
    });

    // composite index 에러 방지를 위해 메모리상에서 정렬
    news.sort((a, b) => {
      const turnA = Number(a.turnNo || 0);
      const turnB = Number(b.turnNo || 0);
      if (turnB !== turnA) return turnB - turnA;
      
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });

    res.json(news);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "속보 조회 실패" });
  }
});

// 18. 새로운 속보 추가 (매니저)
app.post('/api/games/:id/news', checkFirestore, async (req, res) => {
  const { id } = req.params;
  const { turnNo, content } = req.body;
  if (!turnNo || !content) {
    return res.status(400).json({ error: "턴 번호와 속보 내용을 입력하세요." });
  }

  try {
    const docRef = await firestore.collection('news').add({
      game: id,
      turnNo: Number(turnNo),
      content: content.trim(),
      createdAt: new Date()
    });
    res.json({ id: docRef.id, message: "속보가 정상 추가되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "속보 등록 실패" });
  }
});

// 19. 유저 예수금 추가/차감 (매니저)
app.post('/api/games/:id/users/:userId/add-cash', checkFirestore, async (req, res) => {
  const { id, userId } = req.params;
  const { amount, server_pw } = req.body;

  if (server_pw !== SERVER_ADMIN_PASSWORD) {
    return res.status(401).json({ error: "비밀번호가 일치하지 않습니다." });
  }

  if (amount === undefined || isNaN(Number(amount))) {
    return res.status(400).json({ error: "변경할 금액을 올바르게 입력해 주세요." });
  }

  try {
    const userRef = firestore.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "유저를 찾을 수 없습니다." });
    }

    const gameId = userDoc.data().game || userDoc.data().game_id;
    if (gameId !== id) {
      return res.status(404).json({ error: "이 게임에 속하지 않은 유저입니다." });
    }

    const currentCash = userDoc.data().cash || 0;
    const newCash = Math.max(0, currentCash + Number(amount));

    await userRef.update({
      cash: newCash
    });

    res.json({ cash: newCash, message: `예수금이 변경되었습니다. (현재: ${newCash.toLocaleString()}원)` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "예수금 변경 실패" });
  }
});

// 20. 유저 삭제/추방 (매니저)
app.delete('/api/games/:id/users/:userId', checkFirestore, async (req, res) => {
  const { id, userId } = req.params;
  const { server_pw } = req.body;

  // req.body나 query parameter 등에서 비밀번호 확인
  const verifyPw = server_pw || req.headers['x-server-pw'];

  if (verifyPw !== SERVER_ADMIN_PASSWORD) {
    return res.status(401).json({ error: "비밀번호가 일치하지 않습니다." });
  }

  try {
    const userRef = firestore.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "유저를 찾을 수 없습니다." });
    }

    const gameId = userDoc.data().game || userDoc.data().game_id;
    if (gameId !== id) {
      return res.status(404).json({ error: "이 게임에 속하지 않은 유저입니다." });
    }

    const batch = firestore.batch();
    batch.delete(userRef);

    // 유저 보유 주식 삭제
    const userStockSnap = await firestore.collection('user_stocks').where('user', '==', userId).get();
    userStockSnap.forEach(doc => {
      batch.delete(doc.ref);
    });

    const userStockSnapOld = await firestore.collection('user_stocks').where('user_id', '==', userId).get();
    userStockSnapOld.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    res.json({ message: "참가자가 정상적으로 삭제/추방되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "유저 삭제 실패" });
  }
});


app.listen(4000, () => {
  console.log('✅ Server running on http://localhost:4000');
});
