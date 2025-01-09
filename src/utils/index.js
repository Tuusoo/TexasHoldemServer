import user from "../store/user.js";

export const handleWsMessage = (ws, msg) => {
    if (msg.includes("login")) {
        ws.send("login:ok");
        const playerId = msg.split(":")[1];
        user.addPlayer(playerId);
        console.log("玩家" + playerId + "上线");
    }
    if (msg.includes("ping")) {
        ws.send("pong");
        const playerId = msg.split(":")[1];
        user.updateUserTime(playerId, new Date().getTime());
    }
};
