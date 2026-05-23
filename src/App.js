import React, { useState, useRef, useEffect } from "react";
import cv from "@techstark/opencv-js";
import { Tensor, InferenceSession } from "onnxruntime-web";
import Loader from "./components/loader";
import { detectImage } from "./utils/detect";
import { useCardSearch } from "./hooks/useCardSearch";
import { CARDS_DATA } from "./data/cardsData";
import "./style/App.css";

const App = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState({ text: "Loading OpenCV.js", show: true });
  const [image, setImage] = useState(null);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState(0);
  const [selectedClass, setSelectedClass] = useState("all");
  
  const inputImage = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  // CLIP 搜索钩子
  const { 
    cards, 
    ready: clipReady, 
    loading: clipLoading, 
    searchByImage, 
    resetSearch 
  } = useCardSearch(CARDS_DATA);

  const modelName = "model.onnx";
  const modelInputShape = [1, 3, 640, 640];
  const topk = 100;
  const iouThreshold = 0.45;
  const scoreThreshold = 0.25;

  // DataURL 转 File
  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // 检测完成回调
  const onDetectComplete = async (boxes, originalImg) => {
    console.log("检测到物体数量:", boxes.length);
    
    const objects = [];
    for (let i = 0; i < boxes.length; i++) {
      const [x, y, w, h] = boxes[i].bounding;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(originalImg, x, y, w, h, 0, 0, w, h);
      
      objects.push({
        label: boxes[i].label,
        prob: boxes[i].probability,
        imageData: canvas.toDataURL()
      });
    }
    setDetectedObjects(objects);
    
    // 对第一个物体进行 CLIP 搜索
    if (objects.length > 0 && objects[0].imageData) {
      setSelectedClass(objects[0].label);
      const file = dataURLtoFile(objects[0].imageData, "segment.png");
      searchByImage(file);
    }
  };

  // 切换物体时重新搜索
  const switchObject = async (index) => {
    setSelectedObject(index);
    const obj = detectedObjects[index];
    if (obj && obj.imageData) {
      setSelectedClass(obj.label);
      const file = dataURLtoFile(obj.imageData, "segment.png");
      searchByImage(file);
    }
  };

  // 获取筛选后的卡片
  const getFilteredCards = () => {
    if (selectedClass === "all") return cards;
    return cards.filter(card => card.class === selectedClass);
  };

  // 获取各类别卡片数量
  const getCardCount = (className) => {
    if (className === "all") return cards.length;
    return cards.filter(c => c.class === className).length;
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
    setLoading({ show: false });
  };

  if (loading.show || clipLoading) {
    return (
      <Loader>
        {loading.show ? loading.text : "Loading CLIP model..."}
      </Loader>
    );
  }

  return (
    <div className="App">
      <div className="header">
        <h1>✈️ YOLOv8 + CLIP 智能图像分割与搜索</h1>
        <p>识别: airplane (飞机) | helicopter (直升机) | airship (飞艇)</p>
        <p>CLIP 状态: {clipReady ? "✅ 已就绪 (SigLIP)" : "⏳ 加载中..."}</p>
      </div>

      <div className="content">
        <img
          ref={imageRef}
          src="#"
          alt=""
          style={{ display: image ? "block" : "none" }}
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
                onDetectComplete
              );
            }
          }}
        />
        <canvas
          id="canvas"
          width={modelInputShape[2]}
          height={modelInputShape[3]}
          ref={canvasRef}
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
                onClick={() => switchObject(idx)}
              >
                {obj.label} ({(obj.prob * 100).toFixed(0)}%)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CLIP 匹配结果 */}
      {cards.filter(c => c.score > 0.1).length > 0 && (
        <div className="clip-results">
          <h3>🔗 CLIP 相似卡片匹配结果 - {selectedClass === "all" ? "全部" : selectedClass}</h3>
          <div className="matched-cards-list">
            {cards.filter(c => c.score > 0.1).slice(0, 5).map((card) => (
              <div key={card.id} className="matched-card-item">
                <span className="similarity-badge">{(card.score * 100).toFixed(0)}%</span>
                <span className="matched-text">{card.text}</span>
                <span className="matched-class">{card.class}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="btn-container">
        <button
          className="upload-btn"
          onClick={() => inputImage.current.click()}
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
              resetSearch();
              setSelectedClass("all");
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
          if (image) {
            URL.revokeObjectURL(image);
            setImage(null);
          }
          const url = URL.createObjectURL(e.target.files[0]);
          imageRef.current.src = url;
          setImage(url);
          setDetectedObjects([]);
          setSelectedClass("all");
          resetSearch();
        }}
      />

      {/* 卡片库 - 附加任务核心 */}
      <div className="cards-gallery">
        <div className="gallery-header">
          <h3>📋 卡片库 (共 {CARDS_DATA.length} 张)</h3>
          <div className="class-filters">
            <button 
              className={selectedClass === 'all' ? 'active' : ''}
              onClick={() => setSelectedClass('all')}
            >
              全部 ({getCardCount('all')})
            </button>
            <button 
              className={selectedClass === 'airplane' ? 'active' : ''}
              onClick={() => setSelectedClass('airplane')}
            >
              ✈️ 飞机 ({getCardCount('airplane')})
            </button>
            <button 
              className={selectedClass === 'helicopter' ? 'active' : ''}
              onClick={() => setSelectedClass('helicopter')}
            >
              🚁 直升机 ({getCardCount('helicopter')})
            </button>
            <button 
              className={selectedClass === 'airship' ? 'active' : ''}
              onClick={() => setSelectedClass('airship')}
            >
              🎈 飞艇 ({getCardCount('airship')})
            </button>
          </div>
        </div>
        <div className="cards-grid">
          {getFilteredCards().map(card => (
            <div 
              key={card.id} 
              className={`card-item ${card.score > 0.1 ? 'matched' : ''}`}
            >
              <div className="card-emoji">
                {card.class === "airplane" ? "✈️" : card.class === "helicopter" ? "🚁" : "🎈"}
              </div>
              <div className="card-text">{card.text}</div>
              <div className="card-class">{card.class}</div>
              {card.score > 0.1 && (
                <div className="card-score">匹配度: {(card.score * 100).toFixed(0)}%</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;