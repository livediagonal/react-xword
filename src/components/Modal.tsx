import React from 'react';
import './Modal.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAction?: () => void;
    title: string;
    message: string;
    type: 'success' | 'error' | 'start';
    buttonText?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onAction, title, message, type, buttonText }) => {
    if (!isOpen) return null;

    const getButtonText = () => {
        if (buttonText) return buttonText;
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

    const handleOverlayClick = (e: React.MouseEvent) => {
        // Only close if the click was directly on the overlay
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className={`modal-content ${type}`} onClick={e => e.stopPropagation()}>
                <h2 className="modal-title">{title}</h2>
                <p className="modal-message">{message}</p>
                <button className="modal-button" onClick={() => {
                    onClose();
                    onAction?.();
                }}>
                    {getButtonText()}
                </button>
            </div>
        </div>
    );
};

export default Modal; 