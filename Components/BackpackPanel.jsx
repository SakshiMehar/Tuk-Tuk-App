import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { syncUserLevelForSession } from "../src/services/userLevelService";

const CATEGORIES = ["All", "Frames", "Effects", "Badges", "Backgrounds"];

// Shown until the gamification profile's real inventory loads (or as a permanent
// fallback if it comes back empty) — same placeholder items the old flat grid had.
const FALLBACK_ITEMS = [
  { id: "avatarFrame", icon: "person-circle", label: "Avatar Frame", category: "Frames", qty: 1 },
  { id: "entryEffect", icon: "sparkles", label: "Entry Effect", category: "Effects", qty: 0 },
  { id: "bubbleTheme", icon: "chatbubble-ellipses", label: "Chat Bubble", category: "Effects", qty: 0 },
  { id: "roomBadge", icon: "ribbon", label: "Room Badge", category: "Badges", qty: 2 },
  { id: "vipEffect", icon: "flame", label: "VIP Effect", category: "Effects", qty: 0 },
  { id: "profileBg", icon: "image", label: "Profile BG", category: "Backgrounds", qty: 1 },
];

const CATEGORY_ICON = {
  Frames: "person-circle",
  Effects: "sparkles",
  Badges: "ribbon",
  Backgrounds: "image",
};

const firstDefined = (...values) => values.find((v) => v !== undefined && v !== null);

// Defensive — real inventory field names aren't confirmed yet, same situation the
// invite-friends /config had before we saw its actual response shape.
const normalizeInventoryItem = (item, index) => ({
  id: String(firstDefined(item?.id, item?.itemId, `inv-${index}`)),
  label: firstDefined(item?.name, item?.label, item?.title) ?? "Item",
  category: firstDefined(item?.category, item?.type) ?? "Effects",
  qty: Number(firstDefined(item?.quantity, item?.qty, item?.count, 1)),
  imageUrl: firstDefined(item?.imageUrl, item?.iconUrl, item?.assetUrl) ?? null,
  equipped: Boolean(item?.equipped),
});

const notWiredYet = () => Alert.alert("Not available yet", "This isn't wired up to the backend yet.");

function SectionRibbon({ title }) {
  return (
    <View style={styles.ribbonRow}>
      <Ionicons name="briefcase" size={14} color="#e879f9" />
      <Text style={styles.ribbonText}>{title}</Text>
      <Ionicons name="briefcase" size={14} color="#e879f9" />
    </View>
  );
}

function EquippedSlot({ label, item }) {
  return (
    <View style={styles.equippedSlot}>
      <View style={styles.equippedIconWrap}>
        {item?.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.equippedImage} contentFit="cover" />
        ) : (
          <Ionicons name={item ? CATEGORY_ICON[item.category] ?? "cube" : "help-circle-outline"} size={26} color="#e879f9" />
        )}
      </View>
      <Text style={styles.equippedLabel} numberOfLines={1}>{item?.label ?? `No ${label} equipped`}</Text>
      <Text style={styles.equippedSub}>{label}</Text>
    </View>
  );
}

