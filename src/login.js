import express from "express";
import expressWs from "express-ws";
import user from "./store/user.js";

const router = express.Router();
expressWs(router);

router.ws("/", (ws, req) => {
    ws.on("message", msg => {
        if (msg.indexOf("user:") > -1) {
            let timer = null; // 定时器，每两秒发送一次心跳检测
            let newUserId = msg.split(":")[1];
            user.addPlayer({
                id: newUserId,
                lastTime: newUserId,
            });
            // 心跳检测
            timer = setInterval(() => {
                ws.send(`heartBeat:${newUserId}`);
                ws.send("currentPlayersNum:" + user.getPlayersNum());
                user.clearOfflineUser();
            }, 2000);
        }
        if (msg.indexOf("online:") > -1) {
            const userId = msg.split(":")[1],
                userTime = msg.split(":")[2];
            user.updateUserTime(userId, userTime);
        }
    });

    // ws.on("close", (...args) => {
    //     console.log(args);
    // });
});

export default router;
