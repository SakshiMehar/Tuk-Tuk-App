import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getFollowing, getFollowers } from '../../../api/relationshipApi';
import { getProfileVisits } from '../../../api/userApi';
import { openUserChat } from '../../../utils/chatNavigation';
import { resolveLocalLevelBadge } from '../../../utils/levelBadge';
import { ProfileAvatarWithFrame } from '../components/ProfileAvatarWithFrame/ProfileAvatarWithFrame';

interface ProfileConnectionsModalProps {
  visible: boolean;
  type: 'following' | 'followers' | 'visitors' | null;
  onClose: () => void;
}

const TITLES: Record<string, string> = {
  following: 'Following',
  followers: 'Followers',
  visitors: 'Profile Visitors',
};

const EMPTY_COPY: Record<string, { title: string; sub: string }> = {
  following: {
    title: 'Not following anyone yet',
    sub: 'Explore voice parties or nearby users to follow people!',
  },
  followers: {
    title: 'No followers yet',
    sub: 'Share moments and join voice parties to grow your audience!',
  },
  visitors: {
    title: 'No visitors yet',
    sub: 'People who view your profile will appear here.',
  },
};

export const ProfileConnectionsModal: React.FC<ProfileConnectionsModalProps> = ({
  visible,
  type,
  onClose,
}) => {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    if (!type) return;
    setLoading(true);
    setError(null);

    try {
      let data: any = [];
      if (type === 'following') {
        data = await getFollowing();
      } else if (type === 'followers') {
        data = await getFollowers();
      } else {
        data = await getProfileVisits(50);
      }

      const list = Array.isArray(data)
        ? data
        : data?.users ?? data?.content ?? data?.data ?? data?.items ?? [];

      const normalized = list.map((item: any) => {
        const raw = item?.visitor ?? item?.user ?? item;
        return {
          id: raw?.userId ?? raw?.id ?? '',
          userId: raw?.userId ?? raw?.id ?? '',
          name: raw?.name ?? raw?.displayName ?? 'User',
          avatar: raw?.avatarUrl ?? raw?.avatar ?? raw?.profilePicUrl ?? null,
          level: raw?.level ?? 1,
          online: Boolean(raw?.online ?? raw?.isOnline),
        };
      });

      setUsers(normalized);
    } catch (err: any) {
      setError(err?.message || 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    if (visible && type) {
      fetchList();
    } else {
      setUsers([]);
      setError(null);
    }
  }, [visible, type, fetchList]);

  const handleUserPress = async (user: any) => {
    await openUserChat(router, user);
    onClose?.();
  };

  const empty = type ? EMPTY_COPY[type] : EMPTY_COPY.following;

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.85}
      onPress={() => handleUserPress(item)}
    >
      <View style={styles.avatarWrap}>
        <ProfileAvatarWithFrame
          user={item}
          avatarSource={item.avatar ? { uri: item.avatar } : undefined}
          size={48}
          placeholderInitial={item.name?.[0]?.toUpperCase() ?? '?'}
        />
        {item.online && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.rowInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          {item.level != null && (
            <Image
              source={resolveLocalLevelBadge(item.level)}
              style={styles.levelBadge}
              resizeMode="contain"
            />
          )}
        </View>
        <Text style={styles.handle}>ID: {item.userId}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.25)" />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a0a2e', '#16082a', '#0d0618', '#1a0a2e']}
          locations={[0, 0.3, 0.65, 1]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>{type ? TITLES[type] : ''}</Text>
            <View style={styles.headerSpacer} />
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#a78bfa" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchList} activeOpacity={0.85}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={users}
              keyExtractor={(item) => String(item.userId ?? item.id)}
              renderItem={renderItem}
              contentContainerStyle={users.length === 0 ? styles.emptyList : styles.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyEmoji}>
                    {type === 'visitors' ? '👀' : type === 'followers' ? '🫂' : '⭐'}
                  </Text>
                  <Text style={styles.emptyTitle}>{empty.title}</Text>
                  <Text style={styles.emptySub}>{empty.sub}</Text>
                </View>
              }
            />
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0618' },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(167,139,250,0.15)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.25)',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSpacer: { width: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  loadingText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '600' },
  errorText: { color: '#f87171', fontSize: 14, textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(124,77,255,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.4)',
  },
  retryText: { color: 'white', fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 },
  emptyList: { flexGrow: 1, paddingHorizontal: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.15)',
  },
  avatarWrap: { position: 'relative', marginRight: 12 },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#00e676',
    borderWidth: 2,
    borderColor: '#0d0618',
  },
  rowInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: 'white', fontSize: 15, fontWeight: '700', flexShrink: 1 },
  levelBadge: { height: 16, width: 16 * (142 / 149), flexShrink: 0 },
  handle: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: 'white', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptySub: { color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});

export default ProfileConnectionsModal;
