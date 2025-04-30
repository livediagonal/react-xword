import React from 'react';
import './Modal.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type: 'success' | 'error' | 'start';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, message, type }) => {
    if (!isOpen) return null;

    const getButtonText = () => {
        switch (type) {
            case 'success':
                return 'Celebrate!';
            case 'error':
                return 'Continue Solving';
            case 'start':
                return 'Start';
            default:
                return 'Close';
        }
    };

    return (
        <div className="modal-overlay">
            <div className={`modal-content ${type}`}>
                <h2 className="modal-title">{title}</h2>
                <p className="modal-message">{message}</p>
                <button className="modal-button" onClick={onClose}>
                    {getButtonText()}
                </button>
            </div>
        </div>
    );
};

export default Modal; 