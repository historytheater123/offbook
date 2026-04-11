interface MicButtonProps {
  isListening: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function MicButton({ isListening, onToggle, disabled }: MicButtonProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      style={{
        width: 52, height: 52, minWidth: 52,
        background: isListening ? '#E53E3E' : '#1A1A1A',
        border: 'none',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        boxShadow: isListening ? '0 0 0 8px rgba(229,62,62,0.2)' : 'none',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background 0.2s',
      }}
      aria-label={isListening ? 'Stop recording' : 'Start recording'}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="9" y="2" width="6" height="11" rx="3" fill="white"/>
        <path d="M5 10a7 7 0 0014 0" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="12" y1="17" x2="12" y2="21" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="9" y1="21" x2="15" y2="21" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    </button>
  );
}
