class gameStatus {
    constructor() {
        this.status = "waiting"; // 当前游戏状态
        this.dealer = ""; // 此局的庄家
    }

    setStatus(status) {
        this.status = status;
    }

    setDealer(id) {
        this.dealer = id;
    }
}

export default new gameStatus();