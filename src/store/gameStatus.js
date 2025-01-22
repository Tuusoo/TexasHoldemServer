import user from "./user.js";

class gameStatus {
    constructor() {
        this.status = "waiting"; // 当前游戏状态 "waiting" | "round1" | "round2" | "round3" | "round4" | "settling"
        this.dealer = ""; // 此局的庄家
        this.communityCards = []; // 公共牌
        this.currentPlayer = ""; // 当前操作玩家id
        this.highestBet = 0; // 当前最高下注
        this.deck = []; // 牌
    }

    setStatus(status) {
        this.status = status;
        user.sendAll({ type: "gameStatus", data: status });
    }

    setDealer(id) {
        this.dealer = id;
    }

    setCurrentPlayer(id) {
        this.currentPlayer = id;
        user.sendAll({ type: "currentPlayer", data: id });
    }

    setHighestBet(bet) {
        this.highestBet = bet;
        user.sendAll({ type: "highestBet", data: bet });
    }

    setDeck(deck) {
        this.deck = deck;
    }
}

export default new gameStatus();
