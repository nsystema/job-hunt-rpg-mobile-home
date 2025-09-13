import { FileText, Target, Ghost, X } from "lucide-react";

export const Grey = 'rgba(148,163,184,.95)';

export const PLATFORMS = [
  'Company website','LinkedIn Jobs','Jobup','Indeed','Jobscout24','Monster','Jobtic','Tietalent','Stepstone','Glassdoor','JobCloud','Work.swiss'
];

export const STATUSES = [
  { key: 'Applied', icon: <FileText className="w-4 h-4" />, hint: 'Sent' },
  { key: 'Interview', icon: <Target className="w-4 h-4" />, hint: 'Stage' },
  { key: 'Ghosted', icon: <Ghost className="w-4 h-4" />, hint: 'No reply' },
  { key: 'Rejected', icon: <X className="w-4 h-4" />, hint: 'Closed' },
];
