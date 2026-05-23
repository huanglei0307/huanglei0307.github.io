
// import React, { useState, useRef } from "react";
// import cv from "@techstark/opencv-js";
// import { Tensor, InferenceSession } from "onnxruntime-web";
// import Loader from "./components/loader";
// import { detectImage } from "./utils/detect";
// import "./style/App.css";

// const App = () => {
//   const [session, setSession] = useState(null);
//   const [loading, setLoading] = useState({ text: "Loading OpenCV.js", progress: null });
//   const [image, setImage] = useState(null);
//   const inputImage = useRef(null);
//   const imageRef = useRef(null);
//   const canvasRef = useRef(null);

//   // configs
//   const modelName = "model.onnx";
//   const modelInputShape = [1, 3, 640, 640];
//   const topk = 100;
//   const iouThreshold = 0.45;
//   const scoreThreshold = 0.25;

//   // wait until opencv.js initialized
//   cv["onRuntimeInitialized"] = async () => {
//     // create session
//     setLoading({ text: "Loading model...", progress: null });
//     const yolov8 = await InferenceSession.create('./model.onnx');

//     setLoading({ text: "Warming up nms...", progress: null });
//     const nms = await InferenceSession.create('./nms-yolov8.onnx');

//     setLoading({ text: "Warming up mask...", progress: null });
//     const mask = await InferenceSession.create('./mask-yolov8-seg.onnx');

//     // warmup main model
//     setLoading({ text: "Warming up model...", progress: null });
//     const tensor = new Tensor(
//       "float32",
//       new Float32Array(modelInputShape.reduce((a, b) => a * b)),
//       modelInputShape
//     );
//     await yolov8.run({ images: tensor });

//     setSession({ net: yolov8, nms: nms, mask: mask });
//     setLoading(null);
//   };

//   return (
//     <div className="App">
//       {loading && (
//         <Loader>
//           {loading.progress ? `${loading.text} - ${loading.progress}%` : loading.text}
//         </Loader>
//       )}
//       <div className="header">
//         <h1>YOLOv8 Object Segmentation App</h1>
//         <p>
//           YOLOv8 object detection application live on browser powered by{" "}
//           <code>onnxruntime-web</code>
//         </p>
//         <p>
//           Serving : <code className="code">{modelName}</code>
//         </p>
//       </div>

//       <div className="content">
//         <img
//           ref={imageRef}
//           src="#"
//           alt=""
//           style={{ display: image ? "block" : "none" }}
//           onLoad={() => {
//             detectImage(
//               imageRef.current,
//               canvasRef.current,
//               session,
//               topk,
//               iouThreshold,
//               scoreThreshold,
//               modelInputShape
//             );
//           }}
//         />
//         <canvas
//           id="canvas"
//           width={modelInputShape[2]}
//           height={modelInputShape[3]}
//           ref={canvasRef}
//         />
//       </div>

//       <input
//         type="file"
//         ref={inputImage}
//         accept="image/*"
//         style={{ display: "none" }}
//         onChange={(e) => {
//           // handle next image to detect
//           if (image) {
//             URL.revokeObjectURL(image);
//             setImage(null);
//           }

