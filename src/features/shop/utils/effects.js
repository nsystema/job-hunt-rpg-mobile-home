export const SPRAY_DEBUFF_DURATION_MS = 6 * 60 * 60 * 1000;
export const SPRAY_DEBUFF_DURATION_SECONDS = SPRAY_DEBUFF_DURATION_MS / 1000;

export const isSprayDebuffActive = (sprayDebuff, currentTime) => {
  if (!sprayDebuff) {
    return false;
  }
  const { expiresAt } = sprayDebuff;
  if (!expiresAt) {
    return true;
  }
  const now = Number.isFinite(currentTime) ? currentTime : Date.now();
  return expiresAt > now;
};

export const resolveSprayExpiresAt = (sprayDebuff) => {
  if (!sprayDebuff) {
    return undefined;
  }
  if (sprayDebuff.expiresAt) {
    return sprayDebuff.expiresAt;
  }
  if (sprayDebuff.activatedAt) {
    return sprayDebuff.activatedAt + SPRAY_DEBUFF_DURATION_MS;
  }
  return undefined;
};

export const createSprayEffectDetails = (sprayDebuff) => {
  if (!sprayDebuff) {
    return null;
  }
  return {
    id: 'spray-and-pray',
    name: 'Spray and Pray',
    icon: 'spray-bottle',
    description: 'XP and gold from applications are halved for six hours.',
    expiresAt: resolveSprayExpiresAt(sprayDebuff),
    duration: SPRAY_DEBUFF_DURATION_SECONDS,
    type: 'debuff',
  };
};

export const includeSprayEffect = (effects, sprayEffectDetails) => {
  if (!sprayEffectDetails) {
    return effects;
  }
  return [sprayEffectDetails, ...effects];
};

export const shouldClearSprayDebuff = (sprayDebuff, currentTime) => {
  if (!sprayDebuff || !sprayDebuff.expiresAt) {
    return false;
  }
  const now = Number.isFinite(currentTime) ? currentTime : Date.now();
  return sprayDebuff.expiresAt <= now;
};
