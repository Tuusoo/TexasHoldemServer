import express from "express";
import expressWs from "express-ws";
import login from "./src/login.js";

const app = express();
expressWs(app);
const port = 3000; // 服务端口号

app.use(express.json()).use("/login", login);

app.listen(port, () => {
    console.log(`启动成功，当前服务端口${port}`);
});
