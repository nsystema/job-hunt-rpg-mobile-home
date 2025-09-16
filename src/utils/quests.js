export const countUnclaimedQuests = (quests, claimed = []) => {
  const claimedSet = new Set(claimed);
  return Object.values(quests)
    .flat()
    .filter((quest) => quest.progress >= quest.goal && !claimedSet.has(quest.id)).length;
};

export const countUnclaimedByTab = (quests, tab, claimed = []) => {
  const claimedSet = new Set(claimed);
  return (quests[tab] || []).filter(
    (quest) => quest.progress >= quest.goal && !claimedSet.has(quest.id)
  ).length;
};

export const isQuestClaimable = (quest, claimed = []) => {
  const claimedSet = new Set(claimed);
  return quest.progress >= quest.goal && !claimedSet.has(quest.id);
};
