import Svg, { Circle } from 'react-native-svg';

export const ActivityProgressRing = ({ progress = 0, accent, trackColor }) => {
  const size = 28;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalized =
    typeof progress === 'number' && !Number.isNaN(progress)
      ? Math.max(0, Math.min(1, progress))
      : 0;
  const normalizedAccent = accent || '#38bdf8';
  const normalizedTrack = trackColor || 'rgba(148,163,184,0.3)';
  const offset = circumference * (1 - normalized);

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={normalizedTrack}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={normalizedAccent}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </Svg>
  );
};
