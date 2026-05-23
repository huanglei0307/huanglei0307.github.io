// src/hooks/useCardSearch.js
import { useState, useRef, useEffect } from 'react';
import { cosineSimilarity } from '../utils/cosineSimilarity';

export const useCardSearch = (initialCards) => { 
    const [cards, setCards] = useState(
        initialCards.map(card => ({ ...card, score: 0, isVisible: true }))
    );
    
    const [imageEmbedding, setImageEmbedding] = useState(null);
    const [ready, setReady] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    
    const workerRef = useRef(null);

    useEffect(() => {
        workerRef.current = new Worker(new URL('../workers/search.worker.js', import.meta.url), {
            type: 'module'
        });

        workerRef.current.onmessage = (e) => {
            const { type, data } = e.data;

            switch (type) {
                case 'progress':
                    setProgress(data.progress || 0);
                    if (data.status === 'ready') {
                        setReady(true);
                        setLoading(false);
                    }
                    break;
                
                case 'text_embeddings_ready':
                    setCards(prev => prev.map(card => ({
                        ...card,
                        embedding: data[card.id],
                        isVisible: true
                    })));
                    setReady(true);
                    setLoading(false);
                    break;

                case 'image_embedding_ready':
                    setImageEmbedding(data);
                    break;
            }
        };

        workerRef.current.postMessage({ type: 'init', data: initialCards });

        return () => workerRef.current?.terminate();
    }, [initialCards]);

    useEffect(() => {
        if (!imageEmbedding) return;

        setCards(prevCards => {
            if (!prevCards[0]?.embedding) return prevCards;

            const threshold = 0.1;

            const processed = prevCards.map(card => {
                if (!card.embedding) return { ...card, score: 0, isVisible: false };
                
                const similarity = cosineSimilarity(imageEmbedding, card.embedding);
                
                return {
                    ...card,
                    score: similarity,
                    isVisible: similarity > threshold
                };
            });

            processed.sort((a, b) => b.score - a.score);
            
            return processed;
        });

    }, [imageEmbedding]);

    const searchByImage = (file) => {
        workerRef.current?.postMessage({ type: 'image', data: file });
    };

    const resetSearch = () => {
        setImageEmbedding(null);
        setCards(prev => {
            const sortedById = [...prev].sort((a, b) => a.id - b.id);
            return sortedById.map(card => ({
                ...card,
                score: 0,
                isVisible: true
            }));
        });
    };

    return {
        cards,
        ready,
        progress,
        loading,
        imageEmbedding,
        searchByImage,
        resetSearch
    };
};