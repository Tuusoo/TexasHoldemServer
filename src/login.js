import express from "express";
import expressWs from "express-ws";

const router = express.Router();
expressWs(router);

router.post("/", (req, res) => {
    console.log(req.body);
    res.json({ code: "0", msg: "ok" });
});

export default router;
