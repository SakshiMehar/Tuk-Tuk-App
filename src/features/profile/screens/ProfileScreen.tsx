import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ImageStyle,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useScrollToTop } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackground } from '@shared/components';
import { BackpackPanel } from '../components/panels/BackpackPanel';
import { StorePanel } from '../components/panels/StorePanel';
import { HelpMenu } from '../modals/HelpMenu';
import { DiamondRechargeModal } from '../../home/modals/DiamondRechargeModal';
import { FamilyChatModal } from '../modals/FamilyChatModal';
import { GetRewardsPanel } from '../components/panels/GetRewardsPanel';
import { MonthlyCardPanel } from '../components/panels/MonthlyCardPanel';
import { PremiumPanel } from '../components/panels/PremiumPanel';
import { ProfileAvatarWithFrame } from '../components/ProfileAvatarWithFrame/ProfileAvatarWithFrame';
import { ProfileConnectionsModal } from '../modals/ProfileConnectionsModal';
import { RoomPremiumPanel } from '../components/panels/RoomPremiumPanel';
import { TukTukPassPanel } from '../components/panels/TukTukPassPanel';
import { UserLevelPanel } from '../components/panels/UserLevelPanel';
import { VipCenterPanel } from '../components/panels/VipCenterPanel';
import { HonorLevelModal } from '../modals/HonorLevelModal';
import { WalletRechargeSection } from '../components/panels/WalletRechargeSection';

import { refreshTokenCache } from '../../../api/axios';
import { getGiftsReceived, getGiftsSent } from '../../../api/giftApi';
import {
  APP_BG,
  APP_CARD,
  APP_CARD_BORDER,
  APP_PURPLE,
  APP_TEXT,
  APP_TEXT_DIM,
  APP_TEXT_MUTED,
  DIAMOND_ICON_URL,
} from '../../../constants/theme';
import { VIP_PROFILE_FRAME_LAYOUT } from '../../../constants/vip';
import { useUserOnlineOrLiveStatus } from '../../../utils/liveStatus';
import { wsService } from '../../../services/websocket';
import {
  avatarMap,
  DEFAULT_AVATAR_ID,
  getAvatarOptionsForGender,
  getAvatarSource,
} from '../../../data/avatarOptions';
import { useWalletBalance } from '../../../hooks/useWalletBalance';
import { fetchUserDecorations } from '../../../services/decorationsService';
import {
  createFamilyGroup,
  joinFamilyGroup,
  loadFamilyDetail,
  loadFamilyLists,
} from '../../../services/familyService';
import {
  fetchSavedUsersFromServer,
  removeFavoriteUser,
} from '../../../services/favoritesService';
import { loadMyProfile, saveMyProfile } from '../../../services/meProfileService';
import {
  loadMyProfilePosts,
  updateMyPostDescription,
  resolveMediaUrl,
} from '../../../services/myPostsService';
import { syncNewUserFrameForSession } from '../../../services/newUserFrameService';
import { loadProfileStats } from '../../../services/profileStatsService';
import {
  claimedTasksDiamondTotal,
  claimRewardTask,
  loadDailyTasks,
  tasksTotalReward,
} from '../../../services/rewardTaskService';
import { useMyCountryFlag } from '../../../services/userCountryService';
import { syncUserLevelForSession } from '../../../services/userLevelService';
import { submitFeedback } from '../../../services/userSettingsService';
import { loadMyVipAssets, VipAssets } from '../../../services/vipService';
import { loadMyPremiumAssets } from '../../../services/premiumService';
import { getUser, updateUser } from '../../../store/authStore';
import { refreshWalletBalance } from '../../../store/walletStore';
import { openUserChat } from '../../../utils/chatNavigation';
import { resolveLocalLevelBadge } from '../../../utils/levelBadge';
import { resolveProfileAvatarSource } from '../../../utils/profileAvatar';
import { ms, s } from '../../../utils/responsive';
import { resolveImageSource } from '../../../utils/videoSource';

let ImagePicker: any = null;
try {
  ImagePicker = require('expo-image-picker');
} catch {}

const screen = Dimensions.get('window');

