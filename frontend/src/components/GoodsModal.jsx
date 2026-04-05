import React, { useEffect, useState } from 'react';

export default function GoodModal({ open, mode, initialGood, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        title: '',
        price: '',
        category: '',
        description: '',
        stock: '',
        imageUrl: ''
    });

    useEffect(() => {
        if (open && initialGood) {
            setFormData({
                title: initialGood.title || initialGood.name || '',
                price: initialGood.price || initialGood.cost || '',
                category: initialGood.category || '',
                description: initialGood.description || '',
                stock: initialGood.stock || '',
                imageUrl: initialGood.imageUrl || ''
            });
        } else if (open) {
            setFormData({
                title: '',
                price: '',
                category: '',
                description: '',
                stock: '',
                imageUrl: ''
            });
        }
    }, [open, initialGood]);

    if (!open) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!formData.title.trim()) {
            alert('Введите название товара');
            return;
        }
        if (!formData.price || parseFloat(formData.price) <= 0) {
            alert('Введите корректную цену');
            return;
        }

        const submitData = {
            title: formData.title,
            price: parseFloat(formData.price),
            category: formData.category.trim() || 'Другое',
            description: formData.description || '',
            stock: parseInt(formData.stock) || 0,
            imageUrl: formData.imageUrl || '/images/default.jpg'
        };

        if (mode === 'edit' && initialGood) {
            submitData.id = initialGood.id;
        }

        onSubmit(submitData);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{mode === 'edit' ? 'Редактировать товар' : 'Добавить товар'}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Название товара</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Например, Ноутбук"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Цена (руб)</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="1000"
                                min="0"
                                step="1"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Количество на складе</label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                placeholder="0"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Категория</label>
                        <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            placeholder="Например: Электроника, Аксессуары, Аудио"
                        />
                    </div>

                    <div className="form-group">
                        <label>URL изображения</label>
                        <input
                            type="text"
                            name="imageUrl"
                            value={formData.imageUrl}
                            onChange={handleChange}
                            placeholder="/images/laptop.jpg"
                        />
                    </div>

                    <div className="form-group">
                        <label>Описание</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Описание товара..."
                            rows="3"
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn--secondary" onClick={onClose}>
                            Отмена
                        </button>
                        <button type="submit" className="btn btn--primary">
                            {mode === 'edit' ? 'Сохранить' : 'Создать'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}