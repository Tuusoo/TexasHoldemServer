import express from "express";
import expressWs from "express-ws";
import login from "./src/router/login.js";
import api from "./src/router/api.js";
import ws from "./src/router/ws.js";

const app = express();
expressWs(app);
const port = 3000; // 服务端口号

// .use(express.urlencoded({ extended: true }))是为了解析请求体是 application/x-www-form-urlencoded 格式的请求
app.use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use("/login", login)
    .use("/api", api)
    .use("/ws", ws);

app.listen(port, () => {
    console.log(`启动成功，当前服务端口${port}`);
});
