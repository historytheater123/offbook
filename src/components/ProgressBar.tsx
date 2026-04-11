interface ProgressBarProps {
  value: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ value, color = '#1A1A1A', height = 4 }: ProgressBarProps) {
  return (
    <div style={{ height, background: '#E5E4E0', borderRadius: height, overflow: 'hidden', width: '100%' }}>
      <div
        style={{
          height: '100%',
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: color,
          borderRadius: height,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
}
