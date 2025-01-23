import user from "../store/user.js";
import gameStatus from "../store/gameStatus.js";
import comparePoker from "./comparePoker.js";
/**
 * 处理ws消息
 * @param {WebSocket} ws
 * @param {string} msg
 */
export const handleWsMessage = (ws, msg) => {
    const { type, data } = JSON.parse(msg);
    const sendMsg = obj => {
        ws.send(JSON.stringify(obj));
    };
    if (type === "login") {
        if (user.getPlayersNum() >= 10) {
            sendMsg({ type: "login", data: 1 });
            return;
        }
        const playerId = data;
        const isNew = user.addPlayer(playerId, ws);
        if (isNew === "new") {
            if (gameStatus.status !== "waiting") {
                sendMsg({ type: "login", data: 2 });
                return;
            }
            sendMsg({ type: "login", data: 0 });
        } else {
            sendMsg({ type: "login", data: 0 });
            sendMsg({ type: "gameStatus", data: gameStatus.status });
            const dealerName = user.getPlayer(gameStatus.dealer)?.name;
            sendMsg({
                type: "setDealer",
                data: {
                    id: gameStatus.dealer,
                    name: dealerName,
                },
            });
            sendMsg({ type: "dealCard", data: user.getPlayer(playerId).handCards });
            sendMsg({ type: "communityCards", data: gameStatus.communityCards });
            sendMsg({ type: "currentPlayer", data: gameStatus.currentPlayer });
            sendMsg({ type: "highestBet", data: gameStatus.highestBet });
        }
        sendUserList();
    }
    if (type === "ping") {
        sendMsg({ type: "pong", data: "pong" });
        const playerId = data;
        user.updateUserTime(playerId, new Date().getTime());
    }
    if (type === "ready") {
        const playerId = data;
        user.userReady(playerId);
        if (user.checkIfAllReady()) {
            startGame();
        }
    }
    if (type === "bet") {
        const { id, bet } = data;
        nextPlayer(id);
        user.bet(id, bet);
        if (bet > gameStatus.highestBet) {
            gameStatus.setHighestBet(bet);
        }
    }
    if (type === "fold") {
        const playerId = data;
        nextPlayer(playerId);
        user.fold(playerId);
    }
    if (type === "addBet") {
        const playerId = data;
        user.bet(playerId, gameStatus.highestBet - user.getPlayer(playerId).currentBet);
        findNeedAddBet();
    }
    if (type === "noAddBet") {
        const playerId = data;
        user.fold(playerId);
        findNeedAddBet();
    }
    if (type === "check") {
        const playerId = data;
        nextPlayer(playerId);
        user.movePlayer(playerId);
        user.sendAll({
            type: "check",
            data: {
                id: playerId,
                name: user.getPlayer(playerId).name,
            },
        });
    }
    if (type === "allIn") {
        const playerId = data;
        nextPlayer(playerId);
        user.movePlayer(playerId);
        user.allIn(playerId);
        if (user.getPlayer(playerId).currentBet > gameStatus.highestBet) {
            gameStatus.setHighestBet(user.getPlayer(playerId).currentBet);
        }
    }
};
/**
 * 广播玩家列表
 */
export const sendUserList = () => {
    user.sendAll({ type: "userList", data: user.getPlayersState() });
    process.stdout.write("\x1B[2J\x1B[0f");
    console.table(
        user.playersArray.map(i => ({
            id: i.id,
            name: i.name,
            ready: i.ready,
            chips: i.chips,
            handCards: i.handCards.map(formatCard).join(" "),
            currentBet: i.currentBet,
            isCurrentMove: i.isCurrentMove,
            totalBet: i.totalBet,
            isFold: i.isFold,
            isAllIn: i.isAllIn,
        }))
    );
    console.table({
        status: gameStatus.status,
        dealer: gameStatus.dealer,
        currentPlayer: gameStatus.currentPlayer,
        highestBet: gameStatus.highestBet,
        deck: gameStatus.deck.length,
        communityCards: gameStatus.communityCards.map(formatCard).join(" "),
    });
};
/**
 * 开始游戏
 */
