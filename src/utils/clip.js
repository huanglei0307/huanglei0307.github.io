// src/utils/clip.js - 模拟版本（绕过 CSP 和网络限制）
import { allCards } from "./cardsData";

// 模拟 CLIP 初始化
export const initCLIP = async () => {
  console.log("CLIP: Using mock mode (GitHub Pages CSP workaround)");
  await new Promise(resolve => setTimeout(resolve, 100));
  return { isReady: true, mock: true };
};

// 模拟图像特征提取
export const getImageEmbedding = async (imageElement) => {
  console.log("CLIP: Generating mock image embedding");
  // 返回随机特征向量（512维）
  const embedding = new Float32Array(512);
  for (let i = 0; i < 512; i++) {
    embedding[i] = Math.random() * 2 - 1; // 范围 -1 到 1
  }
  // 归一化
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(v => v / norm);
};

// 模拟文本特征提取
export const getTextEmbedding = async (text) => {
  console.log("CLIP: Generating mock text embedding for:", text);
  const embedding = new Float32Array(512);
  for (let i = 0; i < 512; i++) {
    embedding[i] = Math.random() * 2 - 1;
  }
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(v => v / norm);
};

// 预计算卡片特征
export let textFeaturesCache = null;

export const precomputeTextFeatures = async () => {
  if (textFeaturesCache) return textFeaturesCache;
  
  console.log("CLIP: Precomputing mock text features...");
  textFeaturesCache = [];
  
  for (const card of allCards) {
    // 为每个卡片生成一个固定的特征（基于卡片文本的简单哈希，确保同一卡片每次结果一致）
    let hash = 0;
    for (let i = 0; i < card.text.length; i++) {
      hash = ((hash << 5) - hash) + card.text.charCodeAt(i);
      hash |= 0;
    }
    const embedding = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      embedding[i] = Math.sin(hash + i) * Math.cos(hash * (i + 1));
    }
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    for (let i = 0; i < 512; i++) {
      embedding[i] /= norm;
    }
    
    textFeaturesCache.push({
      ...card,
      embedding: embedding
    });
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

// 根据图像找最相似的卡片（模拟版本）
export const findSimilarCards = async (imageElement, topK = 5) => {
  console.log("CLIP: Finding similar cards (mock mode with text relevance)");
  
  // 模拟延迟（看起来像在处理）
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const imageEmbedding = await getImageEmbedding(imageElement);
  if (!imageEmbedding) return [];
  
  const cardFeatures = await precomputeTextFeatures();
  if (!cardFeatures) return [];
  
  // 计算相似度
  const similarities = cardFeatures.map(card => ({
    ...card,
    similarity: cosineSimilarity(imageEmbedding, card.embedding)
  }));
  
  // 排序并返回前 topK 个
  similarities.sort((a, b) => b.similarity - a.similarity);
  const topResults = similarities.slice(0, topK);
  
  console.log(`✅ 找到 ${topResults.length} 个相似卡片`);
  return topResults;
};

// 重置缓存
export const resetCache = () => {
  textFeaturesCache = null;
  console.log("✅ 卡片特征缓存已重置");
};