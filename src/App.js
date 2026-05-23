import React, { useState, useRef, useEffect } from "react";
import cv from "@techstark/opencv-js";
import { Tensor, InferenceSession } from "onnxruntime-web";
import { detectImage } from "./utils/detect";
import { initCLIP, precomputeTextFeatures, findSimilarCards } from "./utils/clip";
import { allCards, cardsData } from "./utils/cardsData";
import CardsGallery from "./components/CardsGallery";
import "./style/App.css";

const App = () => {
  const [session, setSession] = useState(null);
  const [clipReady, setClipReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("加载 OpenCV...");
  const [image, setImage] = useState(null);
  const [matchedCards, setMatchedCards] = useState([]);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState(0);
  
  const inputRef = useRef(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  const modelInputShape = [1, 3, 640, 640];
  const topk = 100;
  const iouThreshold = 0.45;
  const scoreThreshold = 0.25;

  // 初始化 CLIP
  useEffect(() => {
    const loadCLIP = async () => {
      try {
        await initCLIP();
        await precomputeTextFeatures();
        setClipReady(true);
        console.log("✅ CLIP 就绪");
      } catch (err) {
        console.error("CLIP 错误:", err);
        setClipReady(true);
      }
    };
    loadCLIP();
  }, []);

// 检测完成回调
const onDetectComplete = async (boxes, originalImg) => {
  console.log("检测到", boxes.length, "个物体");
  
  const objects = [];
  for (let i = 0; i < boxes.length; i++) {
    const [x, y, w, h] = boxes[i].bounding;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(originalImg, x, y, w, h, 0, 0, w, h);
    const img = new Image();
    img.src = canvas.toDataURL();
    objects.push({
      label: boxes[i].label,      // 类别名称: 'airplane', 'helicopter', 'airship'
      prob: boxes[i].probability,
      img: img
    });
  }
  setDetectedObjects(objects);
  
  if (objects.length > 0 && clipReady) {
    try {
      // 传入检测到的类别名称
      const detectedClass = objects[0].label;
      console.log("检测到类别:", detectedClass);
      const similar = await findSimilarCards(objects[0].img, 5, detectedClass);
      setMatchedCards(similar);
    } catch (err) {
      console.error(err);
    }
  }
};

  // 切换物体
  const switchObject = async (idx) => {
    setSelectedObject(idx);
    if (clipReady && detectedObjects[idx]?.img) {
      const similar = await findSimilarCards(detectedObjects[idx].img, 5);
      setMatchedCards(similar);
    }
  };

  // 初始化 YOLO
  useEffect(() => {
    cv["onRuntimeInitialized"] = async () => {
      setLoadingText("加载 YOLO 模型...");
      const net = await InferenceSession.create("./model.onnx");
      setLoadingText("加载 NMS 模型...");
      const nms = await InferenceSession.create("./nms-yolov8.onnx");
      setLoadingText("加载 Mask 模型...");
      const mask = await InferenceSession.create("./mask-yolov8-seg.onnx");
      
      setLoadingText("预热模型...");
      const dummy = new Tensor("float32", new Float32Array(1*3*640*640), modelInputShape);
      await net.run({ images: dummy });
      
      setSession({ net, nms, mask });
      setLoading(false);
      console.log("✅ YOLO 就绪");
    };
  }, []);

  // 处理图片上传
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (image) URL.revokeObjectURL(image);
    imgRef.current.src = url;
    setImage(url);
    setDetectedObjects([]);
    setMatchedCards([]);
  };

  // 图片加载完成
  const onImageLoad = () => {
    if (session) {
      detectImage(
        imgRef.current, canvasRef.current, session,
        topk, iouThreshold, scoreThreshold, modelInputShape, onDetectComplete
      );
    }
  };

  // 关闭图片
  const closeImage = () => {
    if (image) URL.revokeObjectURL(image);
    imgRef.current.src = "#";
    setImage(null);
    setDetectedObjects([]);
    setMatchedCards([]);
  };

  if (loading) {
    return <div style={{ textAlign: "center", marginTop: 100 }}>⏳ {loadingText}...</div>;
  }

  return (
    <div className="App">
      <div className="header">
        <h1>✈️ YOLOv8 图像分割</h1>
        <p>识别: 飞机 (airplane) | 直升机 (helicopter) | 飞艇 (airship)</p>
        <p>CLIP: {clipReady ? "✅ 演示模式" : "⏳ 加载中..."}</p>
      </div>

      <div className="content">
        <img ref={imgRef} src="#" alt="预览" style={{ display: image ? "block" : "none" }} onLoad={onImageLoad} />
        <canvas ref={canvasRef} width={640} height={640} style={{ display: image ? "block" : "none" }} />
      </div>

      {!image && (
        <div className="btn-container">
          <button className="upload-btn" onClick={() => inputRef.current.click()}>📁 选择图片</button>
        </div>
      )}

      {image && (
        <div className="btn-container">
          <button className="close-btn" onClick={closeImage}>❌ 关闭图片</button>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />

      {detectedObjects.length > 0 && (
        <div className="detected-objects">
          <h3>🔍 检测到 {detectedObjects.length} 个物体</h3>
          <div className="object-list">
            {detectedObjects.map((obj, i) => (
              <button key={i} className={`object-btn ${selectedObject === i ? "active" : ""}`} onClick={() => switchObject(i)}>
                {obj.label} ({(obj.prob * 100).toFixed(0)}%)
              </button>
            ))}
          </div>
        </div>
      )}

      {matchedCards.length > 0 && (
        <div className="clip-results">
          <h3>🔗 CLIP 匹配结果</h3>
          <div className="matched-cards-list">
            {matchedCards.map((card, i) => (
              <div key={i} className="matched-card-item">
                <span className="similarity-badge">{(card.similarity * 100).toFixed(0)}%</span>
                <span className="matched-text">{card.text}</span>
                <span className="matched-class">{card.class}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <CardsGallery matchedCards={matchedCards} cardsData={cardsData} allCards={allCards} />
    </div>
  );
};

export default App;