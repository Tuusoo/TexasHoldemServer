import user from "../store/user.js";
import gameStatus from "../store/gameStatus.js";
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
        console.log("玩家" + playerId + "上线");
    }
    if (type === "ping") {
        sendMsg({ type: "pong", data: "pong" });
        const playerId = data;
        user.updateUserTime(playerId, new Date().getTime());
    }
    if (type === "ready") {
        const playerId = data;
        user.userReady(playerId);
        sendUserList();
        if (user.checkIfAllReady()) {
            startGame(ws);
        }
    }
};
/**
 * 广播玩家列表
 */
export const sendUserList = () =>
    user.sendAll({ type: "userList", data: user.getPlayersState() });
/**
 * 开始游戏
 * @param {WebSocket} ws
 */
const startGame = ws => {
    const sendMsg = obj => {
        ws.send(JSON.stringify(obj));
    };
    user.sendAll({ type: "gameStart", data: "ok" });
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
        const index = user.playersArray.findIndex(
            i => i.id === gameStatus.dealer
        );
        gameStatus.setDealer(
            user.playersArray[(index + 1) % user.getPlayersNum()].id
        );
        user.sendAll({
            type: "setDealer",
            data: {
                id: gameStatus.dealer,
                name: user.playersArray[(index + 1) % user.getPlayersNum()]
                    .name,
            },
        });
    }
    gameStatus.setStatus("playing");
};
