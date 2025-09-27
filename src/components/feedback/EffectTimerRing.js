import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

import { hexToRgba } from '../../utils/color';

export const EffectTimerRing = ({ progress, colors, eff, size = 64, children, gradientColors }) => {
  const strokeWidth = Math.max(4, size * 0.14);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gradientId = useMemo(() => `effect-ring-${Math.random().toString(36).slice(2, 9)}`, []);
  const normalized = progress == null ? 1 : Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - normalized);
  const innerSize = size - strokeWidth * 1.6;
  const gradientPair =
    Array.isArray(gradientColors) && gradientColors.length >= 2
      ? gradientColors
      : [colors.sky, colors.emerald];
  const [gradientStart, gradientEnd] = gradientPair;
  const trackBase = Array.isArray(gradientColors) ? gradientStart : colors.text;
  const trackColor = hexToRgba(trackBase, eff === 'light' ? 0.16 : 0.4);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradientStart} stopOpacity="1" />
            <Stop offset="100%" stopColor={gradientEnd} stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference},${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View
        style={{
          position: 'absolute',
          top: (size - innerSize) / 2,
          left: (size - innerSize) / 2,
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: eff === 'light' ? hexToRgba(colors.surface, 0.98) : hexToRgba(colors.surface, 0.78),
          borderWidth: 1,
          borderColor: colors.surfaceBorder,
        }}
      >
        {children}
      </View>
    </View>
  );
};
