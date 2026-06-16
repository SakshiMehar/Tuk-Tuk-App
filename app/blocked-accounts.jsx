import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { loadBlocked, unblockUser } from "../src/services/relationshipService";

export default function BlockedAccounts() {
  const router = useRouter();
  const [blockedAccounts, setBlockedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [unblockingId, setUnblockingId] = useState(null);

  const fetchBlockedAccounts = useCallback(async () => {
    setLoading(true);
    console.log(
      "[BlockedAccounts] loading block-users -> GET /api/relationships/block-users"
    );
    try {
      setLoadError(null);
      const list = await loadBlocked();
      setBlockedAccounts(list);
      console.log(
        "[BlockedAccounts] block-users count:",
        list.length,
        JSON.stringify(list, null, 2)
      );
    } catch (err) {
      console.log("[BlockedAccounts] load failed:", err?.message);
      setLoadError(err?.message || "Could not load blocked users.");
      setBlockedAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBlockedAccounts();
    }, [fetchBlockedAccounts])
  );

  const handleUnblock = async (user) => {
    const targetId = user?.userId ?? user?.id;
    if (!targetId || unblockingId) return;

    setUnblockingId(String(targetId));
    console.log("[BlockedAccounts] unblock request:", String(targetId));
    try {
      const response = await unblockUser(targetId);
      console.log(
        "[BlockedAccounts] unblock success:",
        JSON.stringify(response, null, 2)
      );
      setBlockedAccounts((prev) =>
        prev.filter((item) => String(item.userId ?? item.id) !== String(targetId))
      );
    } catch (err) {
      console.log("[BlockedAccounts] unblock failed:", err?.message);
      Alert.alert("Unblock failed", err?.message || "Please try again.");
    } finally {
      setUnblockingId(null);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="person-remove-outline" size={56} color="#a78bfa" />
      </View>
      <Text style={styles.emptyTitle}>No blocked accounts</Text>
      <Text style={styles.emptyText}>
        Users you block will appear here
      </Text>
    </View>
  );

  const renderBlockedAccount = ({ item }) => {
    const targetId = item.userId ?? item.id;
    const isUnblocking = unblockingId === String(targetId);

    return (
      <View style={styles.accountCard}>
        <View style={styles.accountLeft}>
          <View style={styles.avatarWrapper}>
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color="#a78bfa" />
              </View>
            )}
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>{item.name}</Text>
            <Text style={styles.accountId}>ID: {targetId}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.unblockBtn, isUnblocking && styles.unblockBtnDisabled]}
          activeOpacity={0.8}
          disabled={isUnblocking}
          onPress={() => handleUnblock(item)}
        >
          {isUnblocking ? (
            <ActivityIndicator size="small" color="#a78bfa" />
          ) : (
            <Text style={styles.unblockText}>Unblock</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0618" />
      <LinearGradient
        colors={["#1a0a2e", "#16082a", "#0d0618", "#1a0a2e", "#2d1b4e"]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Blocked accounts</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Manage your blocked users list</Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#a78bfa" />
          </View>
        ) : loadError ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Could not load block list</Text>
            <Text style={styles.emptyText}>{loadError}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={fetchBlockedAccounts}
              activeOpacity={0.8}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : blockedAccounts.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={blockedAccounts}
            keyExtractor={(item) => String(item.userId ?? item.id)}
            renderItem={renderBlockedAccount}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0618",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  subtitle: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    marginBottom: 24,
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(124, 77, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "white",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: "rgba(167, 139, 250, 0.15)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.3)",
  },
  retryText: {
    color: "#a78bfa",
    fontSize: 14,
    fontWeight: "700",
  },
  accountCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  accountLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(167, 139, 250, 0.3)",
  },
  avatar: {
    flex: 1,
    backgroundColor: "rgba(124, 77, 255, 0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: "700",
    color: "white",
    marginBottom: 2,
  },
  accountId: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
  },
  unblockBtn: {
    backgroundColor: "rgba(167, 139, 250, 0.15)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.3)",
    minWidth: 72,
    alignItems: "center",
  },
  unblockBtnDisabled: {
    opacity: 0.6,
  },
  unblockText: {
    color: "#a78bfa",
    fontSize: 12,
    fontWeight: "700",
  },
});
