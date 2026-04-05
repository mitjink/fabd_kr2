import React from 'react';
import GoodItem from './GoodsItem';

export default function GoodsList({ goods, onEdit, onDelete }) {
    if (!goods || goods.length === 0) {
        return (
            <div className="empty-list">
                Товаров пока нет
                <br />
                <small>Нажмите кнопку "Добавить товар" чтобы создать первый товар</small>
            </div>
        );
    }

    return (
        <div className="goods-list">
            {goods.map(good => (
                <GoodItem 
                    key={good.id} 
                    good={good} 
                    onEdit={onEdit} 
                    onDelete={onDelete} 
                />
            ))}
        </div>
    );
}