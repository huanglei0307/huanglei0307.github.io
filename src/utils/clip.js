// src/utils/clip.js
import { allCards } from "./cardsData";

// 确保 CLIP 模型已初始化
export const initCLIP = async () => {
  if (window.clip && window.clip.isReady) {
    return window.clip;
  }
  if (window.clip && window.clip.init) {
    await window.clip.init();
    return window.clip;
  }
  // 等待 CLIP 就绪事件
  return new Promise((resolve) => {
    const onReady = () => {
      window.removeEventListener('clip-ready', onReady);
      resolve(window.clip);
    };
    window.addEventListener('clip-ready', onReady);
    // 如果已经就绪，立即触发
    if (window.clip && window.clip.isReady) {
      onReady();
    }
  });
};

// 获取图像特征向量
export const getImageEmbedding = async (imageElement) => {
  const clip = await initCLIP();
  if (!clip || !clip.getImageEmbedding) {
    console.error("CLIP not ready");
    return null;
  }
  return await clip.getImageEmbedding(imageElement);
};

// 获取文本特征向量
export const getTextEmbedding = async (text) => {
  const clip = await initCLIP();
  if (!clip || !clip.getTextEmbedding) {
    console.error("CLIP not ready");
    return null;
  }
  return await clip.getTextEmbedding(text);
};

// 预计算所有卡片文本特征
export let textFeaturesCache = null;

export const precomputeTextFeatures = async () => {
  if (textFeaturesCache) return textFeaturesCache;
  
  const clip = await initCLIP();
  if (!clip) return null;
  
  textFeaturesCache = [];
  
  for (const card of allCards) {
    try {
      const embedding = await getTextEmbedding(card.text);
      textFeaturesCache.push({
        ...card,
        embedding: embedding
      });
    } catch (error) {
      console.error(`Failed to get embedding for card: ${card.text}`, error);
      // 添加一个零向量作为后备
      textFeaturesCache.push({
        ...card,
        embedding: new Float32Array(512)
      });
    }
  }
  
  console.log(`✅ 预计算完成: ${textFeaturesCache.length} 张卡片特征`);
  return textFeaturesCache;
};

// 计算余弦相似度
export const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

// 根据图像找最相似的卡片
export const findSimilarCards = async (imageElement, topK = 5) => {
  if (!imageElement) {
    console.warn("No image element provided");
    return [];
  }
  
  const imageEmbedding = await getImageEmbedding(imageElement);
  if (!imageEmbedding) {
    console.warn("Failed to get image embedding");
    return [];
  }
  
  const cardFeatures = await precomputeTextFeatures();
  if (!cardFeatures || cardFeatures.length === 0) {
    console.warn("No card features available");
    return [];
  }
  
  const similarities = cardFeatures.map(card => ({
    ...card,
    similarity: cosineSimilarity(imageEmbedding, card.embedding)
  }));
  
  similarities.sort((a, b) => b.similarity - a.similarity);
  const topResults = similarities.slice(0, topK);
  
  console.log(`✅ 找到 ${topResults.length} 个相似卡片`);
  return topResults;
};

// 重置缓存（当卡片数据更新时调用）
export const resetCache = () => {
  textFeaturesCache = null;
  console.log("✅ 卡片特征缓存已重置");
};