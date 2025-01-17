// 当前玩家
class Players {
    constructor() {
        /**
         * 玩家列表
         * @type {Array<{id: string, lastTime: number, ready: boolean, ws: WebSocket}>}
         */
        this.playersArray = [];
    }

    addPlayer(id, ws) {
        const index = this.playersArray.findIndex(i => i.id === id);
        if (index === -1) {
            this.playersArray.push({
                id: id,
                lastTime: new Date().getTime(),
                ready: false,
                ws: ws,
            });
        } else {
            this.playersArray[index].lastTime = new Date().getTime();
            this.playersArray[index].ready = false;
            this.playersArray[index].ws = ws;
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

    updateUserTime(id, newTime) {
        const index = this.playersArray.findIndex(i => i.id === id);
        if (index > -1) {
            this.playersArray[index].lastTime = newTime;
        }
    }

    clearOfflineUser() {
        const time = new Date().getTime();
        this.playersArray.forEach(i => {
            if (time - i.lastTime > 15000) {
                this.removePlayer(i.id);
                console.log("玩家" + i.id + "掉线");
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
        return this.playersArray.every(i => i.ready) && this.playersArray.length > 4;
    }

    sendAll(msg) {
        this.playersArray.forEach(i => {
            i.ws.send(msg);
        });
    }
}

export default new Players();
