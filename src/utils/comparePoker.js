// 德州扑克牌型比较算法，是ChatGpt生成的

// 定义牌型的优先级
const HAND_RANKINGS = [
    "High Card",
    "One Pair",
    "Two Pair",
    "Three of a Kind",
    "Straight",
    "Flush",
    "Full House",
    "Four of a Kind",
    "Straight Flush",
    "Royal Flush",
];

// 转换 rank 值为数字方便比较
const RANK_VALUES = {
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
};

// 比较两手牌型的函数
function compareHands(handA, handB) {
    if (handA.rank < handB.rank) return -1;
    if (handA.rank > handB.rank) return 1;
    for (let i = 0; i < handA.highCards.length; i++) {
        if (handA.highCards[i] > handB.highCards[i]) return 1;
        if (handA.highCards[i] < handB.highCards[i]) return -1;
    }
    return 0;
}

// 生成所有可能的 7 张牌的组合
function generateCombinations(cards) {
    const combinations = [];
    const len = cards.length;
    function combine(temp, start) {
        if (temp.length === 5) {
            combinations.push(temp);
            return;
        }
        for (let i = start; i < len; i++) {
            combine([...temp, cards[i]], i + 1);
        }
    }
    combine([], 0);
    return combinations;
}

// 评估手牌类型
function evaluateHand(cards) {
    // 判断是否为同花
    const isFlush = cards.every(card => card.suit === cards[0].suit);
    // 按 rank 从小到大排序
    const sortedRanks = cards.map(card => RANK_VALUES[card.rank]).sort((a, b) => a - b);
    // 判断是否为顺子
    const isStraight =
        sortedRanks.every((val, idx) => idx === 0 || val === sortedRanks[idx - 1] + 1) ||
        JSON.stringify(sortedRanks) === JSON.stringify([2, 3, 4, 5, 14]); // A-5 特例
    // 统计 rank 出现的频率
    const rankCounts = {};
    sortedRanks.forEach(rank => (rankCounts[rank] = (rankCounts[rank] || 0) + 1));
    const counts = Object.values(rankCounts).sort((a, b) => b - a);

    // 按频率和牌值排序 distinctRanks
    const distinctRanks = Object.keys(rankCounts)
        .map(Number)
        .sort((a, b) => {
            const countDiff = rankCounts[b] - rankCounts[a]; // 按频率排序
            if (countDiff !== 0) return countDiff;
            return b - a; // 频率相同时按牌值大小排序
        });

    // 确定牌型
    let rank = 0;
    let highCards = [];
    if (isFlush && isStraight) {
        rank = sortedRanks[4] === 14 && sortedRanks[0] === 10 ? 9 : 8; // Royal Flush 或 Straight Flush
        highCards = sortedRanks.slice().reverse().shift();
    } else if (counts[0] === 4) {
        rank = 7; // Four of a Kind
        highCards = [distinctRanks[0], distinctRanks[1]];
    } else if (counts[0] === 3 && counts[1] === 2) {
        rank = 6; // Full House
        highCards = [distinctRanks[0], distinctRanks[1]];
    } else if (isFlush) {
        rank = 5; // Flush
        highCards = sortedRanks.slice().reverse();
    } else if (isStraight) {
        rank = 4; // Straight
        highCards = sortedRanks.slice().reverse().shift();
    } else if (counts[0] === 3) {
        rank = 3; // Three of a Kind
        highCards = [distinctRanks[0], ...distinctRanks.slice(1)];
    } else if (counts[0] === 2 && counts[1] === 2) {
        rank = 2; // Two Pair
        highCards = [distinctRanks[0], distinctRanks[1], distinctRanks[2]];
    } else if (counts[0] === 2) {
        rank = 1; // One Pair
        highCards = [distinctRanks[0], ...distinctRanks.slice(1)];
    } else {
        rank = 0; // High Card
        highCards = sortedRanks.slice().reverse();
    }

    return { rank, highCards, name: HAND_RANKINGS[rank], cards };
}

/**
 * 主函数：比较德州扑克玩家手牌
 * @param {*} players
 * @param {*} communityCards
 * @returns { { id: number; name: string; type: string; cards: { rank: string; suit: string }[] }[][] }
 */
function rankPlayers(players, communityCards) {
    const results = players.map(player => {
        const allCards = [...player.handCards, ...communityCards];
        const combinations = generateCombinations(allCards);
        const bestHand = combinations
            .map(combo => evaluateHand(combo))
            .sort(compareHands)
            .pop();
        return {
            id: player.id,
            name: player.name,
            type: bestHand.name,
            cards: bestHand.cards,
            bestHand,
        };
    });

    // 排序玩家
    results.sort((a, b) => compareHands(a.bestHand, b.bestHand));

    // 分组排名
    const rankings = [];
    let currentGroup = [results[0]];
    for (let i = 1; i < results.length; i++) {
        if (compareHands(results[i - 1].bestHand, results[i].bestHand) === 0) {
            currentGroup.push(results[i]);
        } else {
            rankings.push(currentGroup);
            currentGroup = [results[i]];
        }
    }
    rankings.push(currentGroup);

    // 格式化输出
    return rankings
        .map(group =>
            group.map(player => ({
                id: player.id,
                name: player.name,
                type: player.type,
                cards: player.cards,
            }))
        )
        .reverse();
}

export default rankPlayers;
