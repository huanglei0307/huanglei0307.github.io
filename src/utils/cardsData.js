// src/utils/cardsData.js
// 每个类别的卡片（至少10张）

export const cardsData = {
  airplane: [
    { id: 1, text: "airplane flying in blue sky" },
    { id: 2, text: "airplane taking off from runway" },
    { id: 3, text: "airplane landing at airport" },
    { id: 4, text: "airplane parked at gate" },
    { id: 5, text: "airplane flying above clouds" },
    { id: 6, text: "airplane at sunset" },
    { id: 7, text: "airplane with landing gear down" },
    { id: 8, text: "airplane flying over mountains" },
    { id: 9, text: "airplane in stormy weather" },
    { id: 10, text: "airplane at night with lights" }
  ],
  helicopter: [
    { id: 1, text: "helicopter hovering in air" },
    { id: 2, text: "helicopter landing on helipad" },
    { id: 3, text: "helicopter flying over city" },
    { id: 4, text: "helicopter on rescue mission" },
    { id: 5, text: "helicopter with open door" },
    { id: 6, text: "helicopter over water" },
    { id: 7, text: "helicopter in military camouflage" },
    { id: 8, text: "helicopter carrying cargo" },
    { id: 9, text: "helicopter flying low" },
    { id: 10, text: "helicopter at airshow" }
  ],
  airship: [
    { id: 1, text: "airship floating in blue sky" },
    { id: 2, text: "airship with advertising banner" },
    { id: 3, text: "airship flying over stadium" },
    { id: 4, text: "airship at sunset" },
    { id: 5, text: "airship with colorful stripes" },
    { id: 6, text: "airship flying over ocean" },
    { id: 7, text: "airship near mountains" },
    { id: 8, text: "airship at night" },
    { id: 9, text: "airship with landing platform" },
    { id: 10, text: "airship in cloudy weather" }
  ]
};

// 生成所有卡片的扁平列表（用于搜索）
export const allCards = [
  ...cardsData.airplane.map(c => ({ ...c, class: 'airplane' })),
  ...cardsData.helicopter.map(c => ({ ...c, class: 'helicopter' })),
  ...cardsData.airship.map(c => ({ ...c, class: 'airship' }))
];

// 获取卡片总数
export const getTotalCardsCount = () => {
  return allCards.length;
};

// 按类别获取卡片
export const getCardsByClass = (className) => {
  return cardsData[className] || [];
};