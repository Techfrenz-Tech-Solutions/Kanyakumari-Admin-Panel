// Lightweight inline icon set (stroke-based, currentColor) — no external
// icon package dependency, keeps the bundle small and styling trivial.
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
};

const Svg = (paths) => (props) => (
  <svg {...base} {...props}>{paths}</svg>
);

export const Grid = Svg(<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>);
export const Newspaper = Svg(<><path d="M4 4h13a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /><path d="M18 8h3v11a2 2 0 0 1-2 2H6" /><line x1="7" y1="8" x2="12" y2="8" /><line x1="7" y1="12" x2="14" y2="12" /><line x1="7" y1="16" x2="14" y2="16" /></>);
export const Tag = Svg(<><path d="M20.5 12.5 12 21l-9-9V5a2 2 0 0 1 2-2h7l8.5 8.5a2 2 0 0 1 0 2Z" /><circle cx="7.5" cy="7.5" r="1.2" /></>);
export const Users = Svg(<><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c.7-3.5 3.3-5.5 6.5-5.5s5.8 2 6.5 5.5" /><circle cx="17" cy="8" r="2.6" /><path d="M17.5 14.6c2.4.5 4 2.3 4.5 5.4" /></>);
export const Image = Svg(<><rect x="3" y="3" width="18" height="18" rx="2.5" /><circle cx="8.5" cy="8.5" r="1.6" /><path d="m21 15-5-5-9 9" /></>);
export const Megaphone = Svg(<><path d="M3 11v2a2 2 0 0 0 2 2h1l1 5h2l-1-5h3l7 4V6l-7 4H6a2 2 0 0 0-2 2" transform="translate(0,-1.2)" /></>);
export const MessageSquare = Svg(<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />);
export const ShieldCheck = Svg(<><path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>);
export const BarChart2 = Svg(<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>);
export const Settings = Svg(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></>);
export const LogOut = Svg(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>);
export const Search = Svg(<><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.6" y2="16.6" /></>);
export const Bell = Svg(<><path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 21a2 2 0 0 0 4 0" /></>);
export const ChevronDown = Svg(<polyline points="6 9 12 15 18 9" />);
export const ChevronLeft = Svg(<polyline points="15 18 9 12 15 6" />);
export const ChevronRight = Svg(<polyline points="9 18 15 12 9 6" />);
export const Menu = Svg(<><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>);
export const PanelLeftClose = Svg(<><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="9" y1="4" x2="9" y2="20" /><polyline points="14 9 11 12 14 15" /></>);
export const PanelLeftOpen = Svg(<><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="9" y1="4" x2="9" y2="20" /><polyline points="12 9 15 12 12 15" /></>);
export const Sun = Svg(<><circle cx="12" cy="12" r="4.2" /><line x1="12" y1="1.5" x2="12" y2="3.7" /><line x1="12" y1="20.3" x2="12" y2="22.5" /><line x1="4.2" y1="4.2" x2="5.8" y2="5.8" /><line x1="18.2" y1="18.2" x2="19.8" y2="19.8" /><line x1="1.5" y1="12" x2="3.7" y2="12" /><line x1="20.3" y1="12" x2="22.5" y2="12" /><line x1="4.2" y1="19.8" x2="5.8" y2="18.2" /><line x1="18.2" y1="5.8" x2="19.8" y2="4.2" /></>);
export const Moon = Svg(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />);
export const Plus = Svg(<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>);
export const Edit2 = Svg(<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>);
export const Trash2 = Svg(<><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></>);
export const Eye = Svg(<><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" /><circle cx="12" cy="12" r="3" /></>);
export const X = Svg(<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>);
export const CheckCircle = Svg(<><circle cx="12" cy="12" r="9" /><polyline points="8.5 12.5 11 15 15.5 9" /></>);
export const XCircle = Svg(<><circle cx="12" cy="12" r="9" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" /></>);
export const Info = Svg(<><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /><circle cx="12" cy="8" r="0.6" fill="currentColor" /></>);
export const AlertTriangle = Svg(<><path d="M10.3 3.9 1.9 18.5A1.5 1.5 0 0 0 3.2 21h17.6a1.5 1.5 0 0 0 1.3-2.5L13.7 3.9a1.5 1.5 0 0 0-2.6 0Z" /><line x1="12" y1="9.5" x2="12" y2="13.5" /><circle cx="12" cy="16.8" r="0.6" fill="currentColor" /></>);
export const Upload = Svg(<><path d="M12 16V4" /><polyline points="7 8.5 12 3.5 17 8.5" /><path d="M4 16.5V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.5" /></>);
export const Filter = Svg(<polygon points="4 4 20 4 14 12.5 14 19 10 21 10 12.5 4 4" />);
export const ArrowUpRight = Svg(<><line x1="7" y1="17" x2="17" y2="7" /><polyline points="8 7 17 7 17 16" /></>);
export const ArrowDownRight = Svg(<><line x1="7" y1="7" x2="17" y2="17" /><polyline points="17 8 17 17 8 17" /></>);
export const Zap = Svg(<polygon points="13 2 3 14 11 14 10 22 21 10 13 10 13 2" />);
export const MapPin = Svg(<><path d="M20 10.5c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10.5" r="2.6" /></>);
export const Calendar = Svg(<><rect x="3" y="4.5" width="18" height="17" rx="2" /><line x1="16" y1="2.5" x2="16" y2="6.5" /><line x1="8" y1="2.5" x2="8" y2="6.5" /><line x1="3" y1="10" x2="21" y2="10" /></>);
export const Clock = Svg(<><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></>);
export const Save = Svg(<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><polyline points="7 3 7 8 15 8" /><rect x="7" y="13" width="10" height="8" /></>);
export const Send = Svg(<><line x1="21" y1="3" x2="10.5" y2="13.5" /><polygon points="21 3 14 21 10.5 13.5 3 10 21 3" /></>);
export const MoreVertical = Svg(<><circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" /></>);
export const TrendingUp = Svg(<><polyline points="3 17 9.5 10.5 14 15 21 7" /><polyline points="14 7 21 7 21 14" /></>);
export const FileText = Svg(<><path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="15" y2="16" /></>);
export const Inbox = Svg(<><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6Z" /></>);
export const User = Svg(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.2-4 4.5-6 8-6s6.8 2 8 6" /></>);
export const Star = Svg(<polygon points="12 2.5 15.1 8.9 22 9.9 17 14.8 18.2 21.7 12 18.4 5.8 21.7 7 14.8 2 9.9 8.9 8.9" />);
export const Globe = Svg(<><circle cx="12" cy="12" r="9" /><line x1="3" y1="12" x2="21" y2="12" /><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" /></>);
export const Link2 = Svg(<><path d="M9.5 14.5 14.5 9.5" /><path d="M11.5 6 13 4.5a3.5 3.5 0 0 1 5 5L16.5 11" /><path d="M12.5 18 11 19.5a3.5 3.5 0 0 1-5-5L7.5 13" /></>);
export const RefreshCw = Svg(<><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.5 9a8.5 8.5 0 0 1 14-3.4L23 10M1 14l5.5 4.4A8.5 8.5 0 0 0 20.5 15" /></>);
export const Layers = Svg(<><polygon points="12 2 22 8 12 14 2 8" /><polyline points="2 15 12 21 22 15" /><polyline points="2 11.5 12 17.5 22 11.5" /></>);
export const Lock = Svg(<><rect x="4" y="10.5" width="16" height="10.5" rx="2" /><path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" /></>);
export const Mail = Svg(<><rect x="2.5" y="4.5" width="19" height="15" rx="2" /><polyline points="3 6 12 13 21 6" /></>);

export const Video = Svg(<><rect x="2" y="7" width="13" height="10" rx="2" /><polygon points="17 7 22 4.5 22 19.5 17 17" /></>);
export const Play = Svg(<polygon points="5 3 19 12 5 21 5 3" />);
export const Gallery = Svg(<><rect x="3" y="3" width="18" height="18" rx="2.5" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5-9 9" /></>);
export const Radio = Svg(<><circle cx="12" cy="12" r="2" /><path d="M16.2 7.8a7 7 0 0 1 0 8.4M19.8 4.2a12 12 0 0 1 0 15.6M7.8 16.2a7 7 0 0 1 0-8.4M4.2 19.8a12 12 0 0 1 0-15.6" /></>);
export const MapPinned = Svg(<><path d="M20 10.5c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10.5" r="2.6" fill="currentColor" /></>);
export const Rss = Svg(<><path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1" fill="currentColor" /></>);
export const Activity = Svg(<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />);
export const ClipboardList = Svg(<><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><line x1="9" y1="11" x2="15" y2="11" /><line x1="9" y1="15" x2="13" y2="15" /></>);
export const PenSquare = Svg(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z" /></>);
export const List = Svg(<><line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" /><line x1="4" y1="6" x2="4.01" y2="6" /><line x1="4" y1="12" x2="4.01" y2="12" /><line x1="4" y1="18" x2="4.01" y2="18" /></>);
export const LayoutGrid = Svg(<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>);
export const ChevronUp = Svg(<polyline points="18 15 12 9 6 15" />);
export const ExternalLink = Svg(<><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></>);
export const Copy = Svg(<><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>);
export const Download = Svg(<><path d="M12 16V4" /><polyline points="17 11 12 16 7 11" /><path d="M4 16.5V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.5" /></>);
export const MoreHorizontal = Svg(<><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>);
export const CheckSquare = Svg(<><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>);
export const Smartphone = Svg(<><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></>);
export const Monitor = Svg(<><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>);
export const Tablet = Svg(<><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></>);
export const TrendingDown = Svg(<><polyline points="3 7 9.5 13.5 14 9 21 17" /><polyline points="14 17 21 17 21 10" /></>);
export const Award = Svg(<><circle cx="12" cy="8" r="6" /><path d="M8.2 13.8 7 22l5-3 5 3-1.2-8.2" /></>);
export const Printer = Svg(<><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></>);
export const FileSpreadsheet = Svg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /><line x1="8" y1="9" x2="10" y2="9" /></>);
export const Hash = Svg(<><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" /></>);
export const PieChart = Svg(<><path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-3.5-3.8-6-7.4-5.8-3.2.1-6 2.3-6.6 5.5-.6 3.5 1.6 6.8 4.9 7.8 1.2.3 2.4.3 3.6-.1" /><path d="M12 8v4l2.7 1.6" /></>);
export const BoldIcon = Svg(<><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /></>);
export const ItalicIcon = Svg(<><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></>);
export const UnderlineIcon = Svg(<><path d="M6 3v7a6 6 0 0 0 12 0V3" /><line x1="4" y1="21" x2="20" y2="21" /></>);
export const AlignLeft = Svg(<><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" /></>);
export const Quote = Svg(<><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1Z" /><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1Z" /></>);
export const Columns = Svg(<><rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="3" width="7" height="18" rx="1" /></>);
export const Move = Svg(<><polyline points="5 9 2 12 5 15" /><polyline points="9 5 12 2 15 5" /><polyline points="15 19 12 22 9 19" /><polyline points="19 9 22 12 19 15" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" /></>);
export const FlameIcon = Svg(<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z" />);
export const NewspaperIcon = Svg(<><path d="M4 4h13a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /><path d="M18 8h3v11a2 2 0 0 1-2 2H6" /><line x1="7" y1="8" x2="12" y2="8" /><line x1="7" y1="12" x2="14" y2="12" /><line x1="7" y1="16" x2="14" y2="16" /></>);
export const Pencil = Svg(<><path d="M17 3a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>);
export const Building = Svg(<><rect x="4" y="2" width="16" height="20" rx="1" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" /></>);
export const Clock3 = Svg(<><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 16 12" /></>);
export const CheckCheck = Svg(<><path d="M18 6 7 17l-5-5" /><path d="m22 10-7.5 7.5L13 16" /></>);
export const Briefcase = Svg(<><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><line x1="12" y1="12" x2="12" y2="12.01" /><path d="M2 12h20" /></>);
