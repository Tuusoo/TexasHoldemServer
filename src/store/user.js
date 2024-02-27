// 当前人数
class Players {
    constructor() {
        this.playersArray = [];
    }

    addPlayer(userId) {
        this.playersArray.push(userId);
    }

    removePlayer(userId) {
        const index = this.playersArray.indexOf(userId);
        if (index > -1) {
            this.playersArray.splice(index, 1);
        }
    }

    getPlayersNum() {
        return this.playersArray.length;
    }
}

export default new Players();
