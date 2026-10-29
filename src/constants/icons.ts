import {
  AccessTimeRounded, AccountBalanceOutlined, CalendarMonthRounded, BarChartRounded,
  CheckCircleOutlineRounded, CodeRounded, CoffeeOutlined, EmojiEventsOutlined,
  ExtensionOutlined, FavoriteBorderRounded, FlagOutlined, HelpOutlineRounded,
  HomeOutlined, InfoOutlined, LanguageRounded, LightbulbOutlined, LocalFireDepartmentOutlined,
  LockOutlined, MailOutlineRounded, MenuBookRounded, MusicNoteRounded, NatureOutlined,
  PersonOutlineRounded, PhotoCameraOutlined, PushPinOutlined, RocketLaunchOutlined,
  ScienceOutlined, SmartphoneOutlined, StarRounded, TrackChangesRounded, WarningAmberRounded,
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';
import { NodeIcon, NodePriority } from '../types';

export const NODE_ICON_COMPONENTS: Record<NodeIcon, SvgIconComponent | null> = {
  none: null,
  star: StarRounded,
  check: CheckCircleOutlineRounded,
  warning: WarningAmberRounded,
  info: InfoOutlined,
  idea: LightbulbOutlined,
  question: HelpOutlineRounded,
  flag: FlagOutlined,
  heart: FavoriteBorderRounded,
  fire: LocalFireDepartmentOutlined,
  lock: LockOutlined,
  person: PersonOutlineRounded,
  clock: AccessTimeRounded,
  target: TrackChangesRounded,
  book: MenuBookRounded,
  chart: BarChartRounded,
  code: CodeRounded,
  globe: LanguageRounded,
  mail: MailOutlineRounded,
  pin: PushPinOutlined,
  calendar: CalendarMonthRounded,
  trophy: EmojiEventsOutlined,
  leaf: NatureOutlined,
  building: AccountBalanceOutlined,
  camera: PhotoCameraOutlined,
  music: MusicNoteRounded,
  rocket: RocketLaunchOutlined,
  puzzle: ExtensionOutlined,
  lab: ScienceOutlined,
  coffee: CoffeeOutlined,
  home: HomeOutlined,
  phone: SmartphoneOutlined,
};

export const ICON_LABELS: Record<NodeIcon, string> = {
  none: 'Aucune',
  star: 'Favori',
  check: 'Validé',
  warning: 'Attention',
  info: 'Information',
  idea: 'Idée',
  question: 'Question',
  flag: 'À repérer',
  heart: 'Important',
  fire: 'Urgent',
  lock: 'Confidentiel',
  person: 'Personne',
  clock: 'Délai',
  target: 'Objectif',
  book: 'Livre',
  chart: 'Données',
  code: 'Code',
  globe: 'Web',
  mail: 'Message',
  pin: 'Épinglé',
  calendar: 'Événement',
  trophy: 'Réussite',
  leaf: 'Nature',
  building: 'Lieu',
  camera: 'Image',
  music: 'Musique',
  rocket: 'Lancement',
  puzzle: 'À résoudre',
  lab: 'Expérience',
  coffee: 'Pause',
  home: 'Maison',
  phone: 'Téléphone',
};

// ─── Priority styles ───────────────────────────────────────────────────────────

export const PRIORITY_CONFIG: Record<NodePriority, { label: string; color: string; dot: string }> = {
  none:     { label: 'Aucune',    color: 'transparent', dot: '' },
  low:      { label: 'Faible',   color: '#22c55e',     dot: '●' },
  medium:   { label: 'Moyenne',  color: '#f59e0b',     dot: '●' },
  high:     { label: 'Haute',    color: '#ef4444',     dot: '●' },
  critical: { label: 'Critique', color: '#7c3aed',     dot: '◆' },
};

// Icon categories for the picker
export const ICON_CATEGORIES = {
  'Repères': ['star', 'check', 'warning', 'info', 'question', 'flag', 'pin'] as NodeIcon[],
  'Idées et objectifs': ['idea', 'target'] as NodeIcon[],
  'Études et projets': ['book', 'chart', 'code', 'globe', 'mail'] as NodeIcon[],
  'Personnes et organisation': ['person', 'heart', 'clock', 'calendar', 'lock'] as NodeIcon[],
};
