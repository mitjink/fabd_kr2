import React, { useState, useEffect } from 'react';
import { productsAPI } from '../api/products';
import './ProductDetailModal.scss';

const ProductDetailModal = ({ isOpen, onClose, productId, onEdit, onDelete, isSeller, isAdmin }) => {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && productId) {
            loadProduct();
        }
    }, [isOpen, productId]);

    const loadProduct = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await productsAPI.getById(productId);
            setProduct(data);
        } catch (err) {
            console.error('Ошибка загрузки товара:', err);
            setError('Не удалось загрузить товар');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        if (onEdit && product) {
            onEdit(product);
            onClose();
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return;
        
        if (onDelete && productId) {
            await onDelete(productId);
            onClose();
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    };

    if (!isOpen) return null;

    return (
        <div className="product-detail-modal-overlay" onClick={onClose}>
            <div className="product-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Информация о товаре</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner-small"></div>
                            <p>Загрузка...</p>
                        </div>
                    ) : error ? (
                        <div className="error-state">
                            <p>{error}</p>
                        </div>
                    ) : product ? (
                        <>
                            <div className="product-image">
                                <div className="image-placeholder">
                                    {product.title?.[0] || ' '}
                                </div>
                            </div>
                            
                            <div className="product-info">
                                <div className="info-row">
                                    <label>Название:</label>
                                    <span className="product-title">{product.title}</span>
                                </div>
                                
                                <div className="info-row">
                                    <label>Категория:</label>
                                    <span className="product-category">{product.category || 'Другое'}</span>
                                </div>
                                
                                <div className="info-row">
                                    <label>Цена:</label>
                                    <span className="product-price">{formatPrice(product.price)}</span>
                                </div>
                                
                                <div className="info-row">
                                    <label>Описание:</label>
                                    <p className="product-description">{product.description || 'Нет описания'}</p>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>

                <div className="modal-footer">
                    {(isSeller || isAdmin) && product && (
                        <>
                            <button className="btn-edit" onClick={handleEdit}>
                                ✏️ Редактировать
                            </button>
                            {isAdmin && (
                                <button className="btn-delete" onClick={handleDelete}>
                                    🗑️ Удалить
                                </button>
                            )}
                        </>
                    )}
                    <button className="btn-close" onClick={onClose}>
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailModal;