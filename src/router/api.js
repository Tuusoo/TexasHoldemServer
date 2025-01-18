import express from "express";
import user from "../store/user.js";
import { sendUserList } from "../utils/index.js";

const router = express.Router();

router.post("/", (req, res) => {
    switch (req.body.uri) {
        case "currentPlayersNum":
            res.json({ code: "0", msg: user.getPlayersNum().toString() });
            return;
        case "updateName":
            const result = user.updateName(req.body.id, req.body.name);
            if (result === "ok") {
                res.json({ code: "0", msg: "ok" });
                sendUserList();
            } else {
                res.json({ code: "1", msg: result });
            }
            return;
    }
});

export default router;
