export const GREY_TEXT = 'rgba(148, 163, 184, 0.95)';

export const PLATFORMS = [
  'Company website',
  'LinkedIn Jobs',
  'Jobup',
  'Indeed',
  'Jobscout24',
  'Monster',
  'Jobtic',
  'Tietalent',
  'Stepstone',
  'Glassdoor',
  'JobCloud',
  'Work.swiss'
];

export const STATUSES = [
  { key: 'Applied', icon: 'FileText', hint: 'Sent application' },
  { key: 'Interview', icon: 'Target', hint: 'In interview process' },
  { key: 'Ghosted', icon: 'Ghost', hint: 'No response yet' },
  { key: 'Rejected', icon: 'X', hint: 'Application closed' }
];

export const TABS = [
  { key: 'Daily', icon: 'CalendarCheck2' },
  { key: 'Weekly', icon: 'CalendarClock' },
  { key: 'Growth', icon: 'Target' },
  { key: 'Events', icon: 'Sparkles' }
];

export const QUESTS = {
  Daily: [
    {
      id: 'd1',
      title: 'Log 3 applications',
      desc: 'Keep the momentum going',
      goal: 3,
      xp: 40,
      gold: 8
    },
    {
      id: 'd2',
      title: 'Network with a recruiter',
      desc: 'Reach out and say hi',
      goal: 1,
      xp: 30,
      gold: 6
    }
  ],
  Weekly: [
    {
      id: 'w1',
      title: 'Complete 10 applications',
      desc: 'Consistency is king',
      goal: 10,
      xp: 120,
      gold: 30
    },
    {
      id: 'w2',
      title: 'Secure 2 interviews',
      desc: 'Show them your skills',
      goal: 2,
      xp: 150,
      gold: 50
    }
  ],
  Growth: [
    {
      id: 'g1',
      title: 'Earn a new certification',
      desc: 'Invest in your skills',
      goal: 1,
      xp: 300,
      gold: 80
    }
  ],
  Events: [
    {
      id: 'e1',
      title: 'Seasonal hiring boost',
      desc: 'Limited-time event quest',
      goal: 1,
      xp: 200,
      gold: 60
    }
  ]
};
