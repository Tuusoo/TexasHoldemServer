// 当前人数
class Players {
    constructor() {
        this.playersArray = [];
        this.timer = null;
    }

    // user: {id: "", lastTime: ""}
    addPlayer(user) {
        this.playersArray.push(user);
    }

    removePlayer(userId) {
        const index = this.playersArray.findIndex(i => i.id === userId);
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
        this.playersArray.forEach((i, index) => {
            if (time - i.lastTime > 5000) {
                this.removePlayer(i.id);
                console.log("玩家" + i.id + "掉线");
            }
        });
    }

    startTimer(callback) {
        this.timer = setInterval(callback, 2000);
    }

    clearTimer() {
        clearInterval(this.timer);
    }
}

export default new Players();
