import express from "express";
import expressWs from "express-ws";
import user from "./store/user.js";

const router = express.Router();
expressWs(router);

router.ws("/", (ws, req) => {
    // ws.send("success");

    ws.on("message", msg => {
        if (msg.indexOf("user:") > -1) {
            let newUserId = msg.split(":")[1];
            user.addPlayer(newUserId);
            ws.send("currentPlayersNum:" + user.getPlayersNum());
        }
    });

    // ws.on("close", (...args) => {
    //     console.log(args);
    // });
});

export default router;
