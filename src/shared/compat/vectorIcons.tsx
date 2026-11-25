import React from 'react';
import { StyleProp, ViewStyle, View } from 'react-native';
import * as LucideIcons from 'lucide-react-native';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  solid?: boolean;
}

const ICON_MAP: Record<string, string> = {
  // Common icons
  'plus': 'Plus',
  'pencil': 'Pencil',
  'edit': 'Pencil',
  'send': 'Send',
  'chevron-right': 'ChevronRight',
  'chevron-left': 'ChevronLeft',
  'arrow-back': 'ArrowLeft',
  'check': 'Check',
  'close': 'X',
  'close-circle': 'XCircle',
  'user': 'User',
  'users': 'Users',
  'people': 'Users',
  'settings': 'Settings',
  'settings-outline': 'Settings',
  'search': 'Search',
  'add': 'Plus',
  'information-circle-outline': 'Info',
  'info': 'Info',
  'lock-closed': 'Lock',
  'lock': 'Lock',
  'checkmark-circle': 'CheckCircle2',
  'thumbs-up': 'ThumbsUp',
  'microphone': 'Mic',
  'mic': 'Mic',

  // Menu items
  'gift': 'Gift',
  'tasks': 'CheckSquare',
  'id-card': 'CreditCard',
  'store': 'Store',
  'wallet': 'Wallet',
  'medal': 'Medal',
  'bookmark': 'Bookmark',
  'gem': 'Gem',
  'ticket-alt': 'Ticket',
  'ticket': 'Ticket',
  'star': 'Star',
  'home': 'Home',
  'heart': 'Heart',
  'briefcase': 'Briefcase',
  'crown': 'Crown',
  'id-badge': 'BadgePercent',
  'level-up-alt': 'TrendingUp',
  'instagram': 'Camera',
  'logo-instagram': 'Camera',
  'facebook': 'Globe',
  'logo-facebook': 'Globe',
  'facebook-f': 'Globe',
  'google': 'Globe',
  'phone-alt': 'Phone',
  'share-alt': 'Share2',
  'share-social-outline': 'Share2',
  'headset': 'Headphones',
  'shield': 'Shield',
  'certificate': 'Award',
  'house-user': 'Building',
  'comment-dots': 'MessageSquare',
  'chatbubble-ellipses': 'MessageCircle',

  // Settings icons
  'person-circle-outline': 'UserRound',
  'person-circle': 'UserRound',
  'options-outline': 'SlidersHorizontal',
  'options': 'SlidersHorizontal',
  'shield-checkmark-outline': 'ShieldCheck',
  'shield-checkmark': 'ShieldCheck',
  'notifications-outline': 'Bell',
  'notifications': 'Bell',
  'chatbubble-outline': 'MessageSquare',
  'chatbubble': 'MessageSquare',
  'chatbubbles-outline': 'MessageSquare',
  'chatbubbles': 'MessageSquare',
  'person-remove-outline': 'UserX',
  'person-remove': 'UserX',
  'language-outline': 'Languages',
  'language': 'Languages',
  'earth-outline': 'Globe',
  'earth': 'Globe',
  'share-social': 'Share2',
  'refresh-circle-outline': 'RefreshCw',
  'refresh-circle': 'RefreshCw',
  'help-circle-outline': 'CircleHelp',
  'help-circle': 'CircleHelp',
  'document-text-outline': 'FileText',
  'document-text': 'FileText',
  'book-outline': 'BookOpen',
  'book': 'BookOpen',
  'information-circle': 'Info',
  'trash-outline': 'Trash2',
  'trash': 'Trash2',
  'chevron-forward': 'ChevronRight',
  'chevron-down': 'ChevronDown',
  'chevron-up': 'ChevronUp',
  'phone-portrait-outline': 'Smartphone',
  'phone-portrait': 'Smartphone',
  'rocket-outline': 'Rocket',
  'rocket': 'Rocket',
  'refresh': 'RefreshCw',
  'checkmark': 'Check',
  'mail': 'Mail',

  // Social & share
  'logo-whatsapp': 'MessageCircle',
  'logo-twitter': 'Share2',
  'mail-outline': 'Mail',
  'copy-outline': 'Copy',
  'logo-tiktok': 'Music',

  // TukTuk Pass icons
  'filter': 'ListFilter',
  'eye': 'Eye',
  'image': 'Image',
  'images': 'Image',
  'chatbox-ellipses': 'MessageSquare',
  'flash': 'Zap',
  'flash-outline': 'Zap',
  'ribbon': 'Award',
  'person-add': 'UserPlus',
  'location': 'MapPin',
  'albums': 'Layers',
  'flame': 'Flame',
  'calendar-outline': 'Calendar',
  'calendar': 'Calendar',
  'arrow-forward': 'ArrowRight',
  'gift-outline': 'Gift',
};

const renderIcon = (
  name: string,
  size: number,
  color: string,
  style?: StyleProp<ViewStyle>,
  solid?: boolean,
) => {
  const normalized = (name || '').toLowerCase().trim();
  const componentName = ICON_MAP[normalized] || 'Check';
  const IconComponent = (LucideIcons as any)[componentName] || LucideIcons.Check;

  const shouldFill =
    solid ||
    normalized === 'heart' ||
    (normalized === 'crown' && color.toLowerCase().includes('ffd700'));

  return (
    <View style={style}>
      <IconComponent
        size={size}
        color={color}
        strokeWidth={2}
        fill={shouldFill ? color : 'none'}
      />
    </View>
  );
};

export const FontAwesome: React.FC<IconProps> = ({ name, size = 20, color = 'white', style, solid }) =>
  renderIcon(name, size, color, style, solid);

export const FontAwesome5: React.FC<IconProps> = ({ name, size = 20, color = 'white', style, solid }) =>
  renderIcon(name, size, color, style, solid);

export const AntDesign: React.FC<IconProps> = ({ name, size = 20, color = 'white', style, solid }) =>
  renderIcon(name, size, color, style, solid);

export const Ionicons: React.FC<IconProps> = ({ name, size = 20, color = 'white', style, solid }) =>
  renderIcon(name, size, color, style, solid);

export default { FontAwesome, FontAwesome5, AntDesign, Ionicons };

