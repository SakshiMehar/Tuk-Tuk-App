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
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { getUser, getToken, updateUser } from "../src/store/authStore";
import { refreshTokenCache } from "../src/api/axios";
import {
  loadUserProfile,
  mergeProfileState,
  updateUserProfile,
} from "../src/services/userProfileService";
import { syncUserCountryToServer } from "../src/services/userCountryService";
import {
  avatarMap,
  avatarOptions,
  getAvatarSource,
  DEFAULT_AVATAR_ID,
} from "../src/data/avatarOptions";
import { resolveProfileAvatarSource } from "../src/utils/profileAvatar";
import { syncNewUserFrameForSession } from "../src/services/newUserFrameService";
import ProfileAvatarWithFrame from "../Components/ProfileAvatarWithFrame";
import {
  COUNTRY_OPTIONS,
  DEFAULT_COUNTRY,
  findCountryByCode,
  findCountryByName,
  formatCountryLabel,
} from "../src/data/countryOptions";

const accountFields = [
  { key: "avatar", label: "Avatar", type: "avatar", note: "New" },
  { key: "gender", label: "Gender", type: "select", options: ["Female", "Male", "Other"] },
  { key: "country", label: "Country", type: "country" },
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
  const insets = useSafeAreaInsets();
  const scrollBottomPad = 24 + Math.max(insets.bottom, 16);
  const [profile, setProfile] = useState({
    avatarId: DEFAULT_AVATAR_ID,
    useLocalAvatar: false,
    profilePicUrl: null,
    displayName: "",
    name: "",
    gender: "",
    country: "",
    countryCode: "",
    birthday: "",
    interests: "",
    education: "",
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
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATAR_ID);
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [countrySearch, setCountrySearch] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [newUserFrameSource, setNewUserFrameSource] = useState(null);
  const currentAvatar = resolveProfileAvatarSource({
    avatarId: profile.avatarId,
    useLocalAvatar: profile.useLocalAvatar,
    profilePicUrl: profile.profilePicUrl,
  });

  const filledFields = useMemo(() => {
    const keys = [
      "name",
      "gender",
      "country",
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

  const progress = Math.round((filledFields / 10) * 100);

  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase();
    if (!query) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.code.includes(query)
    );
  }, [countrySearch]);

  const openEditor = (fieldKey) => {
    if (fieldKey === "country") {
      const match =
        findCountryByName(profile.country) ??
        findCountryByCode(profile.countryCode) ??
        DEFAULT_COUNTRY;
      setSelectedCountry(match);
      setCountrySearch("");
      setEditingField("country");
      return;
    }

    const fieldValue = profile[fieldKey] ?? "";
    setEditingField(fieldKey);
    setEditorValue(typeof fieldValue === "string" ? fieldValue : "");
    setSelectedAvatar(profile.avatarId);
  };

  const saveField = async () => {
    if (!editingField || profileSaving) {
      return;
    }

    const isAvatarSave = editingField === "avatar";
    const isCountrySave = editingField === "country";
    const fieldKey = isAvatarSave ? "avatarId" : editingField;
    const fieldValue = isAvatarSave
      ? selectedAvatar
      : isCountrySave
        ? selectedCountry.name
        : editorValue;
    const localUpdates = isAvatarSave
      ? { avatarId: selectedAvatar, useLocalAvatar: true }
      : isCountrySave
        ? { country: selectedCountry.name, countryCode: selectedCountry.code }
        : { [fieldKey]: fieldValue };

    setProfileSaving(true);
    try {
      await refreshTokenCache();
      const token = await getToken();
      if (!token) {
        throw new Error("Please log in again to save your profile.");
      }

      let savedProfile = null;
      if (!isAvatarSave && editingField !== "food") {
        const apiUpdates = isCountrySave
          ? {
              country: selectedCountry.name,
              countryCode: selectedCountry.code,
              countryName: selectedCountry.name,
            }
          : { [fieldKey]: fieldValue };
        savedProfile = await updateUserProfile(apiUpdates);
        if (isCountrySave) {
          await syncUserCountryToServer({
            country: selectedCountry.name,
            countryCode: selectedCountry.code,
          });
        }
      }

      setProfile((prev) =>
        mergeProfileState(
          prev,
          savedProfile && !isAvatarSave ? savedProfile : {},
          localUpdates
        )
      );

      const mergedProfile = mergeProfileState(
        profile,
        savedProfile && !isAvatarSave ? savedProfile : {},
        localUpdates
      );

      await updateUser({
        ...(savedProfile && !isAvatarSave
          ? {
              nickname: mergedProfile.name,
              aboutMe: mergedProfile.about,
              favoriteMoviesAndTvShows: mergedProfile.movies,
              spokenLanguage: mergedProfile.language,
              profilePicUrl: mergedProfile.profilePicUrl,
              name: mergedProfile.displayName || undefined,
              gender: mergedProfile.gender,
              country: mergedProfile.country,
              countryCode: mergedProfile.countryCode,
              birthday: mergedProfile.birthday,
              interests: mergedProfile.interests,
              education: mergedProfile.education,
              school: mergedProfile.school,
              occupation: mergedProfile.occupation,
              sports: mergedProfile.sports,
              music: mergedProfile.music,
              books: mergedProfile.books,
            }
          : {}),
        ...localUpdates,
        ...(localUpdates.language
          ? { spokenLanguage: localUpdates.language, language: localUpdates.language }
          : {}),
        ...(localUpdates.country || localUpdates.countryName
          ? {
              countryName: localUpdates.country ?? localUpdates.countryName,
            }
          : {}),
      });
      setEditingField(null);
    } catch (err) {
      
      const message = err?.message || "Could not save profile. Please try again.";
      Alert.alert("Save failed", message);
      if (/log in|authentication token/i.test(message)) {
        router.replace("/login");
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const currentField =
    accountFields.find((item) => item.key === editingField) ||
    answerFields.find((item) => item.key === editingField);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const hydrateProfile = async () => {
        setProfileLoading(true);
        try {
          const [user, apiProfile] = await Promise.all([
            getUser(),
            loadUserProfile().catch((err) => {
              
              return null;
            }),
          ]);

          if (cancelled) return;

          const frameSource = await syncNewUserFrameForSession();
          if (!cancelled) setNewUserFrameSource(frameSource);

          const useLocalAvatar = Boolean(user?.useLocalAvatar);
          const storedProfile = {
            name: user?.nickname ?? user?.name ?? "",
            gender: user?.gender ?? "",
            country: user?.country ?? "",
            countryCode: user?.countryCode ?? "",
            birthday: user?.birthday ?? "",
            interests: user?.interests ?? "",
            education: user?.education ?? "",
            school: user?.school ?? "",
            occupation: user?.occupation ?? "",
            language: user?.spokenLanguage ?? user?.language ?? "",
            about: user?.aboutMe ?? user?.about ?? "",
            sports: user?.sports ?? "",
            music: user?.music ?? "",
            movies: user?.favoriteMoviesAndTvShows ?? user?.movies ?? "",
            books: user?.books ?? "",
            displayName: user?.name ?? "",
            profilePicUrl: user?.profilePicUrl ?? null,
          };

          setProfile((prev) => {
            const merged = mergeProfileState(prev, apiProfile ?? {}, storedProfile);
            return {
              ...merged,
              avatarId: user?.avatarId ?? prev.avatarId,
              useLocalAvatar,
              food: user?.food ?? prev.food,
              profilePicUrl: useLocalAvatar
                ? null
                : apiProfile?.profilePicUrl ??
                  user?.profilePicUrl ??
                  prev.profilePicUrl,
            };
          });

          if (user?.avatarId) {
            setSelectedAvatar(user.avatarId);
          }
        } finally {
          if (!cancelled) setProfileLoading(false);
        }
      };

      hydrateProfile();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const editingTitle = currentField?.label || "Edit";
  const isAvatarField = editingField === "avatar";
  const isGenderField = editingField === "gender";
  const isCountryField = editingField === "country";
  const isTextField = !isAvatarField && !isGenderField && !isCountryField;
  const isMultiline = ["about", "interests", "sports", "music", "food", "movies", "books"].includes(editingField);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
                <ProfileAvatarWithFrame
                  avatarSource={currentAvatar}
                  frameSource={newUserFrameSource}
                  size={104}
                  avatarStyle={styles.accountAvatar}
                  wrapperStyle={styles.accountAvatarFrameWrap}
                />
              </View>
            </View>
          </View>
          <Text style={styles.progressValue}>{progress}% complete</Text>
          <Text style={styles.progressLabel}>Complete your account info to attract more like-minded mates</Text>
        </View>

        <Text style={styles.sectionTitle}>Personal info</Text>
        <View style={styles.listCard}>
          {accountFields.map((item, index) => {
            const value =
              item.key === "avatar"
                ? undefined
                : item.key === "country"
                  ? formatCountryLabel(profile.country, profile.countryCode)
                  : profile[item.key];
            const isLast = index === accountFields.length - 1;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.listItem, isLast && styles.listItemLast]}
                activeOpacity={0.7}
                onPress={() => openEditor(item.key)}
              >
                <View style={styles.itemLeft}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  {value ? (
                    <Text style={styles.itemValue} numberOfLines={2}>
                      {value}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.itemRight}>
                  {item.note ? (
                    <View style={styles.noteBadge}>
                      <Text style={styles.noteText}>{item.note}</Text>
                    </View>
                  ) : null}
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
          {answerFields.map((item, index) => {
            const isLast = index === answerFields.length - 1;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.listItem, isLast && styles.listItemLast]}
                activeOpacity={0.7}
                onPress={() => openEditor(item.key)}
              >
                <View style={styles.itemLeft}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  {profile[item.key] ? (
                    <Text style={styles.itemValue} numberOfLines={2}>
                      {profile[item.key]}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.itemRight}>
                  <View style={styles.plusButton}>
                    <Ionicons name="add" size={16} color="white" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={Boolean(editingField)} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setEditingField(null)}
          />
          <SafeAreaView edges={["bottom"]} style={styles.modalSafeArea}>
            <View style={styles.modalCard}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>{editingTitle}</Text>
              <View style={styles.modalBody}>
                {isAvatarField ? (
                  <ScrollView
                    style={styles.avatarPickerScroll}
                    contentContainerStyle={styles.avatarSelectionRow}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                  >
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
                  </ScrollView>
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
                ) : isCountryField ? (
                  <>
                    <TextInput
                      value={countrySearch}
                      onChangeText={setCountrySearch}
                      placeholder="Search country or code..."
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      style={styles.countrySearchInput}
                    />
                    <FlatList
                      data={filteredCountries}
                      keyExtractor={(item) => item.code + item.name}
                      style={styles.countryList}
                      keyboardShouldPersistTaps="handled"
                      renderItem={({ item }) => {
                        const isActive =
                          selectedCountry?.name === item.name &&
                          selectedCountry?.code === item.code;
                        return (
                          <TouchableOpacity
                            style={[
                              styles.countryRow,
                              isActive && styles.countryRowActive,
                            ]}
                            activeOpacity={0.8}
                            onPress={() => setSelectedCountry(item)}
                          >
                            <Text style={styles.countryFlag}>{item.flag}</Text>
                            <Text
                              style={[
                                styles.countryName,
                                isActive && styles.countryNameActive,
                              ]}
                              numberOfLines={1}
                            >
                              {item.name}
                            </Text>
                            <Text
                              style={[
                                styles.countryCode,
                                isActive && styles.countryCodeActive,
                              ]}
                            >
                              {item.code}
                            </Text>
                          </TouchableOpacity>
                        );
                      }}
                    />
                  </>
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
              </View>
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setEditingField(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={saveField}
                  disabled={profileSaving}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>
                    {profileSaving ? "Saving..." : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
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
    overflow: "visible",
  },
  accountAvatarFrameWrap: {
    alignItems: "center",
    justifyContent: "center",
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
    minHeight: 64,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  listItemLast: {
    borderBottomWidth: 0,
  },
  itemLeft: {
    flex: 1,
    paddingRight: 12,
    minWidth: 0,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flexShrink: 0,
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
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSafeArea: {
    maxHeight: "88%",
  },
  modalCard: {
    backgroundColor: "#120723",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 14,
  },
  modalBody: {
    maxHeight: 420,
    marginBottom: 8,
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
    justifyContent: "flex-start",
    paddingBottom: 8,
  },
  avatarPickerScroll: {
    maxHeight: 300,
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
  countrySearchInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: "white",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  countryList: {
    flexGrow: 0,
    maxHeight: 300,
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 4,
    gap: 10,
  },
  countryRowActive: {
    backgroundColor: "rgba(124,77,255,0.22)",
  },
  countryFlag: {
    fontSize: 22,
    width: 30,
  },
  countryName: {
    flex: 1,
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    fontWeight: "500",
  },
  countryNameActive: {
    color: "white",
    fontWeight: "700",
  },
  countryCode: {
    color: "rgba(167,139,250,0.7)",
    fontSize: 14,
    fontWeight: "600",
    minWidth: 48,
    textAlign: "right",
  },
  countryCodeActive: {
    color: "#a78bfa",
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
  },
  modalInputMultiline: {
    height: 120,
    textAlignVertical: "top",
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
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
