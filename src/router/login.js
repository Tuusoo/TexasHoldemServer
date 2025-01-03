import express from "express";
import user from "../store/user.js";

const router = express.Router();

router.post("/", (req, res) => {
    // console.log(req.body);
    if(req.body.userId) {
        user.addPlayer(req.body.userId);
    }
    res.json({ code: "0", msg: "ok" });
});

export default router;
