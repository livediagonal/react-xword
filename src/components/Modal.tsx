import React, { useEffect } from 'react';
import './Modal.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAction?: () => void;
    title: string;
    message: string | React.ReactNode;
    type: 'success' | 'error' | 'start' | 'info';
    buttonText?: string;
    /** Optional React node to replace the default action button */
    actions?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onAction, title, message, type, buttonText, actions }) => {
    if (!isOpen) return null;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                onClose();
                onAction?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, onAction]);

    const getButtonText = () => {
        if (buttonText) return buttonText;
        switch (type) {
            case 'success':
                return 'Celebrate!';
            case 'error':
                return 'Continue Solving';
            case 'start':
                return 'Start';
            case 'info':
                return 'Close';
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
                <div className="modal-message">{message}</div>
                {actions ? (
                    actions
                ) : (
                    <button className="modal-button" onClick={() => {
                        onClose();
                        onAction?.();
                    }}>
                        {getButtonText()}
                    </button>
                )}
            </div>
        </div>
    );
};

export default Modal; 