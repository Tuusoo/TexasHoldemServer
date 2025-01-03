import express from "express";
import expressWs from "express-ws";
import { handleClientMessage } from "./utils";

const router = express.Router();
expressWs(router);

router.ws("/", (ws, req) => {
    ws.on("message", (msg) => handleClientMessage(ws, msg));

    // ws.on("close", (...args) => {
    //     console.log(args);
    // });
});

export default router;