const startGame = () => {
    // 广播游戏开始
    user.sendAll({ type: "gameStart", data: "ok" });
    gameStatus.setStatus("round1");
    // 生成庄家
    if (gameStatus.dealer === "") {
        // 没有庄家，说明是第一局，随机生成庄家
        const index = Math.floor(Math.random() * user.getPlayersNum());
        gameStatus.setDealer(user.playersArray[index].id);
        user.sendAll({
            type: "setDealer",
            data: {
                id: gameStatus.dealer,
                name: user.playersArray[index].name,
            },
        });
    } else {
        // 有庄家，说明是第二局及以后
        const index = user.playersArray.findIndex(i => i.id === gameStatus.dealer);
        gameStatus.setDealer(user.playersArray[(index + 1) % user.getPlayersNum()].id);
        user.sendAll({
            type: "setDealer",
            data: {
                id: gameStatus.dealer,
                name: user.playersArray[(index + 1) % user.getPlayersNum()].name,
            },
        });
    }
    // 发牌
    const deck = createShuffleDeck();
    const players = createDealOrder(gameStatus.dealer, user.playersArray);
    user.bet(players[1].id, 10);
    user.bet(players[2].id, 20);
    gameStatus.setHighestBet(20);
    gameStatus.setDeck(deck);
    dealCards(players);
};
/**
 * 创建洗牌后的牌堆
 */
const createShuffleDeck = () => {
    const suits = ["heart", "diamond", "club", "spade"];
    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push({ suit, rank });
        }
    }
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};
/**
 * 生成从庄家开始的发牌顺序
 */
const createDealOrder = (dealer, playersList) => {
    const index = playersList.findIndex(i => i.id === dealer);
    return playersList.slice(index).concat(playersList.slice(0, index));
};
/**
 * 发牌
 */
const dealCards = players => {
    // 每隔0.2秒发一张牌，每人两张
    let count = 0;
    const deck = gameStatus.deck;
    const interval = setInterval(() => {
        const player = players[count % players.length];
        player.handCards.push(deck.pop());
        player.ws.send(JSON.stringify({ type: "dealCard", data: player.handCards }));
        user.sendAll({
            type: "dealCardsNum",
            data: { id: player.id, num: player.handCards.length },
        });
        count++;
        if (count === players.length * 2) {
            clearInterval(interval);
            // 设置当前操作玩家为大盲注后一名玩家
            gameStatus.setCurrentPlayer(players[3].id);
        }
    }, 200);
};
/**
 * 发公共牌
 */
const dealCommunityCards = () => {
    const deck = gameStatus.deck;
    if (gameStatus.status === "round1") {
        for (let i = 0; i < 3; i++) {
            gameStatus.communityCards.push(deck.pop());
        }
    } else {
        gameStatus.communityCards.push(deck.pop());
    }
    user.sendAll({ type: "communityCards", data: gameStatus.communityCards });
};
/**
 * 下一玩家
 */
const nextPlayer = id => {
    const players = createDealOrder(gameStatus.dealer, user.playersArray)
        .filter(i => !i.isFold)
        .filter(i => !i.isAllIn);
    const index = players.findIndex(i => i.id === id);
    const next = players[(index + 1) % players.length];
    if (next.isCurrentMove) {
        // 已循环一轮，需要找到需要补注的玩家
        setTimeout(() => {
            findNeedAddBet();
        }, 500);
    } else {
        gameStatus.setCurrentPlayer(next.id);
    }
};
/**
 * 循环找到需要补注的玩家
 */
const findNeedAddBet = () => {
    const players = createDealOrder(gameStatus.dealer, user.playersArray)
        .filter(i => !i.isFold)
        .filter(i => !i.isAllIn);
    if (players.length === 1) {
        settle();
        return;
    }
    const needAddBet = players.find(i => i.currentBet < gameStatus.highestBet);
    if (needAddBet) {
        gameStatus.setCurrentPlayer(needAddBet.id);
        needAddBet.ws.send(
            JSON.stringify({
                type: "needAddBet",
                data: gameStatus.highestBet - needAddBet.currentBet,
            })
        );
    } else {
        switch (gameStatus.status) {
            case "round1":
                dealCommunityCards();
                gameStatus.setStatus("round2");
                handleNewRound();
                if (players[0].id === gameStatus.dealer) {
                    gameStatus.setCurrentPlayer(players[1].id);
                } else {
                    gameStatus.setCurrentPlayer(players[0].id);
                }
                break;
            case "round2":
                dealCommunityCards();
                gameStatus.setStatus("round3");
                handleNewRound();
                if (players[0].id === gameStatus.dealer) {
                    gameStatus.setCurrentPlayer(players[1].id);
                } else {
                    gameStatus.setCurrentPlayer(players[0].id);
                }
                break;
            case "round3":
                dealCommunityCards();
                gameStatus.setStatus("round4");
                handleNewRound();
                if (players[0].id === gameStatus.dealer) {
                    gameStatus.setCurrentPlayer(players[1].id);
                } else {
                    gameStatus.setCurrentPlayer(players[0].id);
                }
                break;
            case "round4":
                gameStatus.setStatus("settling");
                settle();
                break;
        }
    }
};
/**
 * 新一轮开始
 */
