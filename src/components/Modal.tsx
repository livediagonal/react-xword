import React from 'react';
import './Modal.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type: 'success' | 'error';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, message, type }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className={`modal-content ${type}`}>
                <h2 className="modal-title">{title}</h2>
                <p className="modal-message">{message}</p>
                <button className="modal-button" onClick={onClose}>
                    {type === 'success' ? 'Celebrate!' : 'Continue Solving'}
                </button>
            </div>
        </div>
    );
};

export default Modal; 