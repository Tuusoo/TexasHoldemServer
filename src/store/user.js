import { sendUserList } from "../utils/index.js";

class Players {
    constructor() {
        /**
         * 玩家列表
         * @type {Array<{id: string, name: string, lastTime: number, ws: WebSocket, ready: boolean, chips: number, handCards: string[], currentBet: number, totalBet: number, isFold: boolean, isAllIn: boolean}>}
         * id 玩家id
         * name 玩家昵称
         * lastTime 最后一次活动时间
         * ws 玩家websocket连接
         * ready 玩家是否准备
         * chips 玩家筹码
         * handCards 玩家手牌
         * currentBet 此轮下注总额
         * totalBet 总下注额
         * isFold 玩家是否弃牌
         * isAllIn 玩家是否all in
         */
        this.playersArray = [];
    }

    addPlayer(id, ws) {
        const index = this.playersArray.findIndex(i => i.id === id);
        if (index === -1) {
            this.playersArray.push({
                id: id,
                name: "",
                lastTime: new Date().getTime(),
                ready: false,
                chips: 1000,
                handCards: [],
                currentBet: 0,
                totalBet: 0,
                isFold: false,
                isAllIn: false,
                ws: ws,
            });
        } else {
            this.playersArray[index].lastTime = new Date().getTime();
            this.playersArray[index].ws = ws;
        }
    }

    updateName(id, name) {
        const index = this.playersArray.findIndex(i => i.id === id);
        if (index > -1) {
            let hasSameName = false;
            this.playersArray.forEach(i => {
                if (i.name === name && i.id !== id) {
                    hasSameName = true;
                }
            });
            if (hasSameName) {
                return "有人用这个昵称了";
            } else {
                this.playersArray[index].name = name;
                return "ok";
            }
        } else {
            return "找不到这个玩家";
        }
    }

    getPlayer(id) {
        return this.playersArray.find(i => i.id === id);
    }

    removePlayer(id) {
        const index = this.playersArray.findIndex(i => i.id === id);
        if (index > -1) {
            this.playersArray.splice(index, 1);
        }
    }

    getPlayersNum() {
        return this.playersArray.length;
    }

    getPlayersState() {
        return this.playersArray.map(i => ({
            id: i.id,
            name: i.name,
            ready: i.ready,
            chips: i.chips,
            currentBet: i.currentBet,
            totalBet: i.totalBet,
            isFold: i.isFold,
            isAllIn: i.isAllIn,
        }));
    }

    updateUserTime(id, newTime) {
        const index = this.playersArray.findIndex(i => i.id === id);
        if (index > -1) {
            this.playersArray[index].lastTime = newTime;
        }
    }

    clearOfflineUser() {
        const time = new Date().getTime();
        this.playersArray.forEach(i => {
            if (time - i.lastTime > 60000) {
                this.removePlayer(i.id);
                this.sendAll({ type: "gameOver", data: "gameOver" });
            }
        });
    }

    userReady(id) {
        const index = this.playersArray.findIndex(i => i.id === id);
        if (index > -1) {
            this.playersArray[index].ready = true;
            sendUserList();
        }
    }

    checkIfAllReady() {
        return (
            this.playersArray.every(i => i.ready) &&
            this.playersArray.length > 3 &&
            this.playersArray.length < 11
        );
    }

    bet(id, bet) {
        const index = this.playersArray.findIndex(i => i.id === id);
        if (index > -1) {
            this.playersArray[index].chips -= bet;
            this.playersArray[index].currentBet += bet;
            this.playersArray[index].totalBet += bet;
            this.sendAll({
                type: "bet",
                data: { id: id, name: this.playersArray[index].name, bet: bet },
            });
            sendUserList();
        }
    }

    clearCurrentBet() {
        this.playersArray.forEach(i => {
            i.currentBet = 0;
        });
    }

    fold(id) {
        const index = this.playersArray.findIndex(i => i.id === id);
        if (index > -1) {
            this.playersArray[index].isFold = true;
            this.sendAll({
                type: "fold",
                data: {
                    id: id,
                    name: this.playersArray[index].name,
                },
            });
            sendUserList();
        }
    }

    allIn(id) {
        const index = this.playersArray.findIndex(i => i.id === id);
        if (index > -1) {
            this.playersArray[index].isAllIn = true;
            this.playersArray[index].currentBet += this.playersArray[index].chips;
            this.playersArray[index].totalBet += this.playersArray[index].chips;
            this.sendAll({
                type: "allIn",
                data: {
                    id: id,
                    name: this.playersArray[index].name,
                    chips: this.playersArray[index].chips,
                },
            });
            sendUserList();
        }
    }

    addChips(id, chips) {
        const index = this.playersArray.findIndex(i => i.id === id);
        if (index > -1) {
            this.playersArray[index].chips += chips;
        }
    }

    getPlayersTotalBet() {
        return this.playersArray.reduce((acc, cur) => acc + cur.totalBet, 0);
    }

    sendAll(msg) {
        this.playersArray.forEach(i => {
            i.ws.send(JSON.stringify(msg));
        });
    }
}

export default new Players();