const S3_BASE = 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets';
const meHeroAsset = require('@assets/images/me_hero.png');
const boyHeroAsset = require('@assets/images/boy_hero.png');
const meImg = { uri: `${S3_BASE}/images/me.png` };
const boyMeImg = { uri: `${S3_BASE}/images/boyme.png` };
const NEW_START_BADGE = { uri: `${S3_BASE}/Batches/newstart-batch.png` };
const OWNER_BADGE = { uri: `${S3_BASE}/Batches/owner-batch.png` };
const VERIFIED_BADGE = { uri: `${S3_BASE}/Batches/verified-batch.png` };
const HONOR_BADGE = { uri: `${S3_BASE}/level/level1.png` };
const VIP8_BADGE = { uri: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip8/Viplogo8.png' };
const DEFAULT_OWNER_FRAME = 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/special-frame/tuk-tuk-owner-frame.png';

// Dummy gifts for UI preview until API data is populated
const DUMMY_GIFTS_RECEIVED = [
  {
    id: 'dummy-r1',
    name: 'Purple Wand',
    localImage: { uri: `${S3_BASE}/Gift/gift1.png` },
    quantity: 1,
    senderName: 'Sakshi',
  },
  {
    id: 'dummy-r2',
    name: 'Love Balloon',
    localImage: { uri: `${S3_BASE}/Gift/gift2.png` },
    quantity: 1,
    senderName: 'Rahul',
  },
  {
    id: 'dummy-r3',
    name: 'Wood Elephant',
    localImage: { uri: `${S3_BASE}/Gift/gift3.png` },
    quantity: 1,
    senderName: 'Amit',
  },
  {
    id: 'dummy-r4',
    name: 'Rose',
    localImage: { uri: `${S3_BASE}/Gift/gift1.png` },
    quantity: 1,
    senderName: 'Priya',
  },
  {
    id: 'dummy-r5',
    name: 'Cricket Kit',
    localImage: { uri: `${S3_BASE}/Gift/gift2.png` },
    quantity: 2,
    senderName: 'Vikram',
  },
];

const DUMMY_GIFTS_SENT = [
  {
    id: 'dummy-s1',
    name: 'Rose',
    localImage: { uri: `${S3_BASE}/Gift/gift1.png` },
    quantity: 3,
    receiverName: 'Sakshi',
  },
  {
    id: 'dummy-s2',
    name: 'Love Balloon',
    localImage: { uri: `${S3_BASE}/Gift/gift2.png` },
    quantity: 1,
    receiverName: 'Priya',
  },
  {
    id: 'dummy-s3',
    name: 'Wood Elephant',
    localImage: { uri: `${S3_BASE}/Gift/gift3.png` },
    quantity: 1,
    receiverName: 'Rahul',
  },
];

const PROFILE_BADGE_HEIGHT = s(24);
const PROFILE_BADGE_ASPECT = {
  level: 142 / 149,
  newStar: 456 / 174,
  verified: 438 / 179,
  vip: 1,
};

interface ProfileBadgeProps {
  source: any;
  aspectRatio: number;
  style?: StyleProp<ImageStyle>;
}

function ProfileBadge({ source, aspectRatio, style }: ProfileBadgeProps) {
  return (
    <Image
      source={source}
      style={[
        { height: PROFILE_BADGE_HEIGHT, width: PROFILE_BADGE_HEIGHT * aspectRatio },
        style,
      ]}
      resizeMode="contain"
    />
  );
}

const menuPages = [
  [
    { icon: 'gift', label: 'Get Rewards', badge: true },
    { icon: 'tasks', label: 'Task', badge: true },
    { icon: 'id-card', label: 'Monthly Card', badge: true },
    { icon: 'store', label: 'Store', badge: true },
    { icon: 'users', label: 'Relationship', badge: true },
    { icon: 'wallet', label: 'Wallet', badge: false },
    { icon: 'medal', label: 'Premium', badge: true },
    { icon: 'bookmark', label: 'Saved', badge: false },
  ],
  [
    { icon: 'gem', label: 'VIP', badge: false },
    { icon: 'ticket-alt', label: 'Coupon', badge: false },
    { icon: 'star', label: 'Honor Level', badge: false },
    { icon: 'home', label: 'Family', badge: false },
    { icon: 'heart', label: 'Matchmaker', badge: true },
    { icon: 'briefcase', label: 'Backpack', badge: false },
    { icon: 'crown', label: 'Room\nPremium', badge: true },
    { icon: 'id-badge', label: 'TukTuk Pass', badge: true },
  ],
  [
    { icon: 'level-up-alt', label: 'Level', badge: true },
    { icon: 'instagram', label: 'Instagram', badge: false },
    { icon: 'facebook', label: 'Facebook', badge: false },
    { icon: 'share-alt', label: 'Share', badge: false },
    { icon: 'headset', label: 'Help', badge: true },
    { icon: 'shield', label: 'Room Badge', badge: true },
    { icon: 'certificate', label: 'Badge', badge: true },
    { icon: 'house-user', label: 'Room Title', badge: false },
  ],
  [
    { icon: 'comment-dots', label: 'Feedback', badge: false },
    { icon: 'briefcase', label: 'Job', badge: false },
  ],
];

const BOTTOM_TABS = ['Moment', 'Profile', 'Honor', 'Gift'];

// ── Menu Grid Custom SVG Icons Matching Uploaded Design ──
function GetRewardsIcon({ size = 26, color = '#7C3AED' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 7.5H7.5A2.5 2.5 0 0 1 5 5a2.5 2.5 0 0 1 2.5-2.5c2.5 0 4.5 5 4.5 5z"
        fill={color}
      />
      <Path
        d="M12 7.5h4.5A2.5 2.5 0 0 0 19 5a2.5 2.5 0 0 0-2.5-2.5c-2.5 0-4.5 5-4.5 5z"
        fill={color}
      />
      <Rect x="3" y="7.5" width="18" height="4.5" rx="1.5" fill={color} />
      <Path
        d="M4.5 12h15v8a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-8z"
        fill={color}
      />
      <Rect x="10.75" y="7.5" width="2.5" height="14.5" fill="#FFFFFF" />
    </Svg>
  );
}

function TaskIcon({ size = 26, color = '#7C3AED' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="6" r="2.2" fill={color} />
      <Rect x="9.5" y="4.8" width="10.5" height="2.4" rx="1.2" fill={color} />
      <Circle cx="5" cy="12" r="2.2" fill={color} />
      <Rect x="9.5" y="10.8" width="10.5" height="2.4" rx="1.2" fill={color} />
      <Circle cx="5" cy="18" r="2.2" fill={color} />
      <Rect x="9.5" y="16.8" width="10.5" height="2.4" rx="1.2" fill={color} />
    </Svg>
  );
}

function MonthlyCardIcon({ size = 26, color = '#7C3AED' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2.5" y="4.5" width="19" height="15" rx="3" fill={color} />
      <Rect x="5" y="7.5" width="5.5" height="5.5" rx="1" fill="#FFFFFF" />
      <Rect x="12.5" y="8" width="6.5" height="2" rx="1" fill="#FFFFFF" />
      <Rect x="12.5" y="11.5" width="4.5" height="2" rx="1" fill="#FFFFFF" />
    </Svg>
  );
}

function StoreIcon({ size = 26, color = '#7C3AED' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.5 9.5l1.8-5.5h13.4l1.8 5.5v1a2.8 2.8 0 0 1-5.6 0 2.8 2.8 0 0 1-5.6 0 2.8 2.8 0 0 1-5.8 0v-1z"
        fill={color}
      />
      <Path
        d="M4.5 12.5h15v7.5a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5v-7.5z"
        fill={color}
      />
      <Rect x="9" y="15" width="6" height="6.5" rx="1" fill="#FFFFFF" />
    </Svg>
  );
}

function RelationshipIcon({ size = 26, color = '#7C3AED' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7" r="3" fill={color} />
      <Path d="M7 18a5 5 0 0 1 10 0v1H7v-1z" fill={color} />
      <Circle cx="5.5" cy="9" r="2.2" fill={color} opacity={0.85} />
      <Path d="M1.5 18a3.5 3.5 0 0 1 5-2.2v1.5a4.8 4.8 0 0 0-3.5.7h-1.5z" fill={color} opacity={0.85} />
      <Circle cx="18.5" cy="9" r="2.2" fill={color} opacity={0.85} />
      <Path d="M17.5 15.8a3.5 3.5 0 0 1 5 2.2h-1.5a4.8 4.8 0 0 0-3.5-.7v-1.5z" fill={color} opacity={0.85} />
    </Svg>
  );
}

function WalletIcon({ size = 26, color = '#7C3AED' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2.5" y="6" width="19" height="13" rx="3" fill={color} />
      <Rect x="15" y="9.5" width="6.5" height="6" rx="2" fill="#FFFFFF" />
      <Circle cx="18" cy="12.5" r="1.2" fill={color} />
    </Svg>
  );
}

function PremiumIcon({ size = 26, color = '#7C3AED' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 14.5L6.5 21l5.5-2.5 5.5 2.5-1.5-6.5" fill={color} />
      <Circle cx="12" cy="9.5" r="6.5" fill={color} />
      <Path
        d="M12 5.5l1.2 2.5 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

function SavedIcon({ size = 26, color = '#7C3AED' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v17l-7-4-7 4V4z"
        fill={color}
      />
    </Svg>
  );
}

function VerifyMicIcon({ size = 14, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="8.5" y="2" width="7" height="12" rx="3.5" stroke={color} strokeWidth="2.2" />
      <Path d="M4.5 10.5C4.5 14.64 7.86 18 12 18s7.5-3.36 7.5-7.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M12 18v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M8.5 22h7" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function renderMenuIcon(item: any, isPressed: boolean) {
  const color = isPressed ? '#5b21b6' : '#7c3aed';
  switch (item.label) {
    case 'Get Rewards':
      return <GetRewardsIcon size={26} color={color} />;
    case 'Task':
      return <TaskIcon size={26} color={color} />;
    case 'Monthly Card':
      return <MonthlyCardIcon size={26} color={color} />;
    case 'Store':
      return <StoreIcon size={26} color={color} />;
    case 'Relationship':
      return <RelationshipIcon size={26} color={color} />;
    case 'Wallet':
      return <WalletIcon size={26} color={color} />;
    case 'Premium':
      return <PremiumIcon size={26} color={color} />;
    case 'Saved':
      return <SavedIcon size={26} color={color} />;
    default:
      return (
        <FontAwesome5
          name={item.icon}
          size={22}
          color={color}
          solid
        />
      );
  }
}

function MenuGridButton({ item, onPress }: { item: any; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuGridItem, pressed && styles.menuGridItemPressed]}
    >
      {({ pressed }) => (
        <>
          <View style={[styles.menuIconBox, pressed && styles.menuIconBoxPressed]}>
            {renderMenuIcon(item, pressed)}
          </View>
          <Text style={[styles.menuGridLabel, pressed && styles.menuGridLabelPressed]}>
            {item.label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const FAMILY_TABS = ['New family', 'Existing family'];
const DEFAULT_FAMILY_ICON = require('@assets/images/icon.png');

function FamilyContent() {
  const [familyTab, setFamilyTab] = useState('New family');
  const [familySearch, setFamilySearch] = useState('');
  const [showFamilySearch, setShowFamilySearch] = useState(false);
  const [showCreateRules, setShowCreateRules] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [familyAnnouncement, setFamilyAnnouncement] = useState('');
  const [familyCover, setFamilyCover] = useState<string | null>(null);
  const [existingFamilies, setExistingFamilies] = useState<any[]>([]);
  const [newFamilies, setNewFamilies] = useState<any[]>([]);
  const [familiesLoading, setFamiliesLoading] = useState(true);
  const [creatingFamily, setCreatingFamily] = useState(false);
  const [chatFamily, setChatFamily] = useState<any>(null);
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom, 8);

  const refreshFamilies = useCallback(async () => {
    setFamiliesLoading(true);
    try {
      const { existingFamilies: existing, newFamilies: created } = await loadFamilyLists();
      setExistingFamilies(existing);
      setNewFamilies(created);
    } catch (error) {
      console.error('[FamilyContent] Failed to load families', error);
    } finally {
      setFamiliesLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFamilies();
  }, [refreshFamilies]);

  const pickFamilyCover = useCallback(async () => {
    if (!ImagePicker) {
      Alert.alert('Notice', 'Image picker is not available on this platform.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery access is required to set a family cover.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) {
      setFamilyCover(result.assets[0].uri);
    }
  }, []);

  const handleJoinFamily = useCallback(async (family: any) => {
    try {
      await joinFamilyGroup(family.id);
      Alert.alert('Joined', `You've joined ${family.name}.`);
      refreshFamilies();
    } catch (error: any) {
      console.error('[FamilyContent] joinFamily failed', error);
      Alert.alert("Couldn't join", error?.message || 'Please try again.');
    }
  }, [refreshFamilies]);

  const handleOpenFamily = useCallback(async (family: any) => {
    try {
      const detail = await loadFamilyDetail(family.id);
      setChatFamily(detail);
    } catch {
      setChatFamily(family);
    }
  }, []);

  const handleCreateFamily = useCallback(async () => {
    if (!familyName.trim() || creatingFamily) return;
    setCreatingFamily(true);
    try {
      await createFamilyGroup({
        name: familyName.trim(),
        announcement: familyAnnouncement.trim(),
        coverUri: familyCover,
      });
      setShowCreateForm(false);
      setFamilyTab('New family');
      setFamilyName('');
      setFamilyAnnouncement('');
      setFamilyCover(null);
      await refreshFamilies();
      await refreshWalletBalance();
    } catch (error: any) {
      console.error('[FamilyContent] createFamily failed', error);
      Alert.alert("Couldn't create family", error?.message || 'Please try again.');
    } finally {
      setCreatingFamily(false);
    }
  }, [familyName, familyAnnouncement, familyCover, creatingFamily, refreshFamilies]);

  const allFamilies = familyTab === 'Existing family' ? existingFamilies : newFamilies;
  const families = allFamilies.filter((f) =>
    f.name.toLowerCase().includes(familySearch.toLowerCase())
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Tab row + search icon */}
      <View style={familyStyles.tabRow}>
        {FAMILY_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={familyStyles.tabItem}
            activeOpacity={0.8}
            onPress={() => { setFamilyTab(tab); setShowFamilySearch(false); setFamilySearch(''); }}
          >
            <Text style={[familyStyles.tabText, familyTab === tab && familyStyles.tabTextActive]}>
              {tab}
            </Text>
            {familyTab === tab && <View style={familyStyles.tabUnderline} />}
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={familyStyles.searchIcon}
          activeOpacity={0.8}
          onPress={() => setShowFamilySearch((v) => !v)}
        >
          <Ionicons name="search" size={20} color={showFamilySearch ? '#a78bfa' : 'rgba(255,255,255,0.65)'} />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      {showFamilySearch && (
        <View style={familyStyles.searchBar}>
          <Ionicons name="search" size={15} color="rgba(255,255,255,0.35)" style={{ marginRight: 6 }} />
          <TextInput
            style={familyStyles.searchInput}
            placeholder="Search family..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={familySearch}
            onChangeText={setFamilySearch}
            autoFocus
          />
          {familySearch.length > 0 && (
            <TouchableOpacity onPress={() => setFamilySearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={15} color="rgba(255,255,255,0.35)" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* List */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={familyStyles.listContent}
        keyboardShouldPersistTaps="handled"
      >
        {familiesLoading ? (
          <View style={familyStyles.emptyWrap}>
            <ActivityIndicator color="#a78bfa" />
          </View>
        ) : families.length === 0 ? (
          <View style={familyStyles.emptyWrap}>
            <Text style={{ fontSize: 48, marginBottom: 10 }}>👪</Text>
            <Text style={familyStyles.emptyText}>No families found</Text>
          </View>
        ) : (
          families.map((family) => (
            <TouchableOpacity
              key={family.id}
              style={familyStyles.card}
              activeOpacity={0.85}
              onPress={() => handleOpenFamily(family)}
            >
              <View style={familyStyles.iconWrap}>
                <Image
                  source={family.icon ? { uri: family.icon } : DEFAULT_FAMILY_ICON}
                  style={familyStyles.icon}
                />
              </View>
              <View style={familyStyles.info}>
                <View style={familyStyles.nameRow}>
                  <Text style={familyStyles.name} numberOfLines={1}>{family.name}</Text>
                  {family.tag && (
                    <View style={familyStyles.officialBadge}>
                      <Text style={familyStyles.officialText}>{family.tag}</Text>
                    </View>
                  )}
                </View>
                <View style={familyStyles.metaRow}>
                  <Ionicons name="people" size={12} color="rgba(255,255,255,0.45)" />
                  <Text style={familyStyles.meta}>{family.members} members</Text>
                  <View style={familyStyles.dot} />
                  <Text style={familyStyles.meta}>Lv.{family.level}</Text>
                </View>
              </View>
              {family.owner ? (
                <View style={[familyStyles.joinBtn, familyStyles.joinedBtn]}>
                  <Text style={familyStyles.joinedText}>Owner</Text>
                </View>
              ) : family.member ? (
                <View style={[familyStyles.joinBtn, familyStyles.joinedBtn]}>
                  <Text style={familyStyles.joinedText}>Joined</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={familyStyles.joinBtn}
                  activeOpacity={0.8}
                  onPress={() => handleJoinFamily(family)}
                >
                  <Text style={familyStyles.joinText}>Join</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Create Family sticky button */}
      <View style={[familyStyles.createWrap, { paddingBottom: safeBottom + 12 }]}>
        <TouchableOpacity style={familyStyles.createBtn} activeOpacity={0.85} onPress={() => setShowCreateRules(true)}>
          <LinearGradient
            colors={['#7c4dff', '#a855f7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={familyStyles.createGrad}
          >
            <Text style={familyStyles.createText}>+ Create Family</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Create Family Rules Modal */}
      <Modal
        visible={showCreateRules}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateRules(false)}
      >
        <TouchableOpacity
          style={familyStyles.rulesOverlay}
          activeOpacity={1}
          onPress={() => setShowCreateRules(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[familyStyles.rulesSheet, { paddingBottom: safeBottom + 16 }]}>
            <View style={familyStyles.rulesHandle} />
            <View style={familyStyles.rulesIconWrap}>
              <Text style={{ fontSize: 44 }}>👪</Text>
            </View>
            <Text style={familyStyles.rulesTitle}>Create a Family</Text>
            <Text style={familyStyles.rulesSub}>Before you create, please read the rules</Text>
            <View style={familyStyles.rulesDivider} />

            <View style={familyStyles.rulesList}>
              {[
                { icon: '💎', text: 'Spend 30 diamonds to create a family' },
                { icon: '👑', text: 'You will become the family owner' },
                { icon: '👥', text: 'Invite members to grow your family' },
                { icon: '🏆', text: 'Complete family tasks to earn rewards' },
                { icon: '⚠️', text: 'Violating platform rules will result in family dissolution' },
              ].map((rule, i) => (
                <View key={i} style={familyStyles.ruleRow}>
                  <Text style={familyStyles.ruleIcon}>{rule.icon}</Text>
                  <Text style={familyStyles.ruleText}>{rule.text}</Text>
                </View>
              ))}
            </View>

            <View style={familyStyles.costPill}>
              <Text style={familyStyles.costEmoji}>💎</Text>
              <Text style={familyStyles.costText}>Cost: </Text>
              <Text style={familyStyles.costAmount}>30 Diamonds</Text>
            </View>

            <TouchableOpacity
              style={familyStyles.continueBtn}
              activeOpacity={0.85}
              onPress={() => { setShowCreateRules(false); setShowCreateForm(true); }}
            >
              <LinearGradient
                colors={['#7c4dff', '#a855f7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={familyStyles.continueGrad}
              >
                <Text style={familyStyles.continueText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={familyStyles.cancelBtn}
              activeOpacity={0.8}
              onPress={() => setShowCreateRules(false)}
            >
              <Text style={familyStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Create Family Form Modal */}
      <Modal
        visible={showCreateForm}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowCreateForm(false)}
      >
        <View style={familyStyles.formScreen}>
          <View style={[familyStyles.formHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity
              style={familyStyles.formBackBtn}
              onPress={() => setShowCreateForm(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>
            <Text style={familyStyles.formTitle}>Create Family</Text>
            <View style={{ width: 38 }} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[familyStyles.formContent, { paddingBottom: safeBottom + 100 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={familyStyles.formLabel}>Family cover</Text>
            <TouchableOpacity style={familyStyles.coverPicker} activeOpacity={0.8} onPress={pickFamilyCover}>
              {familyCover ? (
                <Image source={{ uri: familyCover }} style={familyStyles.coverImage} />
              ) : (
                <View style={familyStyles.coverPlaceholder}>
                  <Ionicons name="add" size={32} color="rgba(167,139,250,0.6)" />
                </View>
              )}
            </TouchableOpacity>

            <Text style={familyStyles.formLabel}>Family name</Text>
            <View style={familyStyles.inputWrap}>
              <TextInput
                style={familyStyles.formInput}
                placeholder=""
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={familyName}
                onChangeText={(t) => t.length <= 30 && setFamilyName(t)}
                maxLength={30}
              />
              <Text style={familyStyles.inputCounter}>{familyName.length}/30</Text>
            </View>

            <Text style={familyStyles.formLabel}>Family announcement</Text>
            <View style={[familyStyles.inputWrap, familyStyles.textAreaWrap]}>
              <TextInput
                style={[familyStyles.formInput, familyStyles.textArea]}
                placeholder=""
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={familyAnnouncement}
                onChangeText={(t) => t.length <= 100 && setFamilyAnnouncement(t)}
                maxLength={100}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={[familyStyles.inputCounter, familyStyles.textAreaCounter]}>
                {familyAnnouncement.length}/100
              </Text>
            </View>
          </ScrollView>

          <View style={[familyStyles.formFooter, { paddingBottom: safeBottom + 12 }]}>
            <TouchableOpacity
              style={[
                familyStyles.confirmBtn,
                !familyName.trim() && familyStyles.confirmBtnDisabled,
              ]}
              activeOpacity={0.85}
              disabled={!familyName.trim() || creatingFamily}
              onPress={handleCreateFamily}
            >
              <LinearGradient
                colors={familyName.trim() ? ['#7c4dff', '#a855f7'] : ['#2a1a4a', '#2a1a4a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={familyStyles.confirmGrad}
              >
                {creatingFamily ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={familyStyles.confirmText}>Confirm  💎 30</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FamilyChatModal
        visible={Boolean(chatFamily)}
        family={chatFamily}
        onClose={() => setChatFamily(null)}
      />
    </View>
  );
}

export function ProfileScreen() {
  const router = useRouter();
  const scrollRef = useRef<any>(null);
  useScrollToTop(scrollRef);
  const insets = useSafeAreaInsets();
  const scrollBottomPad = 24 + Math.max(insets.bottom, 8) + 64;

  const [following, setFollowing] = useState(4);
  const [followers, setFollowers] = useState(3);
  const [visitorCount, setVisitorCount] = useState(0);
  const { diamonds: walletDiamonds, coins: walletCoins } = useWalletBalance();
  const [dailyTasks, setDailyTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [connectionsListType, setConnectionsListType] = useState<'following' | 'followers' | 'visitors' | null>(null);
  const [diamondRechargeVisible, setDiamondRechargeVisible] = useState(false);
  const [rechargeInitialTab, setRechargeInitialTab] = useState('diamonds');
  const [menuPage, setMenuPage] = useState(0);
  const [activeTab, setActiveTab] = useState('Moment');
  const [giftTab, setGiftTab] = useState('Receive');
  const [giftEarnedCount, setGiftEarnedCount] = useState(0);
  const [giftsReceived, setGiftsReceived] = useState<any[]>([]);
  const [giftsSent, setGiftsSent] = useState<any[]>([]);
  const [giftsLoading, setGiftsLoading] = useState(false);

  // Editable profile state - defaulted to image preview while dynamic when live
  const [name, setName] = useState('Sakshi Mehar');
  const [avatarId, setAvatarId] = useState<string | null>('profile_13');
  const [editAvatarId, setEditAvatarId] = useState<string | null>('profile_13');
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [userGender, setUserGender] = useState('Female');
  const [verifiedBadgeUrl, setVerifiedBadgeUrl] = useState<string | null>(null);
  const countryFlag = useMyCountryFlag();
  const [profileSaving, setProfileSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>('100000');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasLoggedUser, setHasLoggedUser] = useState(false);
  const [honorLevel, setHonorLevel] = useState<number>(0);
  const [honorBadgeUrl, setHonorBadgeUrl] = useState<string | null>(null);
  const [newUserFrameSource, setNewUserFrameSource] = useState<any>(null);
  const [userLevel, setUserLevel] = useState(30);
  const [levelBadgeSource, setLevelBadgeSource] = useState<any>(null);
  const [vipAssets, setVipAssets] = useState<VipAssets>({
    unlocked: true,
    profileFrame: null,
    entryFrame: null,
    chatFrame: null,
    logo: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip8/Viplogo8.png',
  });
  const [decorations, setDecorations] = useState<{ badgeUrl: string | null; frameUrl: string | null }>({
    badgeUrl: null,
    frameUrl: null,
  });
  const [premiumLogo, setPremiumLogo] = useState<string | null>(null);

  const avatarSource = resolveProfileAvatarSource({
    avatarId,
    profilePicUrl,
  });

  const localProfileUser = useMemo(() => ({ id: userId, userId, name, isOnline: true }), [userId, name]);
  const isOnline = useUserOnlineOrLiveStatus(localProfileUser, true, true);

  // Dynamic frame & badge calculations
  const isPreview = !hasLoggedUser && userId === '100000';
  const activeFrameSource =
    decorations.frameUrl ||
    vipAssets.profileFrame ||
    newUserFrameSource ||
    (isPreview ? DEFAULT_OWNER_FRAME : null);

  const resolvedLevelBadge = levelBadgeSource ?? (userLevel ? resolveLocalLevelBadge(userLevel) : null);
  const showVipBadge = Boolean(vipAssets?.unlocked && vipAssets?.logo) || isPreview;
  const vipBadgeSource = vipAssets.logo ? { uri: vipAssets.logo } : (isPreview ? VIP8_BADGE : null);
  const showHonorBadge = Boolean(honorBadgeUrl || honorLevel > 0) || isPreview;
  const resolvedHonorBadge = honorBadgeUrl ? { uri: honorBadgeUrl } : (isPreview ? HONOR_BADGE : null);
  const isOwner = Boolean(
    userRole?.toUpperCase() === 'OWNER' ||
    userRole?.toUpperCase() === 'ADMIN' ||
    isPreview
  );
  const showVerified = Boolean(verifiedBadgeUrl) || isPreview;
  const resolvedVerifiedSource = verifiedBadgeUrl ? { uri: verifiedBadgeUrl } : (isPreview ? VERIFIED_BADGE : null);

  useFocusEffect(
    useCallback(() => {
      wsService.connect();
    }, [])
  );

  // Menu modal state
  const [activeMenu, setActiveMenu] = useState<any>(null);
  const [profileFeedback, setProfileFeedback] = useState('');
  const [feedbackSentMM, setFeedbackSentMM] = useState(false);
  const [feedbackSubmittingMM, setFeedbackSubmittingMM] = useState(false);

  // Saved / favourite users
  const [savedUsers, setSavedUsers] = useState<any[]>([]);
  const [savedUsersLoading, setSavedUsersLoading] = useState(false);
  const [removingSavedUserId, setRemovingSavedUserId] = useState<string | null>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myPostsLoading, setMyPostsLoading] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [editPostText, setEditPostText] = useState('');
  const [postSaving, setPostSaving] = useState(false);
  const [profileTabLoading, setProfileTabLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const tabDataLoadedRef = useRef({ Moment: false, Profile: false, Gift: false });

  const refreshSavedUsers = useCallback(async () => {
    setSavedUsersLoading(true);
    try {
      const list = await fetchSavedUsersFromServer();
      setSavedUsers(list);
    } catch {
      setSavedUsers([]);
    } finally {
      setSavedUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeMenu?.label === 'Saved') refreshSavedUsers();
  }, [activeMenu, refreshSavedUsers]);

  useEffect(() => {
    if (activeMenu?.label !== 'Wallet' && !diamondRechargeVisible) return;
    refreshWalletBalance();
  }, [activeMenu, diamondRechargeVisible]);

  const handleMenuPress = useCallback((item: any) => {
    if (item?.label === 'Wallet') {
      setRechargeInitialTab('diamonds');
      refreshWalletBalance();
      setDiamondRechargeVisible(true);
      return;
    }
    setActiveMenu(item);
  }, []);

  const loadMyPosts = useCallback(async () => {
    setMyPostsLoading(true);
    try {
      const data = await loadMyProfilePosts(1, 20);
      setMyPosts(data.posts ?? []);
    } catch {
      setMyPosts([]);
    } finally {
      setMyPostsLoading(false);
    }
  }, []);

  const hydrateFromLocalUser = useCallback(async () => {
    const user = await getUser();
    if (!user) return;
    setHasLoggedUser(true);
    if (user.role) setUserRole(user.role);
    if (user.name) setName(user.name);
    const localId = user.userId ?? user.id;
    if (localId != null) setUserId(String(localId));

    if (user.avatarId) {
      setAvatarId(user.avatarId);
      setEditAvatarId(user.avatarId);
    } else {
      setAvatarId(null);
    }
    setProfilePicUrl(user.profilePicUrl ?? user.avatarUrl ?? null);
    if (user.gender) setUserGender(user.gender);

    const frameSource = await syncNewUserFrameForSession();
    setNewUserFrameSource(frameSource);

    const levelData = await syncUserLevelForSession();
    if (levelData?.level != null) setUserLevel(levelData.level);
    setLevelBadgeSource(levelData?.badgeSource ?? null);

    setVipAssets(await loadMyVipAssets(levelData?.xp?.totalXp));
    const prem = await loadMyPremiumAssets();
    setPremiumLogo(prem.logo);

    if (localId != null) {
      setDecorations(await fetchUserDecorations(String(localId)));
    }

    try {
      await refreshTokenCache();
      const serverProfile = await loadMyProfile();
      if (serverProfile?.role) setUserRole(serverProfile.role);
      const anyProfile = serverProfile as any;
      if (anyProfile?.honorLevel != null) setHonorLevel(anyProfile.honorLevel);
      if (anyProfile?.honorBadgeUrl) setHonorBadgeUrl(anyProfile.honorBadgeUrl);
      setVerifiedBadgeUrl(serverProfile?.verifiedBadgeUrl ?? null);
      if (serverProfile?.id != null) {
        const id = String(serverProfile.id);
        setUserId(id);
        if (String(localId ?? '') !== id) {
          await updateUser({ id: serverProfile.id, userId: serverProfile.id });
          setDecorations(await fetchUserDecorations(id));
        }
      }
      if (serverProfile?.avatarId) {
        setAvatarId(serverProfile.avatarId);
        setEditAvatarId(serverProfile.avatarId);
        setProfilePicUrl(null);
        await updateUser({ avatarId: serverProfile.avatarId, profilePicUrl: null, useLocalAvatar: true });
      } else if (serverProfile?.profilePicUrl) {
        setAvatarId(null);
        setProfilePicUrl(serverProfile.profilePicUrl);
        await updateUser({ profilePicUrl: serverProfile.profilePicUrl, avatarUrl: serverProfile.profilePicUrl, useLocalAvatar: false });
      }
    } catch {}
  }, []);

  const loadConnectionStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      await refreshTokenCache();
      const stats = await loadProfileStats();
      setFollowing(stats.followingCount);
      setFollowers(stats.followersCount);
      setVisitorCount(stats.visitorCount);
    } catch {
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadProfileTabData = useCallback(async () => {
    setProfileTabLoading(true);
    try {
      const user = await getUser();
      const serverProfile = await loadMyProfile();
      setVerifiedBadgeUrl(serverProfile?.verifiedBadgeUrl ?? null);
      if (serverProfile.id != null) {
        const id = String(serverProfile.id);
        setUserId(id);
        setDecorations(await fetchUserDecorations(id));
      }
      if (serverProfile.name) setName(serverProfile.name);
      if (serverProfile.avatarId) {
        setAvatarId(serverProfile.avatarId);
        setEditAvatarId(serverProfile.avatarId);
        setProfilePicUrl(null);
      } else if (serverProfile.profilePicUrl) {
        setAvatarId(null);
        setProfilePicUrl(serverProfile.profilePicUrl);
      }
      await updateUser({
        name: serverProfile.name || user?.name,
        ...(serverProfile.id != null ? { id: serverProfile.id, userId: serverProfile.id } : {}),
        avatarId: serverProfile.avatarId ?? null,
        profilePicUrl: serverProfile.profilePicUrl ?? null,
        useLocalAvatar: Boolean(serverProfile.avatarId) || !serverProfile.profilePicUrl,
        ...(serverProfile.createdAt ? { createdAt: serverProfile.createdAt } : {}),
        ...(serverProfile.hasNewUserFrame ? { hasNewUserFrame: true } : {}),
        ...(serverProfile.newUserFrameUrl ? { newUserFrameUrl: serverProfile.newUserFrameUrl } : {}),
        ...(serverProfile.level != null ? { level: serverProfile.level } : {}),
        ...(serverProfile.levelBadgeUrl ? { levelBadgeUrl: serverProfile.levelBadgeUrl } : {}),
      });

      const frameSource = await syncNewUserFrameForSession();
      setNewUserFrameSource(frameSource);

      const levelData = await syncUserLevelForSession();
      if (levelData?.level != null) setUserLevel(levelData.level);
      setLevelBadgeSource(levelData?.badgeSource ?? null);

      setVipAssets(await loadMyVipAssets(levelData?.xp?.totalXp));
      const prem = await loadMyPremiumAssets();
      setPremiumLogo(prem.logo);
    } catch {
    } finally {
      setProfileTabLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      hydrateFromLocalUser();
      refreshWalletBalance();
      loadConnectionStats();
    }, [hydrateFromLocalUser, loadConnectionStats])
  );

  useEffect(() => {
    if (activeTab === 'Moment') {
      if (tabDataLoadedRef.current.Moment) return;
      tabDataLoadedRef.current.Moment = true;
      loadMyPosts();
      return;
    }
    if (activeTab === 'Profile') {
      if (tabDataLoadedRef.current.Profile) return;
      tabDataLoadedRef.current.Profile = true;
      loadProfileTabData();
      return;
    }
    if (activeTab === 'Gift') {
      if (tabDataLoadedRef.current.Gift) return;
      tabDataLoadedRef.current.Gift = true;
      setGiftsLoading(true);
      Promise.allSettled([getGiftsReceived(), getGiftsSent()]).then(([receivedRes, sentRes]) => {
        if (receivedRes.status === 'fulfilled') {
          const data = receivedRes.value;
          const list = Array.isArray(data) ? data : data?.data ?? data?.gifts ?? data?.list ?? [];
          setGiftsReceived(list);
          setGiftEarnedCount(list.length);
        }
        if (sentRes.status === 'fulfilled') {
          const data = sentRes.value;
          const list = Array.isArray(data) ? data : data?.data ?? data?.gifts ?? data?.list ?? [];
          setGiftsSent(list);
        }
        setGiftsLoading(false);
      });
    }
  }, [activeTab, loadMyPosts, loadProfileTabData]);

  const handleOpenEditPost = useCallback((post: any) => {
    setEditingPost(post);
    setEditPostText(post?.text ?? '');
  }, []);

  const handleSavePostDescription = useCallback(async () => {
    if (!editingPost?.id || postSaving) return;
    setPostSaving(true);
    try {
      const updated = await updateMyPostDescription(editingPost.id, editPostText);
      setMyPosts((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
      setEditingPost(null);
      setEditPostText('');
    } catch (err: any) {
      Alert.alert('Update failed', err?.message || 'Could not update this post.');
    } finally {
      setPostSaving(false);
    }
  }, [editingPost, editPostText, postSaving]);

  const handleOpenSavedUser = useCallback(async (user: any) => {
    setActiveMenu(null);
    await openUserChat(router, {
      userId: user.userId,
      name: user.name,
      avatar: user.avatarUrl,
    });
  }, [router]);

  const handleRemoveSavedUser = useCallback(async (delUserId: any) => {
    if (removingSavedUserId) return;
    setRemovingSavedUserId(String(delUserId));

    try {
      await removeFavoriteUser(delUserId);
      setSavedUsers((prev) => prev.filter((u) => u.userId !== String(delUserId)));
    } catch (err: any) {
      Alert.alert('Remove failed', err?.message || 'Could not remove this user from Saved.');
    } finally {
      setRemovingSavedUserId(null);
    }
  }, [removingSavedUserId]);

  useEffect(() => {
    if (activeMenu?.label !== 'Task') return;

    let cancelled = false;
    setTasksLoading(true);
    loadDailyTasks()
      .then((tasks) => {
        if (!cancelled) setDailyTasks(tasks);
      })
      .catch(() => {
        if (!cancelled) setDailyTasks([]);
      })
      .finally(() => {
        if (!cancelled) setTasksLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeMenu]);

  const [claimingTask, setClaimingTask] = useState<string | null>(null);
  const [claimedTaskRewardModal, setClaimedTaskRewardModal] = useState<any>(null);

  const handleClaimTask = async (task: any) => {
    if (task.claimed || !task.completed || claimingTask) return;
    setClaimingTask(task.taskType);

    try {
      await claimRewardTask(task);
      const tasks = await loadDailyTasks();
      setDailyTasks(tasks);
      await refreshWalletBalance();
      setClaimedTaskRewardModal(task);
    } catch (err: any) {
      Alert.alert('Could not claim', err?.message || "This task can't be claimed yet. Please try again.");
    } finally {
      setClaimingTask(null);
    }
  };

  const handleOpenEditProfile = () => {
    setEditName(name);
    setEditAvatarId(avatarId);
    setEditVisible(true);
  };

  const handleSaveProfile = async () => {
    if (profileSaving) return;

    const trimmedName = editName.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter a display name.');
      return;
    }

    setProfileSaving(true);
    try {
      const saved = await saveMyProfile({
        name: trimmedName,
        avatarId: editAvatarId,
      });

      const nextName = saved?.name ?? trimmedName;
      const nextAvatarId = saved?.avatarId ?? editAvatarId;
      const nextProfilePicUrl = saved?.profilePicUrl ?? null;

      setName(nextName);
      setAvatarId(nextAvatarId);
      setProfilePicUrl(nextProfilePicUrl);

      await updateUser({
        name: nextName,
        avatarId: nextAvatarId,
        profilePicUrl: nextProfilePicUrl,
        useLocalAvatar: Boolean(nextAvatarId) || !nextProfilePicUrl,
      });

      setEditVisible(false);
    } catch (err: any) {
      Alert.alert('Save failed', err?.message || 'Could not save your profile. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  const editPreviewSource = getAvatarSource(editAvatarId);

  const renderMenuContent = () => {
    if (!activeMenu) return null;
    const { label } = activeMenu;

    // Saved users
    if (label === 'Saved') {
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <LinearGradient colors={['rgba(124,77,255,0.2)', 'rgba(168,85,247,0.1)']} style={styles.mmHeroBox}>
            <Text style={{ fontSize: 40 }}>⭐</Text>
            <Text style={styles.mmHeroTitle}>{savedUsers.length} Saved</Text>
            <Text style={styles.mmHeroSub}>People you saved on Tuk Tuk</Text>
          </LinearGradient>

          {savedUsersLoading ? (
            <ActivityIndicator color="#a78bfa" style={{ marginVertical: 24 }} />
          ) : savedUsers.length === 0 ? (
            <View style={styles.savedEmptyBox}>
              <Text style={styles.savedEmptyEmoji}>🔖</Text>
              <Text style={styles.savedEmptyTitle}>No saved users yet</Text>
              <Text style={styles.savedEmptyText}>
                Save people from Nearby or Find Friends and they will appear here.
              </Text>
            </View>
          ) : (
            savedUsers.map((u) => (
              <TouchableOpacity
                key={u.userId}
                style={styles.savedRow}
                activeOpacity={0.8}
                onPress={() => handleOpenSavedUser(u)}
              >
                {u.avatarUrl ? (
                  <ProfileAvatarWithFrame
                    user={u}
                    isOnline={u.isOnline}
                    avatarSource={{ uri: u.avatarUrl }}
                    frameSource={u.vipProfileFrameUrl}
                    size={48}
                    avatarStyle={styles.savedAvatar}
                    {...(u.vipProfileFrameUrl ? VIP_PROFILE_FRAME_LAYOUT : {})}
                  />
                ) : (
                  <View style={[styles.savedAvatar, styles.savedAvatarFallback]}>
                    <FontAwesome5 name="user" size={18} color="#a78bfa" solid />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.savedName} numberOfLines={1}>{u.name}</Text>
                  {u.occupation ? (
                    <Text style={styles.savedSub} numberOfLines={1}>💼 {u.occupation}</Text>
                  ) : (
                    <Text style={styles.savedSub}>Tap to message</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.savedRemoveBtn}
                  onPress={() => handleRemoveSavedUser(u.userId)}
                  disabled={removingSavedUserId === u.userId}
                  activeOpacity={0.8}
                >
                  {removingSavedUserId === u.userId ? (
                    <ActivityIndicator color="#ff6b6b" size="small" />
                  ) : (
                    <Ionicons name="close" size={16} color="#ff6b6b" />
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      );
    }

    if (label === 'Get Rewards') {
      return <GetRewardsPanel active={activeMenu?.label === 'Get Rewards'} />;
    }

    if (label === 'Task') {
      const claimedCount = dailyTasks.filter((t) => t.claimed).length;
      const totalCount = dailyTasks.length;
      const claimedDiamonds = claimedTasksDiamondTotal(dailyTasks);
      const totalReward = tasksTotalReward(dailyTasks);
      const progressPct = totalCount ? Math.round((claimedCount / totalCount) * 100) : 0;

      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <LinearGradient
            colors={['rgba(124,77,255,0.2)', 'rgba(168,85,247,0.1)']}
            style={styles.mmHeroBox}
          >
            <Text style={{ fontSize: 40 }}>💎</Text>
            <Text style={[styles.mmHeroTitle, { color: '#1e293b' }]}>{claimedDiamonds}💎 earned</Text>
            <Text style={[styles.mmHeroSub, { color: '#475569' }]}>
              Finish tasks to earn up to {totalReward}💎
            </Text>
          </LinearGradient>

          <View style={[styles.mmProgressCard, { backgroundColor: '#f8fafc' }]}>
            <View style={styles.mmProgressLabelRow}>
              <Text style={[styles.mmProgressTitle, { color: '#334155' }]}>Tasks Completed</Text>
              <Text style={styles.mmProgressVal}>{claimedCount} / {totalCount}</Text>
            </View>
            <View style={[styles.mmProgressBar, { backgroundColor: '#e2e8f0' }]}>
              <View style={[styles.mmProgressFill, { width: `${progressPct}%` }]} />
            </View>
          </View>

          <Text style={[styles.mmSectionLabel, { color: '#1e293b' }]}>Reward Tasks</Text>
          {tasksLoading && dailyTasks.length === 0 ? (
            <ActivityIndicator color="#a78bfa" style={{ marginVertical: 24 }} />
          ) : dailyTasks.length === 0 ? (
            <Text style={[styles.mmInfoText, { color: '#64748b' }]}>No tasks available right now.</Text>
          ) : (
            dailyTasks.map((t) => {
              const claimed = t.claimed;
              const claiming = claimingTask === t.taskType;
              const canClaim = t.completed && !claimed;
              const showProgress = t.targetCount > 1;
              return (
                <View key={t.taskType} style={[styles.mmTaskRow]}>
                  <Image
                    source={{ uri: t.iconUrl }}
                    style={{ width: 36, height: 36, marginRight: 10 }}
                    resizeMode="contain"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.mmTaskText, claimed && styles.mmTaskTextDone, { color: '#1e293b' }]}>
                      {t.label}
                    </Text>
                    <Text style={styles.mmTaskReward}>+{t.reward}💎</Text>
                    {showProgress ? (
                      <Text style={[styles.mmTaskProgress, { color: '#64748b' }]}>
                        {t.progressCount}/{t.targetCount}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={claimed || !canClaim || claiming}
                    onPress={() => handleClaimTask(t)}
                    style={[
                      styles.mmClaimBtn,
                      claimed && styles.mmClaimBtnDone,
                      !canClaim && !claimed && styles.mmClaimBtnDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.mmClaimBtnText,
                        claimed && styles.mmClaimBtnTextDone,
                        !canClaim && !claimed && styles.mmClaimBtnTextDisabled,
                      ]}
                    >
                      {claimed ? '✓ Claimed' : claiming ? '...' : canClaim ? 'Claim' : 'In progress'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}

          <View style={styles.mmInfoRow}>
            <Ionicons name="information-circle-outline" size={16} color="#a78bfa" />
            <Text style={styles.mmInfoText}>
              Claimed diamonds are added to your balance instantly.
            </Text>
          </View>
        </ScrollView>
      );
    }

    if (label === 'Monthly Card') return <MonthlyCardPanel />;
    if (label === 'Store') {
      return (
        <StorePanel
          onClose={() => setActiveMenu(null)}
          onNavigateBackpack={() => setActiveMenu({ label: 'Backpack', icon: 'briefcase' })}
        />
      );
    }

    if (label === 'Relationship') {
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <LinearGradient colors={['rgba(124,77,255,0.2)', 'rgba(236,72,153,0.15)']} style={styles.mmRelCard}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>💑</Text>
            <Text style={styles.mmRelTitle}>No Partner Yet</Text>
            <Text style={styles.mmRelSub}>Connect with someone special to become a couple</Text>
            <TouchableOpacity style={styles.mmPrimaryBtn} activeOpacity={0.8}>
              <LinearGradient colors={['#7c4dff', '#ec4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mmPrimaryBtnGrad}>
                <Text style={styles.mmPrimaryBtnText}>Find a Partner</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
          <Text style={styles.mmSectionLabel}>BFF</Text>
          <View style={styles.mmBFFCard}>
            <Text style={{ fontSize: 28 }}>🤝</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.mmBFFTitle}>No BFF yet</Text>
              <Text style={styles.mmBFFSub}>Add a best friend on Tuk-Tuk</Text>
            </View>
            <TouchableOpacity style={styles.mmSmallBtn} activeOpacity={0.8}>
              <Text style={styles.mmSmallBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    if (label === 'Wallet') {
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <WalletRechargeSection currentDiamonds={walletDiamonds} currentCoins={walletCoins} />
        </ScrollView>
      );
    }

    if (label === 'Premium') return <PremiumPanel onClose={() => setActiveMenu(null)} />;
    if (label === 'VIP') return <VipCenterPanel />;

    if (label === 'Coupon') {
      return (
        <View style={styles.mmEmptyCenter}>
          <Text style={{ fontSize: 64 }}>🎟️</Text>
          <Text style={styles.mmEmptyTitle}>No Coupons Yet</Text>
          <Text style={styles.mmEmptySub}>Earn coupons by completing tasks, attending events, or purchasing packages.</Text>
          <TouchableOpacity style={styles.mmOutlineBtn} activeOpacity={0.8}>
            <Text style={styles.mmOutlineBtnText}>Browse Events</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (label === 'Honor Level') return <HonorLevelModal onClose={() => setActiveMenu(null)} />;
    if (label === 'Family') return <FamilyContent />;

    if (label === 'Matchmaker') {
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <View style={styles.mmMatchCard}>
            <LinearGradient colors={['#7c4dff', '#ec4899']} style={styles.mmMatchCardGrad}>
              <Image source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }} style={styles.mmMatchAvatar} />
              <Text style={styles.mmMatchName}>Aria, 23</Text>
              <Text style={styles.mmMatchLocation}>📍 2 km away</Text>
              <View style={styles.mmMatchTags}>
                {['Music', 'Travel', 'Coffee'].map((tag) => (
                  <View key={tag} style={styles.mmMatchTag}><Text style={styles.mmMatchTagText}>{tag}</Text></View>
                ))}
              </View>
            </LinearGradient>
          </View>
          <View style={styles.mmMatchActions}>
            <TouchableOpacity style={[styles.mmMatchBtn, { backgroundColor: 'rgba(248,113,113,0.15)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)' }]} activeOpacity={0.8}>
              <Ionicons name="close" size={30} color="#f87171" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.mmMatchBtn, { backgroundColor: '#7c4dff' }]} activeOpacity={0.8}>
              <Ionicons name="thumbs-up" size={30} color="white" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    if (label === 'Backpack') {
      return (
        <BackpackPanel
          onClose={() => setActiveMenu(null)}
          onGoToStore={() => setActiveMenu({ label: 'Store', icon: 'store' })}
        />
      );
    }

    if (label === 'Room\nPremium') return <RoomPremiumPanel />;
    if (label === 'TukTuk Pass') return <TukTukPassPanel onClose={() => setActiveMenu(null)} />;
    if (label === 'Level') return <UserLevelPanel />;

    if (label === 'Instagram' || label === 'Facebook') {
      const isIG = label === 'Instagram';
      return (
        <View style={styles.mmEmptyCenter}>
          <View style={[styles.mmSocialIconCircle, { backgroundColor: isIG ? 'rgba(225,48,108,0.12)' : 'rgba(24,119,242,0.12)' }]}>
            <Ionicons name={isIG ? 'logo-instagram' : 'logo-facebook'} size={56} color={isIG ? '#e1306c' : '#1877F2'} />
          </View>
          <Text style={styles.mmEmptyTitle}>Connect {label}</Text>
          <Text style={styles.mmEmptySub}>Link your {label} account to share your Tuk-Tuk profile and grow your audience.</Text>
          <TouchableOpacity
            style={styles.mmPrimaryBtn}
            activeOpacity={0.8}
            onPress={() => {
              if (isIG) {
                Linking.openURL('https://www.instagram.com/tuktukvoicechat').catch(() => {});
              } else {
                Linking.openURL('https://www.facebook.com').catch(() => {});
              }
            }}
          >
            <LinearGradient colors={isIG ? ['#f09433', '#e1306c'] : ['#1877F2', '#3b5998']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mmPrimaryBtnGrad}>
              <Ionicons name={isIG ? 'logo-instagram' : 'logo-facebook'} size={16} color="white" />
              <Text style={[styles.mmPrimaryBtnText, { marginLeft: 8 }]}>Connect {label}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    if (label === 'Share') {
      const options = [
        { icon: 'logo-whatsapp', label: 'WhatsApp', color: '#25D366' },
        { icon: 'logo-twitter', label: 'Twitter', color: '#1DA1F2' },
        { icon: 'logo-instagram', label: 'Instagram', color: '#e1306c' },
        { icon: 'mail-outline', label: 'Email', color: '#a78bfa' },
        { icon: 'copy-outline', label: 'Copy Link', color: '#60a5fa' },
        { icon: 'share-social-outline', label: 'More', color: '#fbbf24' },
      ];
      return (
        <View style={styles.mmScroll}>
          <Text style={styles.mmShareInvite}>Invite friends and earn 50💎 for each successful referral!</Text>
          <View style={styles.mmShareGrid}>
            {options.map((o) => (
              <TouchableOpacity key={o.label} style={styles.mmShareItem} activeOpacity={0.8}>
                <View style={[styles.mmShareIconCircle, { backgroundColor: o.color + '22' }]}>
                  <Ionicons name={o.icon as any} size={28} color={o.color} />
                </View>
                <Text style={styles.mmShareLabel}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    if (label === 'Help') return <HelpMenu insets={insets} onClose={() => setActiveMenu(null)} />;

    if (label === 'Room Badge') {
      const badges = [
        { emoji: '🎵', label: 'Music Room', owned: true },
        { emoji: '👾', label: 'Game Room', owned: false },
        { emoji: '🎤', label: 'Karaoke', owned: true },
        { emoji: '📺', label: 'Movie Night', owned: false },
        { emoji: '🎲', label: 'Party Room', owned: false },
        { emoji: '🌟', label: 'Star Room', owned: false },
      ];
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <Text style={styles.mmSectionLabel}>Your Room Badges</Text>
          <View style={styles.mmBadgeGrid}>
            {badges.map((b) => (
              <View key={b.label} style={[styles.mmBadgeItem, !b.owned && { opacity: 0.38 }]}>
                <View style={styles.mmBadgeCircle}><Text style={{ fontSize: 28 }}>{b.emoji}</Text></View>
                <Text style={styles.mmBadgeLabel}>{b.label}</Text>
                {b.owned && <View style={styles.mmBadgeOwned}><Text style={styles.mmBadgeOwnedText}>Owned</Text></View>}
              </View>
            ))}
          </View>
        </ScrollView>
      );
    }

    if (label === 'Badge') {
      const badges = [
        { emoji: '🌟', label: 'Early Adopter', owned: true },
        { emoji: '💬', label: 'Chatterbox', owned: true },
        { emoji: '❤️', label: 'Heartwarmer', owned: false },
        { emoji: '🔥', label: 'On Fire', owned: false },
        { emoji: '🏆', label: 'Champion', owned: false },
        { emoji: '🎯', label: 'Sharpshooter', owned: false },
        { emoji: '🌈', label: 'Colorful Soul', owned: false },
        { emoji: '👑', label: 'Royalty', owned: false },
      ];
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <View style={styles.mmBadgeProgress}>
            <Text style={styles.mmBadgeProgressText}>2 / 8 Badges Earned</Text>
          </View>
          <View style={styles.mmBadgeGrid}>
            {badges.map((b) => (
              <View key={b.label} style={[styles.mmBadgeItem, !b.owned && { opacity: 0.35 }]}>
                <View style={styles.mmBadgeCircle}><Text style={{ fontSize: 28 }}>{b.emoji}</Text></View>
                <Text style={styles.mmBadgeLabel}>{b.label}</Text>
                {b.owned && <View style={styles.mmBadgeOwned}><Text style={styles.mmBadgeOwnedText}>Earned</Text></View>}
              </View>
            ))}
          </View>
        </ScrollView>
      );
    }

    if (label === 'Room Title') {
      const titles = [
        { label: '🎵 Music King', unlocked: true },
        { label: '🌟 Rising Star', unlocked: true },
        { label: '👑 Room Legend', unlocked: false },
        { label: '🔥 Party Animal', unlocked: false },
        { label: '💜 Purple Heart', unlocked: false },
      ];
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <Text style={styles.mmSectionLabel}>Select Room Title</Text>
          {titles.map((t) => (
            <View key={t.label} style={[styles.mmTitleRow, !t.unlocked && { opacity: 0.42 }]}>
              <Text style={styles.mmTitleLabel}>{t.label}</Text>
              {t.unlocked ? (
                <TouchableOpacity style={styles.mmTitleSelectBtn} activeOpacity={0.8}>
                  <Text style={styles.mmTitleSelectText}>Use</Text>
                </TouchableOpacity>
              ) : (
                <Ionicons name="lock-closed" size={18} color="rgba(255,255,255,0.4)" />
              )}
            </View>
          ))}
        </ScrollView>
      );
    }

    if (label === 'Feedback') {
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <View style={styles.mmFeedbackHero}>
            <Text style={{ fontSize: 48 }}>💬</Text>
            <Text style={styles.mmFeedbackTitle}>Share Your Thoughts</Text>
            <Text style={styles.mmFeedbackSub}>Help us improve Tuk-Tuk</Text>
          </View>
          {feedbackSentMM ? (
            <View style={styles.mmFeedbackSentBox}>
              <Ionicons name="checkmark-circle" size={48} color="#4ade80" />
              <Text style={styles.mmFeedbackSentText}>Thank you!</Text>
              <Text style={styles.mmFeedbackSentSub}>We really appreciate your feedback.</Text>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.mmFeedbackInput}
                placeholder="What's on your mind?"
                placeholderTextColor="rgba(255,255,255,0.35)"
                multiline
                numberOfLines={5}
                value={profileFeedback}
                onChangeText={setProfileFeedback}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.mmPrimaryBtn, (!profileFeedback.trim() || feedbackSubmittingMM) && { opacity: 0.4 }]}
                activeOpacity={0.8}
                disabled={!profileFeedback.trim() || feedbackSubmittingMM}
                onPress={async () => {
                  const text = profileFeedback.trim();
                  if (!text || feedbackSubmittingMM) return;
                  setFeedbackSubmittingMM(true);
                  try {
                    await submitFeedback(text);
                    setFeedbackSentMM(true);
                    setProfileFeedback('');
                    setTimeout(() => setFeedbackSentMM(false), 3000);
                  } catch (err: any) {
                    Alert.alert('Send failed', err?.message ?? 'Could not send feedback. Please try again.');
                  } finally {
                    setFeedbackSubmittingMM(false);
                  }
                }}
              >
                <LinearGradient colors={['#7c4dff', '#a855f7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mmPrimaryBtnGrad}>
                  <Ionicons name="send" size={16} color="white" />
                  <Text style={[styles.mmPrimaryBtnText, { marginLeft: 8 }]}>Send Feedback</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      );
    }

    return (
      <View style={styles.mmEmptyCenter}>
        <Text style={{ fontSize: 48 }}>🚧</Text>
        <Text style={styles.mmEmptyTitle}>Coming Soon</Text>
        <Text style={styles.mmEmptySub}>This feature is under construction. Check back soon!</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" {...({ backgroundColor: '#FFFFFF' } as any)} />
      <AppBackground />
      {/* Soft pink ambient orb matching top-left of screenshot */}
      <View style={styles.topPinkOrb} pointerEvents="none" />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP BAR */}
        <View style={styles.topBar}>
          {/* Diamond counter */}
          <TouchableOpacity
            style={styles.diamondPill}
            activeOpacity={0.85}
            onPress={() => {
              setRechargeInitialTab('diamonds');
              setDiamondRechargeVisible(true);
            }}
          >
            <Image source={{ uri: DIAMOND_ICON_URL }} style={styles.counterDiamondIcon} resizeMode="contain" />
            <Text style={styles.counterValue}>{(walletDiamonds || 1140993).toLocaleString('en-IN')}</Text>
            <View style={styles.plusBtn}>
              <FontAwesome name="plus" size={10} color="white" />
            </View>
          </TouchableOpacity>

          {/* Coin counter */}
          <TouchableOpacity
            style={styles.coinPill}
            activeOpacity={0.8}
            onPress={() => {
              setRechargeInitialTab('golds');
              refreshWalletBalance();
              setDiamondRechargeVisible(true);
            }}
          >
            <View style={styles.coinIconCircle}>
              <Text style={{ fontSize: 13 }}>🪙</Text>
            </View>
            <Text style={styles.counterValue}>{(walletCoins ?? 0).toLocaleString()}</Text>
            <View style={styles.plusBtn}>
              <FontAwesome name="plus" size={10} color="white" />
            </View>
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          {/* Settings */}
          <TouchableOpacity
            style={styles.settingsBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={20} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* CHARACTER IMAGE */}
        <View style={styles.characterWrapper}>
          <Image
            source={userGender === 'Male' ? boyHeroAsset : meHeroAsset}
            style={styles.characterImg}
            resizeMode="contain"
          />

          {/* Verify profile button */}
          <TouchableOpacity style={styles.verifyBtn} activeOpacity={0.85}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.verifyGradient}
            >
              <View style={styles.verifyMicCircle}>
                <VerifyMicIcon size={12} color="#FFFFFF" />
              </View>
              <Text style={styles.verifyText}>Verify profile</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* PROFILE INFO CARD */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardBackdrop} pointerEvents="none">
            <LinearGradient
              colors={['rgba(255,255,255,0.96)', 'rgba(255,242,250,0.88)', 'rgba(244,236,255,0.92)']}
              locations={[0, 0.55, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.infoCardFill}
            />
            <View style={styles.infoCardOrbPink} />
            <View style={styles.infoCardOrbPurple} />
          </View>

          {/* Top section: avatar left + name/id/badges right */}
          <View style={styles.profileTopSection}>
            <View style={styles.profilePicWrapper}>
              <ProfileAvatarWithFrame
                user={localProfileUser}
                isOnline={true}
                avatarSource={avatarSource}
                frameSource={activeFrameSource}
                size={s(60)}
                avatarStyle={styles.profilePic}
                wrapperStyle={styles.profilePicFrameWrap}
                frameScale={1.38}
                avatarBoost={0.78}
                avatarOffsetY={0}
                frameResizeMode="contain"
              />
            </View>

            <View style={styles.profileInfoCol}>
              {/* Row 1: Username + Flag + Edit */}
              <View style={styles.nameRow}>
                <View style={styles.userNameWithFlag}>
                  <Text
                    style={styles.userName}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {name}
                  </Text>
                  <Text style={styles.profileCountryFlag}>{countryFlag || '🇮🇳'}</Text>
                </View>
                <TouchableOpacity style={styles.editBtn} activeOpacity={0.8} onPress={handleOpenEditProfile}>
                  <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.editBtnGrad}
                  >
                    <FontAwesome name="pencil" size={14} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Row 2: ID + gender symbol */}
              <View style={styles.idRow}>
                <View style={styles.idPill}>
                  <Text allowFontScaling={false} style={styles.userId}>ID {userId ?? '100000'}</Text>
                </View>
                <Text
                  style={userGender === 'Male' ? styles.genderSymbolMale : styles.genderSymbolFemale}
                >
                  {userGender === 'Male' ? '♂' : '♀'}
                </Text>
              </View>

              {/* Row 3: All badges in the SAME horizontal line */}
              {(resolvedLevelBadge || (showVipBadge && vipBadgeSource) || (showHonorBadge && resolvedHonorBadge) || isOwner || (showVerified && resolvedVerifiedSource)) ? (
                <View style={styles.profileBadgeRow}>
                  {resolvedLevelBadge ? (
                    <Image
                      source={resolvedLevelBadge}
                      style={styles.levelBadgeImg}
                      resizeMode="contain"
                    />
                  ) : null}
                  {showVipBadge && vipBadgeSource ? (
                    <Image
                      source={vipBadgeSource}
                      style={styles.vipBadgeImg}
                      resizeMode="contain"
                    />
                  ) : null}
                  {showHonorBadge && resolvedHonorBadge ? (
                    <Image
                      source={resolvedHonorBadge}
                      style={styles.honorBadgeImg}
                      resizeMode="contain"
                    />
                  ) : null}
                  {isOwner ? (
                    <Image
                      source={OWNER_BADGE}
                      style={styles.ownerBadgeImg}
                      resizeMode="contain"
                    />
                  ) : null}
                  {showVerified && resolvedVerifiedSource ? (
                    <Image
                      source={resolvedVerifiedSource}
                      style={styles.verifiedBadgeImg}
                      resizeMode="contain"
                    />
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {statsLoading ? (
              <ActivityIndicator color="#a78bfa" style={{ paddingVertical: 8 }} />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.statBox}
                  activeOpacity={0.75}
                  onPress={() => setConnectionsListType('following')}
                >
                  <Text numberOfLines={1} adjustsFontSizeToFit allowFontScaling={false} style={styles.statValue}>
                    {following.toLocaleString()}
                  </Text>
                  <Text numberOfLines={1} adjustsFontSizeToFit allowFontScaling={false} style={styles.statLabel}>
                    Following
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.statBox}
                  activeOpacity={0.75}
                  onPress={() => setConnectionsListType('followers')}
                >
                  <Text numberOfLines={1} adjustsFontSizeToFit allowFontScaling={false} style={styles.statValue}>
                    {followers.toLocaleString()}
                  </Text>
                  <Text numberOfLines={1} adjustsFontSizeToFit allowFontScaling={false} style={styles.statLabel}>
                    Followers
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.statBox}
                  activeOpacity={0.75}
                  onPress={() => setConnectionsListType('visitors')}
                >
                  <Text numberOfLines={1} adjustsFontSizeToFit allowFontScaling={false} style={styles.statValue}>
                    {visitorCount.toLocaleString()}
                  </Text>
                  <Text numberOfLines={1} adjustsFontSizeToFit allowFontScaling={false} style={styles.statLabel}>
                    Visitor
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* MENU GRID */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Menu</Text>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const page = Math.round(e.nativeEvent.contentOffset.x / (screen.width - 32));
              setMenuPage(page);
            }}
          >
            {menuPages.map((page, pageIndex) => (
              <View key={pageIndex} style={styles.menuPage}>
                <View style={styles.menuRow}>
                  {page.slice(0, 4).map((item) => (
                    <MenuGridButton key={item.label} item={item} onPress={() => handleMenuPress(item)} />
                  ))}
                  {Array.from({ length: 4 - page.slice(0, 4).length }).map((_, i) => (
                    <View key={`dummy-1-${i}`} style={{ width: (screen.width - 32) / 4 }} />
                  ))}
                </View>
                <View style={styles.menuRow}>
                  {page.slice(4, 8).map((item) => (
                    <MenuGridButton key={item.label} item={item} onPress={() => handleMenuPress(item)} />
                  ))}
                  {Array.from({ length: 4 - page.slice(4, 8).length }).map((_, i) => (
                    <View key={`dummy-2-${i}`} style={{ width: (screen.width - 32) / 4 }} />
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.menuDots}>
            {menuPages.map((_, i) => (
              <View key={i} style={[styles.menuDot, menuPage === i && styles.menuDotActive]} />
            ))}
          </View>
        </View>

        {/* BOTTOM TABS */}
        <View style={styles.bottomTabsBar}>
          {BOTTOM_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={styles.bottomTabItem}
              >
                {({ pressed }) => (
                  <View style={[styles.bottomTabInner, pressed && styles.bottomTabInnerPressed]}>
                    <Text
                      style={[
                        styles.bottomTabText,
                        isActive && styles.bottomTabActive,
                        pressed && styles.bottomTabTextPressed,
                      ]}
                    >
                      {tab}
                    </Text>
                    {(isActive || pressed) && (
                      <View
                        style={[
                          styles.bottomTabUnderline,
                          !isActive && pressed && styles.bottomTabUnderlinePressed,
                        ]}
                      />
                    )}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* MOMENT CONTENT */}
        {activeTab === 'Moment' && (
          <View style={styles.momentSection}>
            <View style={styles.shareCard}>
              <View style={styles.shareCardText}>
                <Text style={styles.shareCardTitle}>Share your moment today</Text>
                <Text style={styles.shareCardSub}>Your stories would gain more likes and friends.</Text>
              </View>
              <Pressable
                onPress={() =>
                  router.push('/home')
                }
                style={styles.shareCardBtn}
              >
                <FontAwesome name="send" size={20} color="white" />
              </Pressable>
            </View>

            {myPostsLoading ? (
              <ActivityIndicator color="#a78bfa" style={{ marginVertical: 24 }} />
            ) : myPosts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📦</Text>
                <Text style={styles.emptyText}>No moments yet</Text>
              </View>
            ) : (
              myPosts.map((post) => (
                <View key={String(post.id)} style={styles.momentPostCard}>
                  <View style={styles.momentPostHeader}>
                    <View style={styles.momentPostAuthor}>
                      <ProfileAvatarWithFrame
                        avatarSource={avatarSource}
                        frameSource={decorations.frameUrl ?? vipAssets.profileFrame ?? newUserFrameSource}
                        size={s(36)}
                        avatarStyle={styles.momentPostAuthorAvatar}
                        {...(decorations.frameUrl
                          ? { frameResizeMode: 'contain' }
                          : vipAssets.profileFrame
                          ? VIP_PROFILE_FRAME_LAYOUT
                          : {})}
                      />
                      <View style={styles.momentPostAuthorInfo}>
                        <Text style={styles.momentPostTitle}>{name}</Text>
                        {verifiedBadgeUrl && (
                          <Image
                            source={{ uri: verifiedBadgeUrl }}
                            style={styles.momentPostAuthorBatch}
                            resizeMode="contain"
                          />
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.momentPostEditBtn}
                      onPress={() => handleOpenEditPost(post)}
                      activeOpacity={0.8}
                    >
                      <FontAwesome name="pencil" size={12} color={APP_PURPLE} />
                      <Text style={styles.momentPostEditText}>Edit</Text>
                    </TouchableOpacity>
                  </View>

                  {post.text ? (
                    <Text style={styles.momentPostText}>{post.text}</Text>
                  ) : (
                    <Text style={styles.momentPostTextMuted}>No caption</Text>
                  )}

                  {(() => {
                    const postImg = resolveMediaUrl(
                      post.imageUrl ||
                      post.mediaUrl ||
                      (Array.isArray(post.imageUrls) && post.imageUrls[0]) ||
                      (Array.isArray(post.mediaUrls) && post.mediaUrls[0]) ||
                      post._localMediaUri
                    );
                    if (!postImg || post.hasVideo) return null;
                    return (
                      <Image
                        source={{ uri: postImg }}
                        style={styles.momentPostImage}
                        resizeMode="cover"
                      />
                    );
                  })()}

                  {post.hasVideo ? (
                    <View style={styles.momentPostVideoBox}>
                      <Text style={styles.momentPostVideoLabel}>🎬 Video post</Text>
                    </View>
                  ) : null}

                  {(post.likeCount ?? 0) > 0 && (
                    <Text style={styles.momentPostMeta}>👍 {post.likeCount}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'Profile' && (
          <View style={styles.momentSection}>
            {profileTabLoading ? (
              <ActivityIndicator color="#a78bfa" style={{ marginVertical: 24 }} />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>👤</Text>
                <Text style={styles.emptyText}>Your profile stats are shown above</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'Honor' && (
          <View style={styles.momentSection}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🏅</Text>
              <Text style={styles.emptyText}>Honor coming soon</Text>
            </View>
          </View>
        )}

        {activeTab === 'Gift' && (() => {
          const apiGifts = giftTab === 'Receive' ? giftsReceived : giftsSent;
          const currentGifts = apiGifts && apiGifts.length > 0
            ? apiGifts
            : (giftTab === 'Receive' ? DUMMY_GIFTS_RECEIVED : DUMMY_GIFTS_SENT);
          const totalCount = currentGifts.reduce((acc, item) => acc + (Number(item?.quantity) || 1), 0);
          return (
            <View style={styles.giftSection}>
              <View style={styles.giftHeader}>
                <Text style={styles.giftHeaderTitle}>Gift</Text>
                <TouchableOpacity style={styles.giftEarnedBtn} activeOpacity={0.7}>
                  <Text style={styles.giftEarnedText}>
                    {giftTab === 'Receive' ? 'Earned' : 'Sent'} {totalCount}{' '}
                  </Text>
                  <FontAwesome name="chevron-right" size={11} color="#948fa8" />
                </TouchableOpacity>
              </View>

              <View style={styles.giftSliderContainer}>
                <View style={styles.giftSlider}>
                  {['Receive', 'Send'].map((tab) => (
                    <TouchableOpacity
                      key={tab}
                      activeOpacity={0.85}
                      onPress={() => setGiftTab(tab)}
                      style={[styles.giftSliderBtn, giftTab === tab && styles.giftSliderBtnActive]}
                    >
                      {giftTab === tab && (
                        <LinearGradient
                          colors={['#c084fc', '#a855f7']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={StyleSheet.absoluteFill}
                        />
                      )}
                      <Text style={[styles.giftSliderBtnText, giftTab === tab && styles.giftSliderBtnTextActive]}>
                        {tab}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {giftsLoading ? (
                <ActivityIndicator color="#a78bfa" style={{ marginVertical: 32 }} />
              ) : currentGifts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🎁</Text>
                  <Text style={styles.emptyText}>
                    {giftTab === 'Receive' ? 'No gifts received yet' : 'No gifts sent yet'}
                  </Text>
                </View>
              ) : (
                <View style={styles.giftGrid}>
                  {currentGifts.map((item, idx) => {
                    const giftImageUrl = item?.gift?.imageUrl ?? item?.imageUrl ?? item?.gift?.iconUrl ?? item?.iconUrl;
                    const giftName = item?.gift?.name ?? item?.giftName ?? item?.name ?? 'Gift';
                    const quantity = Number(item?.quantity) || 1;
                    const imageSource = item?.localImage
                      ? item.localImage
                      : giftImageUrl
                      ? resolveImageSource(giftImageUrl)
                      : null;

                    return (
                      <View key={String(item?.transactionId ?? item?.id ?? idx)} style={styles.giftCard}>
                        <View style={styles.giftCardBadge}>
                          <Text style={styles.giftCardBadgeText}>x{quantity}</Text>
                        </View>
                        <View style={styles.giftCardImageContainer}>
                          {imageSource ? (
                            <Image
                              source={imageSource}
                              style={styles.giftCardImage}
                              resizeMode="contain"
                            />
                          ) : (
                            <View style={[styles.giftCardImage, styles.giftCardImageFallback]}>
                              <Text style={{ fontSize: 26 }}>🎁</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.giftCardName} numberOfLines={1} ellipsizeMode="tail">
                          {giftName}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })()}
      </ScrollView>

      {/* MENU DETAIL MODAL */}
      <Modal visible={Boolean(activeMenu)} transparent={false} animationType="slide" onRequestClose={() => setActiveMenu(null)}>
        <View style={[styles.mmPanel, { paddingBottom: (activeMenu?.label === 'Help' || activeMenu?.label === 'Store' || activeMenu?.label === 'TukTuk Pass' || activeMenu?.label === 'Premium') ? 0 : insets.bottom }]}>
          {activeMenu?.label === 'Task' || activeMenu?.label === 'Honor Level' || activeMenu?.label === 'Store' ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#ffffff' }]} />
          ) : activeMenu?.label === 'Help' ? (
            <LinearGradient colors={['#f8f9fe', '#f0f4ff', '#ffffff']} style={StyleSheet.absoluteFill} />
          ) : (
            <LinearGradient colors={['#1a0a2e', '#16082a', '#0d0618']} style={StyleSheet.absoluteFill} />
          )}

          {activeMenu?.label !== 'Premium' && activeMenu?.label !== 'TukTuk Pass' && activeMenu?.label !== 'Backpack' && activeMenu?.label !== 'Help' && activeMenu?.label !== 'Store' && (
            <>
              <View style={[styles.mmHeader, { paddingTop: insets.top + 10 }]}>
                <View style={styles.mmHeaderIcon}>
                  <FontAwesome5 name={activeMenu?.icon} size={18} color="#a78bfa" solid />
                </View>
                <Text style={[styles.mmHeaderTitle, (activeMenu?.label === 'Task' || activeMenu?.label === 'Honor Level') && { color: '#1e293b' }]}>
                  {activeMenu?.label}
                </Text>
                <TouchableOpacity
                  style={[styles.mmCloseBtn, (activeMenu?.label === 'Task' || activeMenu?.label === 'Honor Level') && { backgroundColor: 'rgba(0,0,0,0.05)' }]}
                  onPress={() => setActiveMenu(null)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={20} color={(activeMenu?.label === 'Task' || activeMenu?.label === 'Honor Level') ? '#1e293b' : '#ffffff'} />
                </TouchableOpacity>
              </View>
              <View style={[styles.mmDivider, (activeMenu?.label === 'Task' || activeMenu?.label === 'Honor Level') && { backgroundColor: '#f1f5f9' }]} />
            </>
          )}

          {renderMenuContent()}
        </View>
      </Modal>

      <ProfileConnectionsModal
        visible={connectionsListType !== null}
        type={connectionsListType}
        onClose={() => {
          setConnectionsListType(null);
          loadConnectionStats();
        }}
      />

      {/* TASK REWARD CLAIMED MODAL */}
      <Modal
        visible={Boolean(claimedTaskRewardModal)}
        transparent
        animationType="fade"
        onRequestClose={() => setClaimedTaskRewardModal(null)}
      >
        <View style={styles.taskRewardModalOverlay}>
          <View style={styles.taskRewardModalContainer}>
            <Image
              source={{ uri: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/Rechargebonus/Popupheader/Diamondpop.png' }}
              style={styles.taskRewardModalImg}
              resizeMode="contain"
            />
            <Text style={styles.taskRewardModalTitle}>Reward claimed!</Text>
            <Text style={styles.taskRewardModalSub}>
              You earned <Text style={{ fontWeight: 'bold', color: '#fff' }}>{claimedTaskRewardModal?.reward} 💎</Text> for &ldquo;{claimedTaskRewardModal?.label}&rdquo;.
            </Text>

            <View style={styles.taskRewardModalCard}>
              <LinearGradient colors={['#4a1cff', '#8e2de2']} style={styles.taskRewardModalCardIconBg}>
                <Image source={{ uri: DIAMOND_ICON_URL }} style={styles.taskRewardModalCardIcon} resizeMode="contain" />
              </LinearGradient>
              <View style={styles.taskRewardModalCardText}>
                <Text style={styles.taskRewardModalCardVal}>+{claimedTaskRewardModal?.reward}</Text>
                <Text style={styles.taskRewardModalCardLabel}>Diamonds</Text>
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.8} onPress={() => setClaimedTaskRewardModal(null)} style={{ width: '100%' }}>
              <LinearGradient colors={['#e052ff', '#4a1cff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.taskRewardModalBtn}>
                <Text style={styles.taskRewardModalBtnText}>OK</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <DiamondRechargeModal
        visible={diamondRechargeVisible}
        onClose={() => {
          setDiamondRechargeVisible(false);
          refreshWalletBalance();
        }}
        currentDiamonds={walletDiamonds}
      />

      {/* Edit Profile Modal */}
      <Modal visible={editVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: screen.height * 0.88 }]}>
            <ScrollView
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalCardScroll}
            >
              <Text style={styles.modalTitle}>Edit profile</Text>

              <View style={styles.editAvatarPreviewWrap}>
                <Image source={editPreviewSource} style={styles.editPhotoPreview} />
              </View>

              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Display name"
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={styles.nameInput}
                maxLength={24}
                editable={!profileSaving}
              />

              <Text style={styles.sectionSmall}>Choose avatar</Text>
              <View style={styles.avatarRow}>
                {getAvatarOptionsForGender(userGender).map((id) => (
                  <TouchableOpacity
                    key={id}
                    onPress={() => setEditAvatarId(id)}
                    style={[
                      styles.avatarOption,
                      editAvatarId === id && styles.avatarSelected,
                    ]}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={avatarMap[id]}
                      style={styles.avatarThumb}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalBtn}
                  onPress={() => setEditVisible(false)}
                  disabled={profileSaving}
                >
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.saveBtn, profileSaving && { opacity: 0.6 }]}
                  onPress={handleSaveProfile}
                  disabled={profileSaving}
                >
                  {profileSaving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={[styles.modalBtnText, styles.saveBtnText]}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Post Modal */}
      <Modal visible={Boolean(editingPost)} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit description</Text>
            <Text style={styles.sectionSmall}>
              Post #{editingPost?.id} — leave empty to clear caption on media posts
            </Text>
            <TextInput
              value={editPostText}
              onChangeText={setEditPostText}
              placeholder="Write a caption..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={[styles.nameInput, styles.postEditInput]}
              multiline
              maxLength={500}
              editable={!postSaving}
            />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => {
                  setEditingPost(null);
                  setEditPostText('');
                }}
                disabled={postSaving}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn, postSaving && { opacity: 0.6 }]}
                onPress={handleSavePostDescription}
                disabled={postSaving}
              >
                {postSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.modalBtnText, styles.saveBtnText]}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const familyStyles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
  },
  tabItem: {
    paddingVertical: 13,
    paddingHorizontal: 2,
    marginRight: 18,
    position: 'relative',
  },
  tabText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: 'white',
    fontWeight: '800',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#7c4dff',
    borderRadius: 2,
  },
  searchIcon: {
    marginLeft: 'auto',
    padding: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.2)',
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    paddingVertical: 0,
  },
  listContent: {
    padding: 16,
    paddingBottom: 96,
    gap: 10,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 52,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.12)',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(124,77,255,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(124,77,255,0.35)',
  },
  icon: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  info: {
    flex: 1,
    gap: 5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  officialBadge: {
    backgroundColor: 'rgba(124,77,255,0.3)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.45)',
  },
  officialText: {
    color: '#c4b5fd',
    fontSize: 10,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  meta: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  joinBtn: {
    backgroundColor: 'rgba(124,77,255,0.2)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.45)',
  },
  joinText: {
    color: '#c4b5fd',
    fontSize: 13,
    fontWeight: '700',
  },
  joinedBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  joinedText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '700',
  },
  createWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(10,4,20,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  createBtn: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  createGrad: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  rulesOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  rulesSheet: {
    backgroundColor: '#130828',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(124,77,255,0.3)',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  rulesHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(167,139,250,0.4)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  rulesIconWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  rulesTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
  },
  rulesSub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  rulesDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  rulesList: {
    gap: 12,
    marginBottom: 20,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  ruleIcon: {
    fontSize: 18,
    width: 26,
    textAlign: 'center',
  },
  ruleText: {
    flex: 1,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  costPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,77,255,0.2)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.4)',
    gap: 6,
    marginBottom: 20,
  },
  costEmoji: { fontSize: 18 },
  costText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '600',
  },
  costAmount: {
    color: '#c4b5fd',
    fontSize: 15,
    fontWeight: '800',
  },
  continueBtn: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 10,
  },
  continueGrad: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 15,
    fontWeight: '600',
  },
  formScreen: {
    flex: 1,
    backgroundColor: '#0d0618',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  formBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  formContent: {
    padding: 20,
    gap: 6,
  },
  formLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  coverPicker: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(124,77,255,0.4)',
    borderStyle: 'dashed',
  },
  coverPlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(124,77,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  inputWrap: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  formInput: {
    flex: 1,
    color: 'white',
    fontSize: 15,
    paddingVertical: 0,
  },
  inputCounter: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontWeight: '500',
  },
  textAreaWrap: {
    alignItems: 'flex-end',
    flexDirection: 'column',
    paddingBottom: 8,
  },
  textArea: {
    minHeight: 90,
    width: '100%',
    textAlignVertical: 'top',
  },
  textAreaCounter: {
    marginTop: 6,
  },
  formFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: 'rgba(13,6,24,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  confirmBtn: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmGrad: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  topPinkOrb: {
    position: 'absolute',
    top: -50,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(252, 214, 230, 0.75)',
    zIndex: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 8,
    gap: 10,
    zIndex: 2,
  },
  diamondPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 235, 252, 0.85)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingLeft: 8,
    paddingRight: 5,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(233, 213, 255, 0.6)',
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(254, 243, 235, 0.85)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingLeft: 8,
    paddingRight: 5,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(254, 215, 226, 0.6)',
  },
  coinIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterEmoji: { fontSize: 14 },
  counterDiamondIcon: { width: 22, height: 22 },
  counterValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1B4B',
    minWidth: 12,
    textAlign: 'center',
  },
  plusBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  characterWrapper: {
    width: '100%',
    height: s(205),
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    zIndex: 1,
  },
  characterImg: {
    width: s(155),
    height: s(238),
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
  },
  verifyBtn: {
    position: 'absolute',
    bottom: s(48),
    right: 16,
    borderRadius: 20,
    zIndex: 15,
  },
  verifyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5.5,
    paddingLeft: 7,
    paddingRight: 12,
    gap: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  verifyMicCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  infoCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    marginTop: -s(40),
    borderRadius: 26,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.95)',
    backgroundColor: 'rgba(255,255,255,0.88)',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    zIndex: 10,
    overflow: 'hidden',
  },
  infoCardBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 26,
    overflow: 'hidden',
  },
  infoCardFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  infoCardOrbPink: {
    position: 'absolute',
    width: 140,
    height: 140,
    top: -40,
    right: -20,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 182, 218, 0.35)',
  },
  infoCardOrbPurple: {
    position: 'absolute',
    width: 150,
    height: 150,
    bottom: -60,
    left: -40,
    borderRadius: 75,
    backgroundColor: 'rgba(224, 204, 255, 0.4)',
  },
  profileTopSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  profilePicWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    paddingTop: 4,
  },
  profilePicFrameWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePic: {
    width: s(46),
    height: s(46),
    borderRadius: s(23),
  },
  profileInfoCol: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userNameWithFlag: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  profileCountryFlag: {
    fontSize: 16,
    marginLeft: 6,
  },
  editBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  editBtnGrad: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  idPill: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 2.5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userId: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  genderSymbolFemale: {
    color: '#F472B6',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  genderSymbolMale: {
    color: '#60A5FA',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  profileBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 5,
    marginTop: 2,
  },
  levelBadgeImg: {
    width: 22,
    height: 22,
  },
  vipBadgeImg: {
    width: 24,
    height: 22,
  },
  honorBadgeImg: {
    width: 22,
    height: 22,
  },
  ownerBadgeImg: {
    width: 58,
    height: 20,
  },
  verifiedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  verifiedBadgeImg: {
    width: 58,
    height: 20,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  statBox: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(241, 245, 249, 0.9)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    width: '100%',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    width: '100%',
    textAlign: 'center',
    fontWeight: '500',
  },

  menuSection: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingTop: 18,
    paddingBottom: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  },
  menuTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  menuDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  menuDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  menuDotActive: {
    width: 22,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7C3AED',
  },
  menuPage: {
    width: screen.width - 32,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  menuGridItem: {
    width: (screen.width - 32) / 4,
    alignItems: 'center',
  },
  menuGridItemPressed: {
    transform: [{ scale: 0.94 }],
  },
  menuIconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIconBoxPressed: {
    backgroundColor: '#F5F3FF',
    borderColor: '#5B21B6',
    transform: [{ scale: 0.94 }],
  },
  menuGridLabel: {
    color: '#1E293B',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
    width: '100%',
  },
  menuGridLabelPressed: {
    color: '#5B21B6',
    fontWeight: '700',
  },

  bottomTabsBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124,77,255,0.12)',
  },
  bottomTabItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  bottomTabInner: {
    alignItems: 'center',
  },
  bottomTabInnerPressed: {
    transform: [{ scale: 0.96 }],
  },
  bottomTabText: {
    color: APP_TEXT_DIM,
    fontSize: 15,
    fontWeight: '600',
  },
  bottomTabActive: {
    color: APP_TEXT,
    fontWeight: '800',
  },
  bottomTabTextPressed: {
    color: '#5b21b6',
    fontWeight: '800',
  },
  bottomTabUnderline: {
    height: 3,
    alignSelf: 'stretch',
    backgroundColor: '#7c4dff',
    borderRadius: 2,
    marginTop: 6,
  },
  bottomTabUnderlinePressed: {
    backgroundColor: 'rgba(124,77,255,0.45)',
  },

  momentSection: {
    paddingHorizontal: 16,
    gap: 14,
  },
  shareCard: {
    backgroundColor: 'rgba(167,139,250,0.15)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.25)',
    gap: 12,
  },
  shareCardText: { flex: 1 },
  shareCardTitle: {
    color: APP_TEXT,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  shareCardSub: {
    color: APP_TEXT_MUTED,
    fontSize: 12,
    lineHeight: 18,
  },
  shareCardBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7c4dff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyEmoji: { fontSize: 48 },
  emptyText: {
    color: APP_TEXT_DIM,
    fontSize: 14,
  },
  momentPostCard: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: APP_CARD_BORDER,
    gap: 10,
  },
  momentPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  momentPostAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  momentPostAuthorAvatar: {
    borderRadius: 18,
  },
  momentPostAuthorInfo: {
    flexDirection: 'column',
    gap: 3,
  },
  momentPostTitle: {
    color: APP_TEXT,
    fontSize: 13,
    fontWeight: '700',
  },
  momentPostAuthorBatch: {
    width: 52,
    height: 21,
  },
  momentPostEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(124,77,255,0.18)',
  },
  momentPostEditText: {
    color: APP_PURPLE,
    fontSize: 12,
    fontWeight: '700',
  },
  momentPostText: {
    color: APP_TEXT,
    fontSize: 14,
    lineHeight: 20,
  },
  momentPostTextMuted: {
    color: APP_TEXT_DIM,
    fontSize: 13,
    fontStyle: 'italic',
  },
  momentPostImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  momentPostVideoBox: {
    height: 120,
    borderRadius: 12,
    backgroundColor: 'rgba(124,77,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  momentPostVideoLabel: {
    color: '#c4b5fd',
    fontSize: 14,
    fontWeight: '600',
  },
  momentPostMeta: {
    color: APP_TEXT_MUTED,
    fontSize: 12,
  },
  postEditInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: 'rgba(13,6,24,0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  modalCardScroll: {
    paddingBottom: 4,
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  editAvatarPreviewWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  editPhotoPreview: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(124,77,255,0.5)',
  },
  nameInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  sectionSmall: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 16,
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  avatarThumb: {
    width: '100%',
    height: '100%',
  },
  avatarSelected: {
    borderColor: '#7c3aed',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  modalBtnText: {
    color: 'white',
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#7c3aed',
  },
  saveBtnText: {
    color: 'white',
  },

  mmPanel: {
    flex: 1,
  },
  mmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 12,
  },
  mmHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: 'rgba(124,77,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.25)',
  },
  mmHeaderTitle: {
    flex: 1,
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
  },
  mmCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mmDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginHorizontal: 16,
  },

  mmScroll: {
    padding: 16,
    paddingBottom: 32,
  },
  mmSectionLabel: {
    color: '#c4b5fd',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 10,
  },
  mmPrimaryBtn: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 16,
    alignSelf: 'stretch',
  },
  mmPrimaryBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  mmPrimaryBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  mmOutlineBtn: {
    borderRadius: 24,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.4)',
    backgroundColor: 'rgba(124,77,255,0.1)',
    alignSelf: 'stretch',
  },
  mmOutlineBtnText: {
    color: '#a78bfa',
    fontSize: 15,
    fontWeight: '700',
    alignSelf: 'center',
  },
  mmSmallBtn: {
    backgroundColor: 'rgba(124,77,255,0.25)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
  },
  mmSmallBtnText: {
    color: '#a78bfa',
    fontSize: 13,
    fontWeight: '700',
  },
  mmInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    justifyContent: 'center',
  },
  mmInfoText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  mmProgressCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  mmProgressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mmProgressTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  mmProgressVal: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: '700',
  },
  mmProgressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  mmProgressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#7c4dff',
  },
  mmTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  mmTaskText: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  mmTaskTextDone: {
    color: 'rgba(255,255,255,0.35)',
  },
  mmTaskReward: {
    color: '#a78bfa',
    fontSize: 13,
    fontWeight: '700',
  },
  mmTaskProgress: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    marginTop: 2,
  },
  mmClaimBtn: {
    backgroundColor: '#7c4dff',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    marginLeft: 10,
  },
  mmClaimBtnDone: {
    backgroundColor: '#f1f5f9',
  },
  mmClaimBtnDisabled: {
    backgroundColor: 'rgba(124, 77, 255, 0.15)',
  },
  mmClaimBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  mmClaimBtnTextDone: {
    color: '#64748b',
  },
  mmClaimBtnTextDisabled: {
    color: '#7c4dff',
  },
  mmEmptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  mmEmptyTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  mmEmptySub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  mmHeroBox: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.2)',
    marginBottom: 4,
  },
  mmHeroTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '900',
  },
  mmHeroSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textAlign: 'center',
  },
  mmRelCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.2)',
  },
  mmRelTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  mmRelSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  mmBFFCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  mmBFFTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  mmBFFSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  mmMatchCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
  },
  mmMatchCardGrad: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  mmMatchAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    marginBottom: 4,
  },
  mmMatchName: {
    color: 'white',
    fontSize: 22,
    fontWeight: '900',
  },
  mmMatchLocation: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  mmMatchTags: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  mmMatchTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  mmMatchTagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  mmMatchActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 8,
  },
  mmMatchBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mmSocialIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  mmShareInvite: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  mmShareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 16,
  },
  mmShareItem: {
    alignItems: 'center',
    gap: 8,
  },
  mmShareIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mmShareLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '600',
  },
  mmBadgeProgress: {
    backgroundColor: 'rgba(124,77,255,0.15)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.25)',
  },
  mmBadgeProgressText: {
    color: '#a78bfa',
    fontSize: 13,
    fontWeight: '700',
  },
  mmBadgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  mmBadgeItem: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    gap: 4,
  },
  mmBadgeCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(124,77,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.2)',
  },
  mmBadgeLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  mmBadgeOwned: {
    backgroundColor: '#7c4dff',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  mmBadgeOwnedText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '800',
  },
  mmTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  mmTitleLabel: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  mmTitleSelectBtn: {
    backgroundColor: 'rgba(124,77,255,0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)',
  },
  mmTitleSelectText: {
    color: '#a78bfa',
    fontSize: 13,
    fontWeight: '700',
  },
  mmFeedbackHero: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 18,
  },
  mmFeedbackTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
  },
  mmFeedbackSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
  },
  mmFeedbackInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    color: 'white',
    fontSize: 14,
    minHeight: 110,
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.2)',
    marginBottom: 4,
  },
  mmFeedbackSentBox: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  mmFeedbackSentText: {
    color: '#4ade80',
    fontSize: 20,
    fontWeight: '900',
  },
  mmFeedbackSentSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    textAlign: 'center',
  },

  giftSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  giftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  giftHeaderTitle: {
    color: '#181424',
    fontSize: 18,
    fontWeight: '800',
  },
  giftEarnedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  giftEarnedText: {
    color: '#948fa8',
    fontSize: 13,
    fontWeight: '600',
  },
  giftSliderContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  giftSlider: {
    flexDirection: 'row',
    backgroundColor: '#ebe7f5',
    borderRadius: 24,
    padding: 3,
    width: 250,
  },
  giftSliderBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  giftSliderBtnActive: {},
  giftSliderBtnText: {
    color: '#7e7892',
    fontSize: 13.5,
    fontWeight: '600',
  },
  giftSliderBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  giftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  giftCard: {
    width: Math.floor((screen.width - 32 - 24) / 4),
    height: 102,
    backgroundColor: '#f7f9fe',
    borderRadius: 14,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  giftCardBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(150, 155, 175, 0.65)',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  giftCardBadgeText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '600',
    lineHeight: 12,
  },
  giftCardImageContainer: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  giftCardImage: {
    width: 48,
    height: 48,
  },
  giftCardImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftCardName: {
    color: '#544f68',
    fontSize: 11.5,
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
  taskRewardModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskRewardModalContainer: {
    width: '85%',
    backgroundColor: '#1e1b38',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  taskRewardModalImg: {
    width: '100%',
    height: 100,
    alignSelf: 'center',
  },
  taskRewardModalTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 20,
  },
  taskRewardModalSub: {
    color: '#a3a3c2',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
  },
  taskRewardModalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 12,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  taskRewardModalCardIconBg: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  taskRewardModalCardIcon: {
    width: 28,
    height: 28,
  },
  taskRewardModalCardText: {
    flex: 1,
  },
  taskRewardModalCardVal: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskRewardModalCardLabel: {
    color: '#a3a3c2',
    fontSize: 12,
  },
  taskRewardModalBtn: {
    width: '100%',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  },
  taskRewardModalBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  savedEmptyBox: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    gap: 8,
  },
  savedEmptyEmoji: {
    fontSize: 44,
  },
  savedEmptyTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  savedEmptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.15)',
  },
  savedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2d1b4e',
  },
  savedAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  savedSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  savedRemoveBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,107,107,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProfileScreen;
