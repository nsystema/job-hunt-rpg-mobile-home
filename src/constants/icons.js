import * as LucideIcons from 'lucide-react-native';

const fallback = LucideIcons.HelpCircle;

export const getIconComponent = (name) => {
  if (!name) return fallback;
  const Icon = LucideIcons[name];
  return Icon || fallback;
};

export const iconColor = '#e2e8f0';
