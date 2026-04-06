import React, { useState, useEffect } from 'react';
import { usersAPI } from '../api/users';
import './ProfileModal.scss';

const ProfileModal = ({ isOpen, onClose, userData, onUpdate }) => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (userData) {
            setFormData({
                first_name: userData.first_name || '',
                last_name: userData.last_name || '',
                email: userData.email || ''
            });
        }
    }, [userData]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        
        try {
            await onUpdate(formData);
            setMessage({ type: 'success', text: 'Профиль успешно обновлен!' });
            setIsEditing(false);
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Ошибка обновления профиля' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="profile-modal-overlay" onClick={onClose}>
            <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
                <div className="profile-modal-header">
                    <h2>Мой профиль</h2>
                    <button className="profile-modal-close" onClick={onClose}>×</button>
                </div>
                
                <div className="profile-modal-body">
                    <div className="profile-view">
                        <div className="profile-avatar">
                            {userData?.first_name?.[0]}{userData?.last_name?.[0]}
                        </div>
                        
                        <div className="profile-info">
                            <div className="info-row">
                                <label>Имя:</label>
                                <span>{userData?.first_name}</span>
                            </div>
                            <div className="info-row">
                                <label>Фамилия:</label>
                                <span>{userData?.last_name}</span>
                            </div>
                            <div className="info-row">
                                <label>Email:</label>
                                <span>{userData?.email}</span>
                            </div>
                            <div className="info-row">
                                <label>Роль:</label>
                                <span className={`role-badge role-${userData?.role}`}>
                                    {userData?.role === 'admin' ? 'Администратор' : 
                                        userData?.role === 'seller' ? 'Продавец' : 'Пользователь'}
                                </span>
                            </div>
                            <div className="info-row">
                                <label>Дата регистрации:</label>
                                <span>{userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('ru-RU') : '—'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;