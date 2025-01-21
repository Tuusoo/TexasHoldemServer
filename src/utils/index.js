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
        sendMsg({ type: "login", data: "ok" });
        const playerId = data;
        user.addPlayer(playerId, ws);
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
            startGame(ws);
        }
    }
    if (type === "bet") {
        const { id, bet } = data;
        user.bet(id, bet);
        if (bet > gameStatus.highestBet) {
            gameStatus.setHighestBet(bet);
        }
        nextPlayer(id);
    }
    if (type === "fold") {
        const playerId = data;
        user.fold(playerId);
        nextPlayer(playerId);
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
        user.sendAll({
            type: "check",
            data: {
                id: playerId,
                name: user.getPlayer(playerId).name,
            },
        });
        nextPlayer(playerId);
    }
    if (type === "allIn") {
        const playerId = data;
        user.allIn(playerId);
        nextPlayer(playerId);
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
    setTimeout(() => {
        user.bet(players[2].id, 20);
    }, 2000);
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
    if (id === gameStatus.dealer) {
        // 进行到庄家，需要找到需要补注的玩家
        findNeedAddBet();
    } else {
        const players = createDealOrder(gameStatus.dealer, user.playersArray)
            .filter(i => !i.isFold)
            .filter(i => !i.isAllIn);
        const index = players.findIndex(i => i.id === id);
        gameStatus.setCurrentPlayer(players[(index + 1) % players.length].id);
    }
};
/**
 * 循环找到需要补注的玩家
 */
const findNeedAddBet = () => {
    const players = createDealOrder(gameStatus.dealer, user.playersArray).filter(i => !i.isFold);
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
                settle();
                gameStatus.setStatus("settling");
                break;
        }
    }
};
/**
 * 新一轮开始
 */
const handleNewRound = () => {
    user.clearCurrentBet();
    gameStatus.setHighestBet(0);
    sendUserList();
};
/**
 * 结算
 */
const settle = () => {
    const settlePlayers = user.playersArray.filter(i => !i.isFold);
    if (settlePlayers.length === 1) {
        gameStatus.setStatus("settling");
        // 当只有一个玩家没有弃牌时，他赢得所有筹码
        const totalBet = user.getPlayersTotalBet();
        user.addChips(settlePlayers[0].id, totalBet);
        user.sendAll({
            type: "winner",
            data: {
                id: [settlePlayers[0].id],
                name: [settlePlayers[0].name],
                chips: totalBet,
            },
        });
        startNewGame();
        return;
    }
    const communityCards = gameStatus.communityCards;
    const rankings = comparePoker(settlePlayers, communityCards);
    const winner = rankings[0];
    user.sendAll({
        type: "winner",
        data: {
            id: winner.map(i => i.id),
            name: winner.map(i => user.getPlayer(i.id).name),
            cards: winner[0].name,
        },
    });
    user.sendAll({
        type: "gameResult",
        data: rankings,
    });
    handleChipAllocation(rankings);
    startNewGame();
};
/**
 * 结算的时候计算筹码分配
 */
const handleChipAllocation = rankings => {
    const totalBet = user.getPlayersTotalBet(); // 所有玩家总下注
    const players = createDealOrder(gameStatus.dealer, user.playersArray); // 从庄家开始的玩家列表
    // 获胜者是否有all in
    const winnerHasAllIn = rankings[0].some(i => user.getPlayer(i.id).isAllIn);
    if (winnerHasAllIn) {
        // TODO: 处理有all in的情况
    } else {
        const floorNum = Math.floor(totalBet / rankings[0].length / 10) * 10;
        rankings[0].forEach(i => {
            user.addChips(i.id, floorNum);
        });
        // 如果奖池不能整除获胜者人数，从庄家开始顺时针寻找获胜者，给剩余筹码
        if (floorNum * rankings[0].length !== totalBet) {
            const winnerID = rankings[0].map(i => i.id);
            const remainder = totalBet - floorNum * rankings[0].length;
            const luckyGuy = players.find(i => winnerID.includes(i.id));
            user.addChips(luckyGuy.id, remainder);
        }
    }
};
/**
 * 新的一局
 */
const startNewGame = () => {
    user.playersArray.forEach(i => {
        i.ready = false;
        i.handCards = [];
        i.currentBet = 0;
        i.totalBet = 0;
        i.isFold = false;
        i.isAllIn = false;
    });
    sendUserList();
    gameStatus.communityCards = [];
    user.sendAll({ type: "communityCards", data: gameStatus.communityCards });
    gameStatus.setHighestBet(0);
    gameStatus.deck = [];
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