//           const url = URL.createObjectURL(e.target.files[0]); // create image url
//           imageRef.current.src = url; // set image source
//           setImage(url);
//         }}
//       />
//       <div className="btn-container">
//         <button
//           onClick={() => {
//             inputImage.current.click();
//           }}
//         >
//           Open local image
//         </button>
//         {image && (
//           /* show close btn when there is image */
//           <button
//             onClick={() => {
//               inputImage.current.value = "";
//               imageRef.current.src = "#";
//               URL.revokeObjectURL(image);
//               setImage(null);
//             }}
//           >
//             Close image
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };
// export default App;



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
  const [clipSession, setClipSession] = useState(null);
  const [loading, setLoading] = useState({ text: "Loading OpenCV.js", progress: null });
  const [image, setImage] = useState(null);
  const [matchedCards, setMatchedCards] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const inputImage = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  // configs
  const modelName = "model.onnx";
  const modelInputShape = [1, 3, 640, 640];
  const topk = 100;
  const iouThreshold = 0.45;
  const scoreThreshold = 0.25;

  // 初始化 CLIP 模型
  useEffect(() => {
    const loadCLIP = async () => {
      setLoading({ text: "Loading CLIP model...", progress: null });
      const clip = await initCLIP();
      if (clip) {
        setClipSession(clip);
        await precomputeTextFeatures(clip);
        console.log("✅ CLIP 模型加载完成");
      }
    };
    loadCLIP();
  }, []);

  // 处理检测完成的回调
  const handleDetectionComplete = async (boxes, originalImage) => {
    if (!clipSession || !originalImage) return;
    
    const objects = [];
    
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      const [x, y, w, h] = box.bounding;
      
      // 创建 canvas 裁剪物体区域
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
      
      const croppedUrl = croppedCanvas.toDataURL();
      const croppedImg = new Image();
      croppedImg.src = croppedUrl;
      
      objects.push({
        label: box.label,
        probability: box.probability,
        bounding: box.bounding,
        imageUrl: croppedUrl,
        imageElement: croppedImg
      });
    }
    
    setDetectedObjects(objects);
    
    // 自动对第一个检测到的物体进行 CLIP 匹配
    if (objects.length > 0) {
      setSelectedObject(0);
      const similar = await findSimilarCards(objects[0].imageElement);
      setMatchedCards(similar || []);
    }
  };

  // 处理卡片点击
  const handleCardClick = (card) => {
    console.log("Selected card:", card);
    // 可以在这里添加卡片被点击后的行为
  };

  // 切换检测到的物体
  const handleObjectSelect = async (index) => {
    setSelectedObject(index);
    const obj = detectedObjects[index];
    if (obj && obj.imageElement) {
      const similar = await findSimilarCards(obj.imageElement);
      setMatchedCards(similar || []);
    }
  };

  // wait until opencv.js initialized
  cv["onRuntimeInitialized"] = async () => {
    // create session
    setLoading({ text: "Loading YOLO model...", progress: null });
    const yolov8 = await InferenceSession.create('./model.onnx');

    setLoading({ text: "Loading NMS model...", progress: null });
    const nms = await InferenceSession.create('./nms-yolov8.onnx');

    setLoading({ text: "Loading Mask model...", progress: null });
    const mask = await InferenceSession.create('./mask-yolov8-seg.onnx');

    // warmup main model
    setLoading({ text: "Warming up model...", progress: null });
    const tensor = new Tensor(
      "float32",
      new Float32Array(modelInputShape.reduce((a, b) => a * b)),
      modelInputShape
    );
    await yolov8.run({ images: tensor });

    setSession({ net: yolov8, nms: nms, mask: mask });
    setLoading(null);
  };

  return (
    <div className="App">
      {loading && (
        <Loader>
          {loading.progress ? `${loading.text} - ${loading.progress}%` : loading.text}
        </Loader>
      )}
      
      <div className="header">
        <h1>YOLOv8 Object Segmentation App</h1>
        <p>
          YOLOv8 object detection application live on browser powered by{" "}
          <code>onnxruntime-web</code>
        </p>
        <p>
          Model: <code className="code">{modelName}</code>
        </p>
        <p>
          CLIP: <code className="code">Similar card search enabled</code>
        </p>
      </div>

      <div className="content">
        <img
          ref={imageRef}
          src="#"
          alt="Uploaded"
          style={{ display: image ? "block" : "none" }}
          onLoad={() => {
            detectImage(
              imageRef.current,
              canvasRef.current,
              session,
              topk,
              iouThreshold,
              scoreThreshold,
              modelInputShape,
              handleDetectionComplete  // 传递回调函数
            );
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
                onClick={() => handleObjectSelect(idx)}
              >
                {obj.label} ({Math.round(obj.probability * 100)}%)
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="btn-container">
        <button onClick={() => inputImage.current.click()}>
          📁 Open local image
        </button>
        {image && (
          <button
            onClick={() => {
              inputImage.current.value = "";
              imageRef.current.src = "#";
              URL.revokeObjectURL(image);
              setImage(null);
              setDetectedObjects([]);
              setMatchedCards([]);
              setSelectedObject(null);
            }}
          >
            ❌ Close image
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
          setMatchedCards([]);
          setSelectedObject(null);
        }}
      />

      {/* 卡片库组件 */}
      <CardsGallery 
        matchedCards={matchedCards}
        onCardClick={handleCardClick}
        cardsData={cardsData}
        allCards={allCards}
      />
    </div>
  );
};

export default App;