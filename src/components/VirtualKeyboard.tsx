import React from 'react';
import '../styles/VirtualKeyboard.css';

interface VirtualKeyboardProps {
    onKeyPress: (key: string) => void;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ onKeyPress }) => {
    // Adjusted rows for better layout
    const rows = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ''],
        ['', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫', ''],
    ];

    const handleKeyPress = (key: string) => {
        if (key === '⌫') {
            // Handle backspace
            onKeyPress('');
        } else if (key === '' || key === ' ') {
            // Ignore spacer keys
            return;
        } else {
            onKeyPress(key);
        }
    };

    const handleTouchStart = (e: React.TouchEvent, key: string) => {
        // Prevent default to avoid any unwanted behavior
        e.preventDefault();

        // Skip for spacer keys
        if (key === '' || key === ' ') return;

        // Get the element
        const el = e.currentTarget;
        // Add active class
        el.classList.add('key-active');
    };

    const handleTouchEnd = (e: React.TouchEvent, key: string) => {
        // Prevent default
        e.preventDefault();

        // Skip for spacer keys
        if (key === '' || key === ' ') return;

        // Get the element
        const el = e.currentTarget;
        // Remove active class
        el.classList.remove('key-active');

        // Trigger the key press
        handleKeyPress(key);
    };

    return (
        <div className="virtual-keyboard">
            {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="keyboard-row">
                    {row.map((key, keyIndex) => (
                        <button
                            key={`${key}-${keyIndex}`}
                            className={`keyboard-key ${key === '⌫' ? 'backspace-key' : ''} ${key === '' || key === ' ' ? 'spacer-key' : ''}`}
                            onClick={() => handleKeyPress(key)}
                            onTouchStart={(e) => handleTouchStart(e, key)}
                            onTouchEnd={(e) => handleTouchEnd(e, key)}
                            onTouchCancel={(e) => e.currentTarget.classList.remove('key-active')}
                            disabled={key === '' || key === ' '}
                            aria-hidden={key === '' || key === ' '}
                        >
                            {key}
                        </button>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default VirtualKeyboard; 