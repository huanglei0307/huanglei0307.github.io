import React, { useState, useRef, useEffect } from "react";
import cv from "@techstark/opencv-js";
import { Tensor, InferenceSession } from "onnxruntime-web";
import Loader from "./components/loader";
import CardsGallery from "./components/CardsGallery";
import { detectImage } from "./utils/detect";
import { findSimilarCards, initCLIP, precomputeTextFeatures } from "./utils/clip";
import { allCards, cardsData } from "./utils/cardsData";
import "./style/App.css";

const App = () => {
  const [session, setSession] = useState(null);
  const [clipReady, setClipReady] = useState(false);
  const [loading, setLoading] = useState({ text: "Loading OpenCV.js...", show: true });
  const [image, setImage] = useState(null);
  const [matchedCards, setMatchedCards] = useState([]);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState(0);
  
  const inputImage = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  // configs
  const modelName = "model.onnx";
  const modelInputShape = [1, 3, 640, 640];
  const topk = 100;
  const iouThreshold = 0.45;
  const scoreThreshold = 0.25;

  // 初始化 CLIP
  useEffect(() => {
    const loadCLIP = async () => {
      try {
        const clip = await initCLIP();
        if (clip) {
          setClipReady(true);
          await precomputeTextFeatures();
          console.log("✅ CLIP 模型加载完成");
        }
      } catch (error) {
        console.error("❌ CLIP 加载失败:", error);
      }
    };
    loadCLIP();
  }, []);

  // 处理检测完成
  const handleDetectionComplete = async (boxes, originalImage) => {
    console.log("检测到物体数量:", boxes.length);
    
    if (!clipReady) {
      console.warn("CLIP 未就绪，跳过匹配");
      return;
    }
    
    const objects = [];
    
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      const [x, y, w, h] = box.bounding;
      
      const croppedCanvas = document.createElement('canvas');
      const ctx = croppedCanvas.getContext('2d');
      croppedCanvas.width = Math.max(w, 50);
      croppedCanvas.height = Math.max(h, 50);
      
      ctx.drawImage(
        originalImage, 
        Math.max(x, 0), 
        Math.max(y, 0), 
        w, 
        h, 
        0, 
        0, 
        croppedCanvas.width, 
        croppedCanvas.height
      );
      
      const croppedImg = new Image();
      croppedImg.src = croppedCanvas.toDataURL();
      
      objects.push({
        label: box.label,
        probability: box.probability,
        bounding: box.bounding,
        imageElement: croppedImg
      });
    }
    
    setDetectedObjects(objects);
    
    if (objects.length > 0 && objects[0].imageElement) {
      setSelectedObject(0);
      try {
        await new Promise((resolve) => {
          objects[0].imageElement.onload = resolve;
          if (objects[0].imageElement.complete) resolve();
        });
        const similar = await findSimilarCards(objects[0].imageElement, 5);
        setMatchedCards(similar || []);
      } catch (error) {
        console.error("CLIP 匹配失败:", error);
      }
    }
  };

  // 切换物体
  const handleObjectSelect = async (index) => {
    setSelectedObject(index);
    const obj = detectedObjects[index];
    if (obj && obj.imageElement && clipReady) {
      try {
        const similar = await findSimilarCards(obj.imageElement, 5);
        setMatchedCards(similar || []);
      } catch (error) {
        console.error("CLIP 匹配失败:", error);
      }
    }
  };

  // OpenCV 初始化
  cv["onRuntimeInitialized"] = async () => {
    setLoading({ text: "Loading YOLO model...", show: true });
    const yolov8 = await InferenceSession.create('./model.onnx');
    setLoading({ text: "Loading NMS model...", show: true });
    const nms = await InferenceSession.create('./nms-yolov8.onnx');
    setLoading({ text: "Loading Mask model...", show: true });
    const mask = await InferenceSession.create('./mask-yolov8-seg.onnx');

    setLoading({ text: "Warming up model...", show: true });
    const tensor = new Tensor(
      "float32",
      new Float32Array(modelInputShape.reduce((a, b) => a * b)),
      modelInputShape
    );
    await yolov8.run({ images: tensor });

    setSession({ net: yolov8, nms: nms, mask: mask });
    setLoading({ text: "", show: false });
  };

  return (
    <div className="App">
      {loading.show && <Loader>{loading.text}</Loader>}
      
      <div className="header">
        <h1>YOLOv8 Object Segmentation App</h1>
        <p>Powered by <code>onnxruntime-web</code> + CLIP (Mock Mode)</p>
        <p>Model: <code className="code">{modelName}</code></p>
        <p>CLIP: {clipReady ? "✅ Ready" : "⏳ Loading..."}</p>
      </div>

      <div className="content">
        <img
          ref={imageRef}
          src="#"
          alt="Uploaded"
          style={{ display: image ? "block" : "none", maxWidth: "100%", maxHeight: "400px" }}
          onLoad={() => {
            if (session) {
              detectImage(
                imageRef.current,
                canvasRef.current,
                session,
                topk,
                iouThreshold,
                scoreThreshold,
                modelInputShape,
                handleDetectionComplete
              );
            }
          }}
        />
        <canvas
          id="canvas"
          width={modelInputShape[2]}
          height={modelInputShape[3]}
          ref={canvasRef}
          style={{ display: image ? "block" : "none", maxWidth: "100%", maxHeight: "400px" }}
        />
      </div>

      {/* 检测到的物体列表 */}
      {detectedObjects.length > 0 && (
        <div className="detected-objects">
          <h3>🔍 检测到的物体 ({detectedObjects.length})</h3>
          <div className="object-list">
            {detectedObjects.map((obj, idx) => (
              <button
                key={idx}
                className={`object-btn ${selectedObject === idx ? 'active' : ''}`}
                onClick={() => handleObjectSelect(idx)}
              >
                {obj.label} ({Math.round(obj.probability * 100)}%)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CLIP 匹配结果 */}
      {matchedCards.length > 0 && (
        <div className="clip-results">
          <h3>🔗 CLIP 相似卡片匹配结果</h3>
          <div className="matched-cards-list">
            {matchedCards.map((card, idx) => (
              <div key={idx} className="matched-card-item">
                <span className="similarity-badge">{Math.round(card.similarity * 100)}%</span>
                <span className="matched-text">{card.text}</span>
                <span className="matched-class">{card.class}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 按钮区域 */}
      <div className="btn-container">
        <button 
          className="upload-btn"
          onClick={() => inputImage.current.click()}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            margin: "10px"
          }}
        >
          📁 选择图片
        </button>
        {image && (
          <button 
            className="close-btn"
            onClick={() => {
              inputImage.current.value = "";
              imageRef.current.src = "#";
              URL.revokeObjectURL(image);
              setImage(null);
              setDetectedObjects([]);
              setMatchedCards([]);
            }}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              margin: "10px"
            }}
          >
            ❌ 关闭
          </button>
        )}
      </div>

      <input
        type="file"
        ref={inputImage}
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          if (image) URL.revokeObjectURL(image);
          const url = URL.createObjectURL(e.target.files[0]);
          imageRef.current.src = url;
          setImage(url);
          setDetectedObjects([]);
          setMatchedCards([]);
        }}
      />

      {/* 卡片库组件 */}
      <CardsGallery 
        matchedCards={matchedCards}
        onCardClick={(card) => console.log("Clicked:", card)}
        cardsData={cardsData}
        allCards={allCards}
      />
    </div>
  );
};

export default App;