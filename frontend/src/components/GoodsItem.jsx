import React from 'react';

export default function GoodItem({ good, onView, onEdit, onDelete, isSeller, isAdmin }) {
    const formatPrice = (price) => {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    };

    const handleCardClick = () => {
        if (onView) {
            onView(good);
        }
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        if (onEdit) {
            onEdit(good);
        }
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete(good.id);
        }
    };

    const canEdit = isSeller || isAdmin;
    const canDelete = isAdmin;

    return (
        <div className="good-item" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
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
            
            <div className="good-actions" onClick={(e) => e.stopPropagation()}>
                {canEdit && (
                    <button 
                        className="btn btn--edit" 
                        onClick={handleEditClick}
                        title="Редактировать товар"
                    >
                        Редактировать
                    </button>
                )}
                {canDelete && (
                    <button 
                        className="btn btn--delete" 
                        onClick={handleDeleteClick}
                        title="Удалить товар"
                    >
                        Удалить
                    </button>
                )}
            </div>
        </div>
    );
}