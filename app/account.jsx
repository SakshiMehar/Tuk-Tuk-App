import { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Modal,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { getUser, updateUser } from "../src/store/authStore";

const avatarMap = {
  avatar1: require("../assets/Avatar/avatar1.webp"),
  avatar2: require("../assets/Avatar/avatar2.webp"),
  avatar3: require("../assets/Avatar/avatar3.webp"),
  avatar4: require("../assets/Avatar/avatar4.webp"),
  avatar5: require("../assets/Avatar/avatar5.webp"),
};
const avatarOptions = Object.keys(avatarMap);

const accountFields = [
  { key: "avatar", label: "Avatar", type: "avatar", note: "New" },
  { key: "gender", label: "Gender", type: "select", options: ["Female", "Male", "Other"] },
  { key: "name", label: "Nickname", type: "text", placeholder: "Enter nickname" },
  { key: "birthday", label: "Birthday", type: "text", placeholder: "YYYY-MM-DD" },
  { key: "interests", label: "Interests", type: "text", placeholder: "Enter your interests" },
  { key: "education", label: "Education", type: "text", placeholder: "Enter education" },
  { key: "school", label: "School", type: "text", placeholder: "Enter school" },
  { key: "occupation", label: "Occupation", type: "text", placeholder: "Enter occupation" },
  { key: "language", label: "Spoken Language", type: "text", placeholder: "Enter languages" },
  { key: "about", label: "About me", type: "text", placeholder: "Write a short bio" },
];

const answerFields = [
  { key: "sports", label: "What sports are you into?", placeholder: "Tell us your favorite sports" },
  { key: "music", label: "What music do you like?", placeholder: "Tell us your favorite music" },
  { key: "food", label: "What's your favorite food?", placeholder: "Tell us your favorite food" },
  { key: "movies", label: "Favorite movies and TV shows?", placeholder: "Share your favorites" },
  { key: "books", label: "What books do you prefer?", placeholder: "Share your reading taste" },
];

export default function Account() {
  const router = useRouter();
  const [profile, setProfile] = useState({
    avatarId: "avatar1",
    name: "sakku",
    gender: "Female",
    birthday: "2002-02-01",
    interests: "",
    education: "Post Graduation",
    school: "",
    occupation: "",
    language: "",
    about: "",
    sports: "",
    music: "",
    food: "",
    movies: "",
    books: "",
  });
  const [editingField, setEditingField] = useState(null);
  const [editorValue, setEditorValue] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatarId);
  const currentAvatar = avatarMap[profile.avatarId] || avatarMap.avatar1;

  const filledFields = useMemo(() => {
    const keys = [
      "name",
      "gender",
      "birthday",
      "interests",
      "education",
      "school",
      "occupation",
      "language",
      "about",
    ];
    return keys.filter((key) => profile[key]?.trim().length > 0).length;
  }, [profile]);

  const progress = Math.round((filledFields / 9) * 100);

  const openEditor = (fieldKey) => {
    const fieldValue = profile[fieldKey] ?? "";
    setEditingField(fieldKey);
    setEditorValue(typeof fieldValue === "string" ? fieldValue : "");
    setSelectedAvatar(profile.avatarId);
  };

  const saveField = async () => {
    if (!editingField) {
      return;
    }
    const fieldValue = editingField === "avatar" ? selectedAvatar : editorValue;
    setProfile((prev) => ({
      ...prev,
      [editingField]: fieldValue,
    }));
    await updateUser({
      [editingField === "avatar" ? "avatarId" : editingField]: fieldValue,
    });
    setEditingField(null);
  };

  const currentField =
    accountFields.find((item) => item.key === editingField) ||
    answerFields.find((item) => item.key === editingField);

  useFocusEffect(
    useCallback(() => {
      const loadUserProfile = async () => {
        const user = await getUser();
        if (user) {
          setProfile((prev) => ({
            ...prev,
            ...user,
          }));
          if (user.avatarId) {
            setSelectedAvatar(user.avatarId);
          }
        }
      };
      loadUserProfile();
    }, [])
  );

  const editingTitle = currentField?.label || "Edit";
  const isAvatarField = editingField === "avatar";
  const isGenderField = editingField === "gender";
  const isTextField = !isAvatarField && !isGenderField;
  const isMultiline = ["about", "interests", "sports", "music", "food", "movies", "books"].includes(editingField);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0618" />
      <LinearGradient
        colors={["#1a0a2e", "#16082a", "#0d0618", "#1a0a2e", "#2d1b4e"]}
        locations={[0, 0.18, 0.45, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.8} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Account</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.progressCard}>
          <View style={styles.progressInner}>
            <View style={styles.avatarRing}>
              <View style={styles.avatarSprinkles}>
                <View style={[styles.sprinkleDot, styles.sprinkleDotOne]} />
                <View style={[styles.sprinkleDot, styles.sprinkleDotTwo]} />
                <View style={[styles.sprinkleDot, styles.sprinkleDotThree]} />
                <View style={[styles.sprinkleDot, styles.sprinkleDotFour]} />
              </View>
              <View style={styles.avatarWrapper}>
                <Image source={currentAvatar} style={styles.accountAvatar} />
              </View>
            </View>
          </View>
          <Text style={styles.progressValue}>{progress}% complete</Text>
          <Text style={styles.progressLabel}>Complete your account info to attract more like-minded mates</Text>
        </View>

        <Text style={styles.sectionTitle}>Personal info</Text>
        <View style={styles.listCard}>
          {accountFields.map((item) => {
            const value = item.key === "avatar" ? undefined : profile[item.key];
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.listItem}
                activeOpacity={0.7}
                onPress={() => openEditor(item.key)}
              >
                <View style={styles.itemLeft}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  {value ? <Text style={styles.itemValue}>{value}</Text> : null}
                </View>
                <View style={styles.itemRight}>
                  {item.note ? <View style={styles.noteBadge}><Text style={styles.noteText}>{item.note}</Text></View> : null}
                  <View style={styles.plusButton}>
                    <Ionicons name="add" size={16} color="white" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>My answers</Text>
        <View style={styles.listCard}>
          {answerFields.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.listItem}
              activeOpacity={0.7}
              onPress={() => openEditor(item.key)}
            >
              <View style={styles.itemLeft}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                {profile[item.key] ? <Text style={styles.itemValue}>{profile[item.key]}</Text> : null}
              </View>
              <View style={styles.itemRight}>
                <View style={styles.plusButton}>
                  <Ionicons name="add" size={16} color="white" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal visible={Boolean(editingField)} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingTitle}</Text>
            {isAvatarField ? (
              <View style={styles.avatarSelectionRow}>
                {avatarOptions.map((id) => (
                  <TouchableOpacity
                    key={id}
                    style={[
                      styles.avatarOption,
                      selectedAvatar === id && styles.avatarOptionActive,
                    ]}
                    onPress={() => setSelectedAvatar(id)}
                    activeOpacity={0.8}
                  >
                    <Image source={avatarMap[id]} style={styles.avatarOptionImage} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : isGenderField ? (
              <View style={styles.selectRow}>
                {accountFields
                  .find((item) => item.key === "gender")
                  .options.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.selectOption,
                        editorValue === option && styles.selectOptionActive,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => setEditorValue(option)}
                    >
                      <Text
                        style={[
                          styles.selectOptionText,
                          editorValue === option && styles.selectOptionTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            ) : (
              <TextInput
                value={editorValue}
                onChangeText={setEditorValue}
                placeholder={currentField?.placeholder || "Enter value"}
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={[styles.modalInput, isMultiline && styles.modalInputMultiline]}
                multiline={isMultiline}
              />
            )}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setEditingField(null)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={saveField}>
                <Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0618",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 14,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  screenTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
  },
  progressCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  progressInner: {
    width: 132,
    height: 132,
    borderRadius: 66,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
    elevation: 12,
    position: "relative",
  },
  avatarSprinkles: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
  },
  sprinkleDot: {
    position: "absolute",
    borderRadius: 50,
  },
  sprinkleDotOne: {
    width: 10,
    height: 10,
    top: 18,
    left: 24,
    backgroundColor: "#c084fc",
    opacity: 0.95,
  },
  sprinkleDotTwo: {
    width: 6,
    height: 6,
    top: 22,
    right: 22,
    backgroundColor: "#ff69b4",
    opacity: 0.85,
  },
  sprinkleDotThree: {
    width: 8,
    height: 8,
    bottom: 20,
    left: 26,
    backgroundColor: "#a78bfa",
    opacity: 0.9,
  },
  sprinkleDotFour: {
    width: 5,
    height: 5,
    bottom: 28,
    right: 18,
    backgroundColor: "#c4b5fd",
    opacity: 0.8,
  },
  avatarWrapper: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  accountAvatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  progressValue: {
    color: "#c4b5fd",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  progressLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  listCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    marginBottom: 18,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  itemLeft: {
    flex: 1,
    paddingRight: 12,
  },
  itemLabel: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  itemValue: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    lineHeight: 18,
  },
  itemRight: {
    alignItems: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  noteBadge: {
    backgroundColor: "#f43f5e",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  noteText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },
  plusButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#120723",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16,
  },
  avatarSelectionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 20,
  },
  avatarOption: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  avatarOptionActive: {
    borderColor: "#7c3aed",
  },
  avatarOptionImage: {
    width: "100%",
    height: "100%",
  },
  selectRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },
  selectOption: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selectOptionActive: {
    backgroundColor: "#7c3aed",
  },
  selectOptionText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "700",
  },
  selectOptionTextActive: {
    color: "white",
  },
  modalInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: "white",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 20,
  },
  modalInputMultiline: {
    height: 120,
    textAlignVertical: "top",
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalButton: {
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  modalButtonPrimary: {
    backgroundColor: "#7c3aed",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  modalButtonPrimaryText: {
    color: "white",
  },
});
