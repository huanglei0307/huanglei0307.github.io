import React, { useState, useEffect } from 'react';
import { allCards } from '../utils/cardsData';
import '../style/CardsGallery.css';

const CardsGallery = ({ matchedCards, onCardClick }) => {
  const [selectedClass, setSelectedClass] = useState('all');
  
  const filteredCards = selectedClass === 'all' 
    ? allCards 
    : allCards.filter(card => card.class === selectedClass);
  
  return (
    <div className="cards-gallery">
      <div className="gallery-header">
        <h3>📋 卡片库（每个类别至少10张）</h3>
        <div className="class-filters">
          <button 
            className={selectedClass === 'all' ? 'active' : ''}
            onClick={() => setSelectedClass('all')}
          >
            全部 ({allCards.length})
          </button>
          <button 
            className={selectedClass === 'airplane' ? 'active' : ''}
            onClick={() => setSelectedClass('airplane')}
          >
            ✈️ 飞机 ({allCards.filter(c => c.class === 'airplane').length})
          </button>
          <button 
            className={selectedClass === 'helicopter' ? 'active' : ''}
            onClick={() => setSelectedClass('helicopter')}
          >
            🚁 直升机 ({allCards.filter(c => c.class === 'helicopter').length})
          </button>
          <button 
            className={selectedClass === 'airship' ? 'active' : ''}
            onClick={() => setSelectedClass('airship')}
          >
            🎈 飞艇 ({allCards.filter(c => c.class === 'airship').length})
          </button>
        </div>
      </div>
      
      {/* 匹配结果提示 */}
      {matchedCards && matchedCards.length > 0 && (
        <div className="match-result">
          <h4>🔍 CLIP 匹配结果（基于分割出的物体）</h4>
          <div className="matched-cards">
            {matchedCards.map((card, idx) => (
              <div key={idx} className="matched-card">
                <span className="similarity">{Math.round(card.similarity * 100)}%</span>
                <span className="card-text">{card.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 所有卡片网格 */}
      <div className="cards-grid">
        {filteredCards.map(card => (
          <div 
            key={card.id} 
            className="card-item"
            onClick={() => onCardClick && onCardClick(card)}
          >
            <div className="card-placeholder">
              🖼️
            </div>
            <div className="card-text">{card.text}</div>
            <div className="card-class">{card.class}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CardsGallery;