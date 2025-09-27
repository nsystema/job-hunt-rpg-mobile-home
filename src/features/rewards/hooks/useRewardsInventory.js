import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { computePotential, formatRange, rand, RARITIES } from '../utils/chests';

const DEFAULT_FILTER = 'All';

const getRarityKeys = () => [DEFAULT_FILTER, ...RARITIES.map((entry) => entry.key)];

export const useRewardsInventory = ({ goldMultiplier = 1, setGold } = {}) => {
  const [chests, setChests] = useState([]);
  const [chestFilter, setChestFilter] = useState(DEFAULT_FILTER);
  const [focusedChestId, setFocusedChestId] = useState(null);
  const [openAllSummary, setOpenAllSummary] = useState(null);
  const [openResult, setOpenResult] = useState(null);
  const openResultTimer = useRef(null);

  const rarityMeta = useMemo(() => {
    const counts = { All: chests.length };
    RARITIES.forEach((entry) => {
      counts[entry.key] = 0;
    });
    chests.forEach((chest) => {
      const key = chest?.rarity || 'Common';
      counts[key] = (counts[key] || 0) + 1;
    });
    return {
      counts,
      keys: getRarityKeys(),
    };
  }, [chests]);

  const visibleChests = useMemo(() => {
    if (chestFilter === DEFAULT_FILTER) {
      return chests;
    }
    return chests.filter((item) => (item?.rarity || 'Common') === chestFilter);
  }, [chests, chestFilter]);

  const totalPotential = useMemo(() => computePotential(chests), [chests]);
  const viewRange = useMemo(
    () => (totalPotential ? `${formatRange(totalPotential)}g` : '0g'),
    [totalPotential],
  );

  const addGold = useCallback(
    (amount) => {
      if (typeof setGold !== 'function' || !Number.isFinite(amount) || amount === 0) {
        return;
      }
      setGold((value) => value + amount);
    },
    [setGold],
  );

  const rollGold = useCallback((range) => {
    if (Array.isArray(range)) {
      return rand(range);
    }
    const value = Number(range);
    return Number.isFinite(value) ? value : 0;
  }, []);

  const openChest = useCallback(
    (chest) => {
      if (!chest) {
        return null;
      }
      const base = rollGold(chest.gold);
      const totalGold = Math.round(base * goldMultiplier);
      addGold(totalGold);
      setChests((prev) => prev.filter((item) => item.id !== chest.id));
      setFocusedChestId(null);
      setOpenResult({ gold: totalGold });
      if (openResultTimer.current) {
        clearTimeout(openResultTimer.current);
      }
      openResultTimer.current = setTimeout(() => {
        setOpenResult(null);
      }, 1600);
      return { gold: totalGold };
    },
    [addGold, goldMultiplier, rollGold],
  );

  const openAll = useCallback(() => {
    if (!chests.length) {
      return;
    }
    let totalGold = 0;
    chests.forEach((item) => {
      totalGold += Math.round(rollGold(item.gold) * goldMultiplier);
    });
    addGold(totalGold);
    setChests([]);
    setFocusedChestId(null);
    setOpenAllSummary({ gold: totalGold, opened: chests.length });
  }, [addGold, chests, goldMultiplier, rollGold]);

  const dismissOpenAllSummary = useCallback(() => {
    setOpenAllSummary(null);
  }, []);

  const dismissOpenResult = useCallback(() => {
    if (openResultTimer.current) {
      clearTimeout(openResultTimer.current);
      openResultTimer.current = null;
    }
    setOpenResult(null);
  }, []);

  useEffect(() => {
    return () => {
      if (openResultTimer.current) {
        clearTimeout(openResultTimer.current);
        openResultTimer.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (focusedChestId != null && !chests.some((item) => item.id === focusedChestId)) {
      setFocusedChestId(null);
    }
  }, [chests, focusedChestId]);

  return {
    chests,
    setChests,
    chestFilter,
    setChestFilter,
    focusedChestId,
    setFocusedChestId,
    openChest,
    openAll,
    openAllSummary,
    dismissOpenAllSummary,
    openResult,
    dismissOpenResult,
    rarityCounts: rarityMeta.counts,
    rarityKeys: rarityMeta.keys,
    visibleChests,
    hasChests: chests.length > 0,
    viewRange,
    totalPotential,
  };
};

export default useRewardsInventory;
