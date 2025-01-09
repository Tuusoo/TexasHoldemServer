import express from "express";
import expressWs from "express-ws";
import { handleWsMessage } from "../utils/index.js";

const router = express.Router();
expressWs(router);

router.ws("/", (ws, req) => {
    ws.on("message", (msg) => handleWsMessage(ws, msg));

    // ws.on("close", (...args) => {
    //     console.log(args);
    // });
});

export default router;