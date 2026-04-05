import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../api/users';
import './UsersPage.scss';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);  
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    useEffect(() => {
        if (user?.role !== 'admin') {
            navigate('/');
            return;
        }
        loadUsers();
    }, [user]);
    
    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await usersAPI.getAll();
            setUsers(data);
        } catch (error) {
            console.error('Ошибка загрузки пользователей:', error);
            if (error.response?.status === 403) {
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };
    
    const handleRoleChange = async (userId, newRole) => {
        try {
            await usersAPI.update(userId, { role: newRole });
            loadUsers();
        } catch (error) {
            console.error('Ошибка изменения роли:', error);
            alert('Не удалось изменить роль');
        }
    };
    
    const handleBlockUser = async (userId) => {
        if (!window.confirm('Заблокировать пользователя?')) return;
        try {
            await usersAPI.block(userId);
            loadUsers();
        } catch (error) {
            console.error('Ошибка блокировки:', error);
            alert('Не удалось заблокировать пользователя');
        }
    };
        const handleUserClick = async (userId) => {
        try {
            const userData = await usersAPI.getById(userId);
            setSelectedUser(userData);
            setShowModal(true);
        } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
            alert('Не удалось загрузить данные пользователя');
        }
    };
    
    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };
    
    if (user?.role !== 'admin') {
        return null;
    }
    
    return (
        <div className="users-page">
            <header className="header">
                <div className="container">
                    <div className="header__inner">
                        <h1 className="logo">Управление пользователями</h1>
                        <div className="header__right">
                            <span className="user-name">{user?.first_name} {user?.last_name}</span>
                            <button className="btn btn--logout" onClick={handleLogout}>Выйти</button>
                        </div>
                    </div>
                </div>
            </header>
            
            <main className="main">
                <div className="container">
                    <div className="toolbar">
                        <h2>Список пользователей</h2>
                        <button className="btn btn--secondary" onClick={() => navigate('/')}>
                            Назад к товарам
                        </button>
                    </div>
                    
                    {loading ? (
                        <div className="loading">Загрузка...</div>
                    ) : (
                        <div className="users-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Имя</th>
                                        <th>Email</th>
                                        <th>Роль</th>
                                        <th>Статус</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr 
                                            key={u.id} 
                                            className={u.isBlocked ? 'blocked' : ''}
                                            onClick={() => handleUserClick(u.id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td>{u.id}</td>
                                            <td>{u.first_name} {u.last_name}</td>
                                            <td>{u.email}</td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <select 
                                                    value={u.role} 
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                    disabled={u.id === user.id}
                                                >
                                                    <option value="user">Пользователь</option>
                                                    <option value="seller">Продавец</option>
                                                    <option value="admin">Администратор</option>
                                                </select>
                                            </td>
                                            <td>{u.isBlocked ? 'Заблокирован' : 'Активен'}</td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                {!u.isBlocked && u.id !== user.id && (
                                                    <button 
                                                        className="btn btn--danger" 
                                                        onClick={() => handleBlockUser(u.id)}
                                                    >
                                                        Заблокировать
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {showModal && selectedUser && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Информация о пользователе</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="user-detail">
                                <label>ID:</label>
                                <span>{selectedUser.id}</span>
                            </div>
                            <div className="user-detail">
                                <label>Имя:</label>
                                <span>{selectedUser.first_name} {selectedUser.last_name}</span>
                            </div>
                            <div className="user-detail">
                                <label>Email:</label>
                                <span>{selectedUser.email}</span>
                            </div>
                            <div className="user-detail">
                                <label>Роль:</label>
                                <span>
                                    {selectedUser.role === 'admin' ? 'Администратор' : 
                                     selectedUser.role === 'seller' ? 'Продавец' : 'Пользователь'}
                                </span>
                            </div>
                            <div className="user-detail">
                                <label>Статус:</label>
                                <span className={selectedUser.isBlocked ? 'blocked' : 'active'}>
                                    {selectedUser.isBlocked ? 'Заблокирован' : 'Активен'}
                                </span>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--secondary" onClick={() => setShowModal(false)}>
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}