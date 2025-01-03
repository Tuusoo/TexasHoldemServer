import user from "../store/user.js";

const handleMessage = (msg, type, callBack) => {
    if (msg.indexOf(type) > -1) {
        callBack();
    }
};

export const handleClientMessage = (ws, msg) => {
    handleMessage(msg, "user:", () => {
        // let newUserId = msg.split(":")[1];
        // user.addPlayer({
        //     id: newUserId,
        //     lastTime: newUserId,
        // });
        // // 心跳检测
        // timer = setInterval(() => {
        //     ws.send(`heartBeat:${newUserId}`);
        //     ws.send("currentPlayersNum:" + user.getPlayersNum());
        //     user.clearOfflineUser();
        // }, 2000);
    });
    if (msg.indexOf("online:") > -1) {
        const userId = msg.split(":")[1],
            userTime = msg.split(":")[2];
        user.updateUserTime(userId, userTime);
    }
};
