import { sendUserList } from "../utils/index.js";

class Players {
    constructor() {
        /**
         * 玩家列表
         * @type {Array<{id: string, name: string, lastTime: number, ws: WebSocket, ready: boolean, chips: number, handCards: string[], currentBet: number, isFold: boolean, isAllIn: boolean}>}
         * id 玩家id
         * name 玩家昵称
         * lastTime 最后一次活动时间
         * ws 玩家websocket连接
         * ready 玩家是否准备
         * chips 玩家筹码
         * handCards 玩家手牌
         * currentBet 此局下注总额
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
                console.log("玩家" + i.id + "掉线");
                this.removePlayer(i.id);
                sendUserList();
            }
        });
    }

    userReady(id) {
        const index = this.playersArray.findIndex(i => i.id === id);
        if (index > -1) {
            this.playersArray[index].ready = true;
        }
    }

    checkIfAllReady() {
        return (
            this.playersArray.every(i => i.ready) &&
            this.playersArray.length > 3 &&
            this.playersArray.length < 11
        );
    }

    sendAll(msg) {
        this.playersArray.forEach(i => {
            i.ws.send(JSON.stringify(msg));
        });
    }
}

export default new Players();
