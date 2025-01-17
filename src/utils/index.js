import user from "../store/user.js";
import gameStatus from "../store/gameStatus.js";
/**
 * 处理ws消息
 * @param {WebSocket} ws
 * @param {string} msg
 */
export const handleWsMessage = (ws, msg) => {
    if (msg.includes("login")) {
        ws.send("login:ok");
        const playerId = msg.split(":")[1];
        user.addPlayer(playerId, ws);
        console.log("玩家" + playerId + "上线");
    }
    if (msg.includes("ping")) {
        ws.send("pong");
        const playerId = msg.split(":")[1];
        user.updateUserTime(playerId, new Date().getTime());
    }
    if (msg.includes("name")) {
        const playerId = msg.split(":")[1];
        const name = msg.split(":")[2];
        user.updateName(playerId, name);
    }
    if (msg.includes("ready")) {
        const playerId = msg.split(":")[1];
        user.userReady(playerId);
        user.sendAll("userReady:" + playerId);
        if (user.checkIfAllReady()) {
            user.sendAll("allReady");
            startGame(ws);
        }
    }
};

/**
 * 开始游戏
 * @param {WebSocket} ws
 */
const startGame = ws => {
    if (gameStatus.dealer === "") {
        // 没有庄家，说明是第一局，随机生成庄家
        const index = Math.floor(Math.random() * user.getPlayersNum());
        gameStatus.setDealer(user.playersArray[index].id);
        ws.send("setDealer:" + gameStatus.dealer);
    } else {
        // 有庄家，说明是第二局及以后
        const index = user.playersArray.findIndex(
            i => i.id === gameStatus.dealer
        );
        gameStatus.setDealer(
            user.playersArray[(index + 1) % user.getPlayersNum()].id
        );
        ws.send("setDealer:" + gameStatus.dealer);
    }
    gameStatus.setStatus("playing");
};
