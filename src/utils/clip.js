// src/utils/clip.js
import { allCards, cardsData } from "./cardsData";

export const initCLIP = async () => {
  console.log("CLIP: 模拟模式已启用");
  return { isReady: true, mock: true };
};

export const getImageEmbedding = async (imageElement) => {
  // 模拟特征向量
  const embedding = new Float32Array(512);
  for (let i = 0; i < 512; i++) embedding[i] = Math.random() * 2 - 1;
  const norm = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0));
  return embedding.map(v => v / norm);
};

export const getTextEmbedding = async (text) => {
  const embedding = new Float32Array(512);
  for (let i = 0; i < 512; i++) embedding[i] = Math.random() * 2 - 1;
  const norm = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0));
  return embedding.map(v => v / norm);
};

export let textFeaturesCache = null;

export const precomputeTextFeatures = async () => {
  if (textFeaturesCache) return textFeaturesCache;
  textFeaturesCache = allCards.map(card => ({ ...card, embedding: new Float32Array(512) }));
  console.log(`✅ 预计算 ${textFeaturesCache.length} 张卡片`);
  return textFeaturesCache;
};

export const cosineSimilarity = (a, b) => {
  if (!a || !b) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
};

// 根据类别名称获取对应的卡片
const getCardsByClassName = (className) => {
  switch(className) {
    case 'airplane':
      return cardsData.airplane || [];
    case 'helicopter':
      return cardsData.helicopter || [];
    case 'airship':
      return cardsData.airship || [];
    default:
      return [];
  }
};

// 修改：接收类别参数，只返回该类别的卡片
export const findSimilarCards = async (imageElement, topK = 5, className = null) => {
  await new Promise(r => setTimeout(r, 300));
  
  let targetCards = allCards;
  
  // 如果提供了类别名称，只返回该类别的卡片
  if (className && className !== 'unknown') {
    targetCards = getCardsByClassName(className);
    console.log(`🔍 筛选类别: ${className}, 找到 ${targetCards.length} 张卡片`);
  }
  
  if (targetCards.length === 0) {
    targetCards = allCards;
  }
  
  // 随机排序并返回前 topK 个
  const shuffled = [...targetCards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.slice(0, topK).map(card => ({
    ...card,
    similarity: 0.7 + Math.random() * 0.25
  }));
};