import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productsAPI } from '../api/products';
import GoodsList from '../components/GoodsList';
import GoodModal from '../components/GoodsModal';
import ProductDetailModal from '../components/ProductDetailModal';
import ProfileModal from '../components/ProfileModal';
import { authAPI } from '../api/auth';
import './GoodsPage.scss';

export default function GoodsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [editingProduct, setEditingProduct] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const isSeller = user?.role === 'seller' || user?.role === 'admin';
    const isAdmin = user?.role === 'admin';
    
    useEffect(() => {
        if (user) {
            loadProducts();
        }
    }, [user]);
    
    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await productsAPI.getAll();
            setProducts(data);
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            if (error.response?.status === 401) {
                logout();
                navigate('/login');
            } else {
                alert('Не удалось загрузить товары');
            }
        } finally {
            setLoading(false);
        }
    };
    
    const openDetailModal = (product) => {
        setSelectedProductId(product.id);
        setDetailModalOpen(true);
    };
    
    const openCreateModal = () => {
        setModalMode('create');
        setEditingProduct(null);
        setModalOpen(true);
    };
    
    const openEditModal = (product) => {
        setModalMode('edit');
        setEditingProduct(product);
        setModalOpen(true);
        setDetailModalOpen(false);
    };

    const openProfileModal = async () => {
        try {
            const data = await authAPI.meInfo();
            setUserData(data);
            setProfileModalOpen(true);
        } catch (error) {
            console.error('Ошибка загрузки профиля:', error);
        }
    };
    
    const closeModal = () => {
        setModalOpen(false);
        setEditingProduct(null);
    };
    
    const handleDelete = async (id) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return;
        
        try {
            await productsAPI.delete(id);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error('Ошибка удаления:', error);
            alert('Не удалось удалить товар');
        }
    };
    
    const handleSubmit = async (productData) => {
        try {
            if (modalMode === 'create') {
                const newProduct = await productsAPI.create(productData);
                setProducts(prev => [...prev, newProduct]);
            } else {
                const updatedProduct = await productsAPI.update(productData.id, productData);
                setProducts(prev => prev.map(p => 
                    p.id === productData.id ? updatedProduct : p
                ));
            }
            closeModal();
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('Не удалось сохранить товар');
        }
    };
    
    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };
    
    return (
        <div className="page">
            <header className="header">
                <div className="container">
                    <div className="header__inner">
                        <h1 className="logo">Интернет-магазин</h1>
                        <div className="header__right">
                            <div className="user-info">
                                <span className="user-name">
                                    {user?.first_name} {user?.last_name}
                                </span>
                                <span className="user-role">({user?.role})</span>
                            </div>
                            <button className="btn btn--profile" onClick={openProfileModal}>Мой профиль</button>
                            <button className="btn btn--logout" onClick={handleLogout}>
                                Выйти
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            
            <main className="main">
                <div className="container">
                    <div className="toolbar">
                        <div className="toolbar__left">
                            <h2>Каталог товаров</h2>
                            {isAdmin && (
                                <button 
                                    className="btn btn--admin" 
                                    onClick={() => navigate('/users')}
                                >
                                    Управление пользователями
                                </button>
                            )}
                        </div>
                        {isSeller && (
                            <button className="btn btn--primary" onClick={openCreateModal}>
                                Добавить товар
                            </button>
                        )}
                    </div>
                    
                    {loading ? (
                        <div className="loading">
                            <div className="spinner"></div>
                            <p>Загрузка товаров...</p>
                        </div>
                    ) : (
                        <GoodsList 
                            goods={products}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                            onView={openDetailModal}
                            isSeller={isSeller}
                            isAdmin={isAdmin}
                        />
                    )}
                </div>
            </main>
            
            <footer className="footer">
                <div className="container">
                    <div className="footer__inner">
                        <p>2026 Интернет-магазин. Все права защищены.</p>
                    </div>
                </div>
            </footer>
            
            <GoodModal
                open={modalOpen}
                mode={modalMode}
                initialGood={editingProduct}
                onClose={closeModal}
                onSubmit={handleSubmit}
            />
            
            <ProductDetailModal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                productId={selectedProductId}
                onEdit={openEditModal}
                onDelete={handleDelete}
                isSeller={isSeller}
                isAdmin={isAdmin}
            />

            <ProfileModal
                isOpen={profileModalOpen}
                onClose={() => setProfileModalOpen(false)}
                userData={userData}
            />
        </div>
    );
}