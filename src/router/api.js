import express from "express";
import user from "../store/user.js";

const router = express.Router();

router.post("/", (req, res) => {
    switch (req.body.uri) {
        case "currentPlayersNum":
            res.json({ code: "0", msg: user.getPlayersNum().toString() });
            return;
    }
});

export default router;
