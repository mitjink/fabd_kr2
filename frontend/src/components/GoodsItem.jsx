import React from 'react';

export default function GoodItem({ good, onEdit, onDelete }) {
    const formatPrice = (price) => {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    };

    return (
        <div className="good-item">
            <div className="good-image">
                <img 
                    src={good.imageUrl || '/images/default.jpg'} 
                    alt={good.title || good.name}
                    onError={(e) => {
                        e.target.src = '/images/default.jpg';
                    }}
                />
            </div>
            
            <div className="good-content">
                <div className="good-header">
                    <h3 className="good-name">{good.title || good.name}</h3>
                    <span className="good-category">{good.category || 'Другое'}</span>
                </div>
                
                <p className="good-description">
                    {good.description || 'Описание отсутствует'}
                </p>
                
                <div className="good-details">
                    <div className="good-price">
                        {formatPrice(good.price || good.cost || 0)}
                    </div>
                    <div className={`good-stock ${(good.stock || 0) < 5 ? 'low-stock' : ''}`}>
                        {good.stock > 0 ? `В наличии: ${good.stock} шт.` : 'Нет в наличии'}
                    </div>
                </div>
            </div>
            
            <div className="good-actions">
                <button 
                    className="btn btn--edit" 
                    onClick={() => onEdit(good)}
                    title="Редактировать товар"
                >
                    Редактировать
                </button>
                <button 
                    className="btn btn--delete" 
                    onClick={() => onDelete(good.id)}
                    title="Удалить товар"
                >
                    Удалить
                </button>
            </div>
        </div>
    );
}