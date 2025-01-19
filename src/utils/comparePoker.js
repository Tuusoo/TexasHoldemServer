// 德州扑克牌型比较算法，是ChatGpt生成的

// 定义牌型的权重
const HAND_RANKINGS = {
    HighCard: 1,
    OnePair: 2,
    TwoPair: 3,
    ThreeOfAKind: 4,
    Straight: 5,
    Flush: 6,
    FullHouse: 7,
    FourOfAKind: 8,
    StraightFlush: 9,
    RoyalFlush: 10,
};

// 定义点数的权重
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

// 将手牌解析为排序后的点数和花色数组
function parseHand(cards) {
    return cards.sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]);
}

// 生成从所有牌中选择的5张最大牌型的组合
function findBestHand(cards) {
    const combinations = getCombinations(cards, 5);
    let bestHand = null;

    for (const combo of combinations) {
        const evaluated = evaluateHand(combo);
        if (
            !bestHand ||
            evaluated.rank > bestHand.rank ||
            (evaluated.rank === bestHand.rank && compareRanks(evaluated.ranks, bestHand.ranks) > 0)
        ) {
            bestHand = { ...evaluated, cards: combo };
        }
    }

    return bestHand;
}

// 获取数组的所有k个元素组合
function getCombinations(arr, k) {
    if (k === 0) return [[]];
    if (arr.length < k) return [];
    const [first, ...rest] = arr;
    const withFirst = getCombinations(rest, k - 1).map(comb => [first, ...comb]);
    const withoutFirst = getCombinations(rest, k);
    return [...withFirst, ...withoutFirst];
}

// 判断牌型
function evaluateHand(cards) {
    const hand = parseHand(cards);
    const ranks = hand.map(c => RANK_VALUES[c.rank]);
    const suits = hand.map(c => c.suit);

    const isFlush = new Set(suits).size === 1;
    const isStraight =
        ranks.every((rank, i, arr) => i === 0 || rank === arr[i - 1] - 1) ||
        ranks.toString() === "14,5,4,3,2";

    if (isFlush && isStraight && ranks[0] === 14 && ranks[1] === 13)
        return { rank: HAND_RANKINGS.RoyalFlush, ranks, type: "RoyalFlush" };
    if (isFlush && isStraight)
        return { rank: HAND_RANKINGS.StraightFlush, ranks, type: "StraightFlush" };

    const counts = ranks.reduce((acc, rank) => {
        acc[rank] = (acc[rank] || 0) + 1;
        return acc;
    }, {});

    const values = Object.values(counts).sort((a, b) => b - a);
    if (values[0] === 4) return { rank: HAND_RANKINGS.FourOfAKind, ranks, type: "FourOfAKind" };
    if (values[0] === 3 && values[1] === 2)
        return { rank: HAND_RANKINGS.FullHouse, ranks, type: "FullHouse" };
    if (isFlush) return { rank: HAND_RANKINGS.Flush, ranks, type: "Flush" };
    if (isStraight) return { rank: HAND_RANKINGS.Straight, ranks, type: "Straight" };
    if (values[0] === 3) return { rank: HAND_RANKINGS.ThreeOfAKind, ranks, type: "ThreeOfAKind" };
    if (values[0] === 2 && values[1] === 2)
        return { rank: HAND_RANKINGS.TwoPair, ranks, type: "TwoPair" };
    if (values[0] === 2) {
        const pairRank = parseInt(Object.keys(counts).find(key => counts[key] === 2));
        const kickers = ranks.filter(rank => rank !== pairRank).sort((a, b) => b - a);
        return {
            rank: HAND_RANKINGS.OnePair,
            ranks: [pairRank, ...kickers], // 对子放首位
            type: "OnePair",
        };
    }

    return { rank: HAND_RANKINGS.HighCard, ranks, type: "HighCard" };
}

// 比较两副牌的点数
function compareRanks(ranks1, ranks2) {
    for (let i = 0; i < Math.max(ranks1.length, ranks2.length); i++) {
        const rank1 = ranks1[i] || 0; // 防止数组越界
        const rank2 = ranks2[i] || 0;
        if (rank1 !== rank2) {
            return rank1 > rank2 ? 1 : -1;
        }
    }
    return 0; // 平局
}

// 比较多名玩家的最佳牌型
function rankPlayers(playerCards, communityCards) {
    const results = playerCards.map((player, index) => {
        const allCards = [...player, ...communityCards];
        const bestHand = findBestHand(allCards);
        return { player: index + 1, bestHand };
    });

    results.sort((a, b) => {
        if (a.bestHand.rank !== b.bestHand.rank) {
            return b.bestHand.rank - a.bestHand.rank;
        }
        return compareRanks(b.bestHand.ranks, a.bestHand.ranks);
    });

    const rankedGroups = [];
    let currentGroup = [results[0]];

    for (let i = 1; i < results.length; i++) {
        const prev = results[i - 1];
        const curr = results[i];
        if (
            curr.bestHand.rank === prev.bestHand.rank &&
            compareRanks(curr.bestHand.ranks, prev.bestHand.ranks) === 0
        ) {
            currentGroup.push(curr);
        } else {
            rankedGroups.push(currentGroup);
            currentGroup = [curr];
        }
    }
    rankedGroups.push(currentGroup);

    return rankedGroups;
}

export default rankPlayers;

// 示例用法
// const players = [
//     [
//         { rank: "A", suit: "spade" },
//         { rank: "K", suit: "spade" },
//     ],
//     [
//         { rank: "9", suit: "club" },
//         { rank: "9", suit: "diamond" },
//     ],
//     [
//         { rank: "Q", suit: "club" },
//         { rank: "J", suit: "heart" },
//     ],
// ];

// const communityCards = [
//     { rank: "Q", suit: "heart" },
//     { rank: "J", suit: "spade" },
//     { rank: "10", suit: "spade" },
//     { rank: "8", suit: "diamond" },
//     { rank: "7", suit: "heart" },
// ];

// const rankings = rankPlayers(players, communityCards);
// rankings.forEach((group, index) => {
//     console.log(
//         `Rank #${index + 1}:`,
//         group.map(
//             result =>
//                 `Player ${result.player} (${result.bestHand.type}) with cards: ${JSON.stringify(
//                     result.bestHand.cards
//                 )}`
//         )
//     );
// });
