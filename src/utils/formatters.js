const pad = (value) => String(value).padStart(2, '0');

export const formatGoldValue = (value) =>
  Math.max(0, value).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });

export const formatGold = (value) => `${formatGoldValue(value)}g`;

export const formatEffectDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  if (seconds >= 3600) {
    const hours = Math.round(seconds / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes >= 1) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  const rounded = Math.round(seconds);
  return `${rounded} second${rounded === 1 ? '' : 's'}`;
};

export const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`
    : `${pad(minutes)}:${pad(remainingSeconds)}`;
};
