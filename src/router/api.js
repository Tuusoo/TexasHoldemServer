import express from "express";
import user from "../store/user.js";

const router = express.Router();

router.post("/", (req, res) => {
    switch (req.body.uri) {
        case "currentPlayersNum":
            res.json({ code: "0", msg: user.getPlayersNum() });
            return;
        case "heartBeat":
            console.log(req.body.parameter.userId);
            res.json({ code: "0", msg: "ok" });
            return;
    }
});

export default router;
