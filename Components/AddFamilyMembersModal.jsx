import { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { loadFollowing } from "../src/services/relationshipService";
import { addMembersToFamilyGroup } from "../src/services/familyService";

export default function AddFamilyMembersModal({ visible, family, onClose, onAdded }) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await loadFollowing();
      setCandidates(list.filter((u) => u.userId));
    } catch (err) {
      console.error("[AddFamilyMembersModal] Failed to load following list", err);
      setError(err?.message || "Could not load people you follow.");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchCandidates();
    } else {
      setCandidates([]);
      setSelectedIds(new Set());
      setError(null);
    }
  }, [visible, fetchCandidates]);

  const allSelected = useMemo(
    () => candidates.length > 0 && selectedIds.size === candidates.length,
    [candidates.length, selectedIds.size]
  );

  const toggleUser = (userId) => {
    const id = String(userId);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(candidates.map((c) => String(c.userId))));
  };

  const handleAddMembers = async () => {
    const userIds = Array.from(selectedIds).map((id) => Number(id) || id);
    if (userIds.length === 0 || !family?.id) return;

    setAdding(true);
    try {
      const result = await addMembersToFamilyGroup(family.id, userIds);
      console.log("[AddFamilyMembersModal] addFamilyMembers result", result);
      Alert.alert("Members added", `Added ${userIds.length} member${userIds.length === 1 ? "" : "s"} to ${family.name}.`);
      setSelectedIds(new Set());
      onAdded?.(result);
      onClose?.();
    } catch (err) {
      console.error("[AddFamilyMembersModal] addFamilyMembers failed", err);
      Alert.alert("Couldn't add members", err?.message || "Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const renderItem = ({ item }) => {
    const userId = String(item.userId);
    const checked = selectedIds.has(userId);

    return (
      <TouchableOpacity
        style={[styles.row, checked && styles.rowSelected]}
        activeOpacity={0.85}
        onPress={() => toggleUser(userId)}
      >
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <Ionicons name="checkmark" size={14} color="white" />}
        </View>
        <View style={styles.avatarWrap}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Ionicons name="person" size={20} color="#a78bfa" />
            </View>
          )}
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.subText}>ID: {userId}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <LinearGradient
          colors={["#1a0a2e", "#16082a", "#0d0618", "#1a0a2e"]}
          locations={[0, 0.3, 0.65, 1]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safe} edges={["top"]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            <Text style={styles.title} numberOfLines={1}>Add members</Text>
            <View style={styles.headerSpacer} />
          </View>

          <Text style={styles.subtitle}>
            Select from people you follow to add to {family?.name || "this family"}
          </Text>

          {!loading && !error && candidates.length > 0 && (
            <TouchableOpacity style={styles.selectAllBtn} onPress={handleSelectAll} activeOpacity={0.85}>
              <View style={[styles.checkbox, allSelected && styles.checkboxChecked]}>
                {allSelected && <Ionicons name="checkmark" size={14} color="white" />}
              </View>
              <Text style={styles.selectAllText}>
                {allSelected ? "Deselect all" : "Select all"}
              </Text>
              <Text style={styles.selectCount}>
                {selectedIds.size}/{candidates.length}
              </Text>
            </TouchableOpacity>
          )}

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#a78bfa" />
              <Text style={styles.loadingText}>Loading people you follow...</Text>
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchCandidates} activeOpacity={0.85}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={candidates}
              keyExtractor={(item) => String(item.userId)}
              renderItem={renderItem}
              style={styles.listFlex}
              contentContainerStyle={candidates.length === 0 ? styles.emptyList : styles.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyEmoji}>👥</Text>
                  <Text style={styles.emptyTitle}>Not following anyone yet</Text>
                  <Text style={styles.emptySub}>
                    Follow people from their profile — they&apos;ll appear here to add as members
                  </Text>
                </View>
              }
            />
          )}

          <View style={[styles.footer, { paddingBottom: bottomInset + 8 }]}>
            <TouchableOpacity
              style={[
                styles.addBtn,
                (selectedIds.size === 0 || adding) && styles.addBtnDisabled,
              ]}
              activeOpacity={0.85}
              disabled={selectedIds.size === 0 || adding}
              onPress={handleAddMembers}
            >
              <LinearGradient
                colors={
                  selectedIds.size === 0 || adding
                    ? ["#4b5563", "#374151"]
                    : ["#7c4dff", "#a855f7"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addBtnGradient}
              >
                {adding ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="person-add-outline" size={18} color="white" />
                    <Text style={styles.addBtnText}>
                      Add members{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0618" },
  safe: { flex: 1 },
  listFlex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(167,139,250,0.15)",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
  headerSpacer: { width: 40 },
  subtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    lineHeight: 18,
  },
  selectAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(124,77,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    gap: 10,
  },
  selectAllText: {
    flex: 1,
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  selectCount: {
    color: "#a78bfa",
    fontSize: 13,
    fontWeight: "700",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(167,139,250,0.5)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkboxChecked: {
    backgroundColor: "#7c4dff",
    borderColor: "#7c4dff",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  loadingText: { color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: "600" },
  errorText: { color: "#f87171", fontSize: 14, textAlign: "center" },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(124,77,255,0.35)",
  },
  retryText: { color: "white", fontWeight: "700" },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  emptyList: { flexGrow: 1, paddingHorizontal: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.12)",
    gap: 10,
  },
  rowSelected: {
    backgroundColor: "rgba(124,77,255,0.12)",
    borderColor: "rgba(167,139,250,0.35)",
  },
  avatarWrap: { marginRight: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(124,77,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowInfo: { flex: 1, gap: 2 },
  name: { color: "white", fontSize: 15, fontWeight: "700" },
  subText: { color: "rgba(255,255,255,0.45)", fontSize: 12 },
  empty: { alignItems: "center", paddingTop: 60, gap: 10, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: "white", fontSize: 17, fontWeight: "800" },
  emptySub: { color: "rgba(255,255,255,0.45)", fontSize: 13, textAlign: "center" },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(167,139,250,0.15)",
  },
  addBtn: { borderRadius: 14, overflow: "hidden" },
  addBtnDisabled: { opacity: 0.7 },
  addBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  addBtnText: { color: "white", fontSize: 16, fontWeight: "800" },
});
