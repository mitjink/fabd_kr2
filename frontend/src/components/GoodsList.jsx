import React from 'react';
import GoodItem from './GoodsItem';

export default function GoodsList({ goods, onEdit, onDelete, onView, isSeller, isAdmin }) {
    if (!goods || goods.length === 0) {
        return (
            <div className="empty-list">
                <p>Товаров пока нет</p>
                {isSeller && <p>Нажмите "Добавить товар", чтобы создать первый товар</p>}
            </div>
        );
    }

    return (
        <div className="goods-list">
            {goods.map(good => (
                <GoodItem
                    key={good.id}
                    good={good}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isSeller={isSeller}
                    isAdmin={isAdmin}
                />
            ))}
        </div>
    );
}