export default function BackpackPanel() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [items, setItems] = useState(FALLBACK_ITEMS);
  const [equippedBadge, setEquippedBadge] = useState(null);
  const [equippedFrame, setEquippedFrame] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await syncUserLevelForSession();
      if (cancelled) return;
      const xp = result?.xp;
      if (Array.isArray(xp?.inventory) && xp.inventory.length > 0) {
        setItems(xp.inventory.map(normalizeInventoryItem));
      }
      setEquippedBadge(xp?.equippedBadge ?? null);
      setEquippedFrame(xp?.equippedFrame ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleItems = activeCategory === "All" ? items : items.filter((it) => it.category === activeCategory);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.equippedRow}>
          <EquippedSlot label="Frame" item={equippedFrame ? normalizeInventoryItem(equippedFrame, "frame") : null} />
          <EquippedSlot label="Badge" item={equippedBadge ? normalizeInventoryItem(equippedBadge, "badge") : null} />
        </View>

        <SectionRibbon title="My Backpack" />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.map((cat) => {
            const active = cat === activeCategory;
            return (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.8}
                onPress={() => setActiveCategory(cat)}
                style={[styles.categoryPill, active && styles.categoryPillActive]}
              >
                <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {visibleItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="cube-outline" size={32} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>Nothing in this category yet.</Text>
          </View>
        ) : (
          <View style={styles.itemGrid}>
            {visibleItems.map((it) => {
              const owned = it.qty > 0;
              const isEquipped =
                (equippedFrame && it.id === String(firstDefined(equippedFrame?.id, equippedFrame?.itemId))) ||
                (equippedBadge && it.id === String(firstDefined(equippedBadge?.id, equippedBadge?.itemId)));
              return (
                <View key={it.id} style={[styles.itemCard, !owned && styles.itemCardLocked]}>
                  <View style={styles.itemIconWrap}>
                    {it.imageUrl ? (
                      <Image source={{ uri: it.imageUrl }} style={styles.itemImage} contentFit="cover" />
                    ) : (
                      <Ionicons
                        name={it.icon ?? CATEGORY_ICON[it.category] ?? "cube"}
                        size={26}
                        color={owned ? "#e879f9" : "rgba(255,255,255,0.25)"}
                      />
                    )}
                  </View>
                  <Text style={[styles.itemLabel, !owned && styles.itemLabelLocked]} numberOfLines={1}>
                    {it.label}
                  </Text>
                  {owned ? (
                    <TouchableOpacity
                      style={[styles.equipBtn, isEquipped && styles.equipBtnActive]}
                      activeOpacity={0.8}
                      onPress={notWiredYet}
                    >
                      <Text style={[styles.equipBtnText, isEquipped && styles.equipBtnTextActive]}>
                        {isEquipped ? "Equipped" : `Equip ×${it.qty}`}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.itemEmpty}>None</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity style={styles.storeLink} activeOpacity={0.8} onPress={notWiredYet}>
          <Text style={styles.storeLinkText}>Go to Store</Text>
          <Ionicons name="chevron-forward" size={14} color="#a78bfa" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  equippedRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  equippedSlot: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(124,77,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.35)",
    borderRadius: 18,
    paddingVertical: 16,
  },
  equippedIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(124,77,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.3)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 8,
  },
  equippedImage: {
    width: "100%",
    height: "100%",
  },
  equippedLabel: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
    maxWidth: "90%",
  },
  equippedSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    marginTop: 2,
  },
  ribbonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },
  ribbonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  categoryRow: {
    gap: 8,
    paddingBottom: 18,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  categoryPillActive: {
    backgroundColor: "#7c4dff",
    borderColor: "#e879f9",
  },
  categoryPillText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "700",
  },
  categoryPillTextActive: {
    color: "white",
  },
  emptyBox: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 40,
  },
  emptyText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
  },
  itemGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  itemCard: {
    width: "31%",
    alignItems: "center",
    backgroundColor: "rgba(124,77,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  itemCardLocked: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.06)",
  },
  itemIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(124,77,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.3)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 8,
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  itemLabel: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  itemLabelLocked: {
    color: "rgba(255,255,255,0.35)",
  },
  itemEmpty: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
  },
  equipBtn: {
    backgroundColor: "rgba(124,77,255,0.25)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  equipBtnActive: {
    backgroundColor: "#e879f9",
  },
  equipBtnText: {
    color: "#e879f9",
    fontSize: 11,
    fontWeight: "800",
  },
  equipBtnTextActive: {
    color: "white",
  },
  storeLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 14,
  },
  storeLinkText: {
    color: "#a78bfa",
    fontSize: 13,
    fontWeight: "700",
  },
});
