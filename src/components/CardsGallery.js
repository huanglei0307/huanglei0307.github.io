import React, { useState } from "react";

const CardsGallery = ({ matchedCards, cardsData, allCards }) => {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" 
    ? allCards 
    : allCards.filter(c => c.class === filter);

  return (
    <div style={{ width: "100%", maxWidth: 1200, marginTop: 30, padding: 20, background: "white", borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
      <h3>📋 卡片库 ({allCards.length} 张)</h3>
      
      <div style={{ display: "flex", gap: 10, margin: "15px 0", flexWrap: "wrap" }}>
        <button onClick={() => setFilter("all")} style={{ padding: "5px 12px", background: filter === "all" ? "#007bff" : "#e9ecef", color: filter === "all" ? "white" : "#333", border: "none", borderRadius: 20, cursor: "pointer" }}>全部 ({allCards.length})</button>
        <button onClick={() => setFilter("airplane")} style={{ padding: "5px 12px", background: filter === "airplane" ? "#007bff" : "#e9ecef", color: filter === "airplane" ? "white" : "#333", border: "none", borderRadius: 20, cursor: "pointer" }}>✈️ 飞机 ({cardsData.airplane.length})</button>
        <button onClick={() => setFilter("helicopter")} style={{ padding: "5px 12px", background: filter === "helicopter" ? "#007bff" : "#e9ecef", color: filter === "helicopter" ? "white" : "#333", border: "none", borderRadius: 20, cursor: "pointer" }}>🚁 直升机 ({cardsData.helicopter.length})</button>
        <button onClick={() => setFilter("airship")} style={{ padding: "5px 12px", background: filter === "airship" ? "#007bff" : "#e9ecef", color: filter === "airship" ? "white" : "#333", border: "none", borderRadius: 20, cursor: "pointer" }}>🎈 飞艇 ({cardsData.airship.length})</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        {filtered.map(card => (
          <div key={card.id} style={{ background: "#f8f9fa", borderRadius: 8, padding: 10, textAlign: "center", border: matchedCards.some(m => m.id === card.id) ? "2px solid #28a745" : "none" }}>
            <div style={{ fontSize: 32 }}>{card.class === "airplane" ? "✈️" : card.class === "helicopter" ? "🚁" : "🎈"}</div>
            <div style={{ fontSize: 12, marginTop: 5 }}>{card.text}</div>
            <div style={{ fontSize: 10, color: "#666", marginTop: 3 }}>{card.class}</div>
            {matchedCards.some(m => m.id === card.id) && <div style={{ fontSize: 10, color: "#28a745", marginTop: 3 }}>✓ 匹配</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CardsGallery;