const handleNewRound = () => {
    user.clearCurrentBet();
    user.clearMove();
    gameStatus.setHighestBet(0);
    sendUserList();
};
/**
 * 结算
 */
const settle = () => {
    const settlePlayers = user.playersArray.filter(i => !i.isFold);
    if (settlePlayers.length === 1) {
        // 当只有一个玩家没有弃牌时，他赢得所有筹码
        const totalBet = user.getPlayersTotalBet();
        user.addChips(settlePlayers[0].id, totalBet);
        user.sendAll({
            type: "lastPlayer",
            data: `只剩一名玩家，所以"${settlePlayers[0].name}"赢得了奖池中所有的${totalBet}筹码`,
        });
        gameStatus.setStatus("settling");
        startNewGame();
        return;
    }
    const ranking = comparePoker(settlePlayers, gameStatus.communityCards);
    const finalResult = handleChipAllocation(ranking);
    user.sendAll({
        type: "showHandCards",
        data: settlePlayers.map(i => ({
            id: i.id,
            handCards: i.handCards,
        })),
    });
    user.sendAll({
        type: "settleResult",
        data: {
            ranking: ranking,
            finalResult: finalResult,
        },
    });
    startNewGame();
};
/**
 * 结算的时候计算筹码分配
 */
const handleChipAllocation = ranking => {
    const playersNum = user.getPlayersNum();
    const sortUserList = user.playersArray.sort((a, b) => a.totalBet - b.totalBet); // 所有玩家按下注金额从小到大排序
    const finalPlayers = ranking.flat();
    const pool = []; // 结算池
    // 生成结算池，每个结算池包含一组玩家和该池的总筹码，按池子从小到大排列
    sortUserList.forEach((player, index) => {
        pool.push({
            players: sortUserList.slice(index).map(i => i.id),
            total:
                (playersNum - index) * (player.totalBet - (sortUserList[index - 1]?.totalBet || 0)),
        });
    });
    // 从结算池中移除弃牌的玩家
    pool.forEach(i => {
        i.players = i.players.filter(p => finalPlayers.some(f => f.id === p));
    });
    const finalResult = finalPlayers.map(player => {
        return {
            id: player.id,
            win: 0,
        };
    });
    pool.forEach(i => {
        for (let j = 0; j < ranking.length; j++) {
            if (ranking[j].some(p => i.players.includes(p.id))) {
                ranking[j].forEach(q => {
                    finalResult.find(f => f.id === q.id).win += i.total / ranking[j].length;
                });
                break;
            }
        }
    });
    let canNotBeDivided = 0;
    finalResult.forEach(i => {
        i.name = user.getPlayer(i.id).name;
        const floor = Math.floor(i.win / 10) * 10;
        canNotBeDivided += i.win - floor;
        i.win = floor;
        user.addChips(i.id, i.win);
    });
    if (canNotBeDivided > 0) {
        // 如果有不能被10整除的筹码，给从庄家开始的第一个获胜者
        const players = createDealOrder(gameStatus.dealer, user.playersArray); // 从庄家开始的玩家列表
        const winnerIDs = ranking[0].map(i => i.id);
        const luckyGuy = players.find(i => winnerIDs.includes(i.id));
        finalResult.find(i => i.id === luckyGuy.id).win += canNotBeDivided;
        user.addChips(luckyGuy.id, canNotBeDivided);
    }
    return finalResult;
};
/**
 * 新的一局
 */
const startNewGame = () => {
    if (user.playersArray.some(i => i.chips === 0)) {
        user.sendAll({
            type: "gameOver",
            data: user.playersArray.map(i => ({ id: i.id, name: i.name, chips: i.chips })),
        });
        return;
    }
    setTimeout(() => {
        user.playersArray.forEach(i => {
            i.ready = false;
            i.handCards = [];
            i.currentBet = 0;
            i.isCurrentMove = false;
            i.totalBet = 0;
            i.isFold = false;
            i.isAllIn = false;
        });
        sendUserList();
        gameStatus.setHighestBet(0);
        gameStatus.communityCards = [];
        gameStatus.deck = [];
    }, 500);
};
/**
 * 把卡牌对象格式化成字符串
 */
const formatCard = card => {
    const suitEmoji = {
        heart: "♥",
        diamond: "♦",
        club: "♣",
        spade: "♠",
    };
    return suitEmoji[card.suit] + card.rank;
};
