import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  StatusBar,
  Share,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Sparkles,
  Award,
  Share2,
  RotateCcw,
  Compass,
  CheckCircle2,
  Flame,
  Mic,
  Zap,
  Crown,
  Radio,
  ArrowRight,
} from "lucide-react-native";
import {
  getPersonalityQuizzes,
  getPersonalityQuizById,
  submitPersonalityQuiz,
  getPersonalityQuizResult,
} from "../src/api/personalityApi";
import { ms, s, vs } from "../src/utils/responsive";

const { width: W } = Dimensions.get("window");

// Palette helpers for dynamic cards if backgroundColor is not provided
const GRADIENT_PALETTES = [
  ["#4c1d95", "#7c3aed"],
  ["#831843", "#db2777"],
  ["#065f46", "#059669"],
  ["#1e1b4b", "#4338ca"],
  ["#7c2d12", "#ea580c"],
];

const resolveCardGradient = (quiz, index) => {
  if (quiz?.backgroundColor) {
    return [quiz.backgroundColor, "#1e0b4b"];
  }
  return GRADIENT_PALETTES[index % GRADIENT_PALETTES.length];
};

export default function PersonalityTest() {
  const router = useRouter();

  // ── 1. Dynamic API State ──
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── 2. Active Quiz State ──
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState([]); // [{ questionId, optionId }]
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── 3. Dynamic Result State ──
  const [result, setResult] = useState(null);

  // ── 4. Animations ──
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for submitting/calculating
  useEffect(() => {
    if (isSubmitting) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 650,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 650,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isSubmitting, pulseAnim]);

  // Progress bar animation
  useEffect(() => {
    if (activeQuiz && quizQuestions.length > 0) {
      const progress = (currentQuestionIdx + 1) / quizQuestions.length;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [currentQuestionIdx, activeQuiz, quizQuestions.length, progressAnim]);

  // ── 5. Fetch Dynamic Quiz List (GET /api/app/personality/quizzes) ──
  const fetchQuizzes = useCallback(async (isPull = false) => {
    if (isPull) setRefreshing(true);
    else setLoadingQuizzes(true);

    try {
      const data = await getPersonalityQuizzes();
      if (Array.isArray(data)) {
        setQuizzes(data);
      } else {
        setQuizzes([]);
      }
    } catch (err) {
      console.warn("[PersonalityTest] fetchQuizzes error:", err?.message || err);
    } finally {
      setLoadingQuizzes(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  // ── 6. Open Quiz / Retest (GET /api/app/personality/quizzes/{quizId}) ──
  const handleStartQuiz = async (quiz) => {
    const qId = quiz.id ?? quiz.quizId;
    if (!qId) return;

    setActiveQuiz(quiz);
    setIsSubmitting(true);
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setAnswers([]);
    setResult(null);

    try {
      const data = await getPersonalityQuizById(qId);
      const list = Array.isArray(data?.questions) ? [...data.questions] : [];
      list.sort(
        (a, b) =>
          (a.questionNumber ?? a.questionOrder ?? a.id ?? 0) -
          (b.questionNumber ?? b.questionOrder ?? b.id ?? 0)
      );
      setQuizQuestions(list);
      if (data) {
        setActiveQuiz((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.warn("[PersonalityTest] getPersonalityQuizById error:", err?.message || err);
      Alert.alert("Quiz Error", err?.message || "Could not load quiz questions.");
      setActiveQuiz(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 7. View Previous Result (GET /api/app/personality/quizzes/result/{quizId}) ──
  const handleViewResult = async (quiz) => {
    const qId = quiz.id ?? quiz.quizId;
    if (!qId) return;

    setActiveQuiz(quiz);
    setIsSubmitting(true);

    try {
      const res = await getPersonalityQuizResult(qId);
      if (res) {
        setResult(res);
      } else {
        // Fall back to opening the quiz
        handleStartQuiz(quiz);
      }
    } catch (err) {
      console.warn("[PersonalityTest] getPersonalityQuizResult error:", err?.message || err);
      handleStartQuiz(quiz);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 8. Option Selection ──
  const handleSelectOption = (opt) => {
    setSelectedOption(opt);
  };

  // ── 9. Next Question & Submit (POST /api/app/personality/quizzes/{quizId}/submit) ──
  const handleNextQuestion = async () => {
    if (!selectedOption || !quizQuestions[currentQuestionIdx]) return;

    const currentQ = quizQuestions[currentQuestionIdx];
    const qId = currentQ.id ?? currentQ.questionId;
    const oId = selectedOption.id ?? selectedOption.optionId;

    const updatedAnswers = [
      ...answers.filter((a) => a.questionId !== qId),
      { questionId: Number(qId), optionId: Number(oId) },
    ];
    setAnswers(updatedAnswers);

    // Fade animation transition
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    if (currentQuestionIdx + 1 < quizQuestions.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      // Final Question -> Submit to API
      setIsSubmitting(true);
      const quizId = activeQuiz.id ?? activeQuiz.quizId;

      try {
        const response = await submitPersonalityQuiz(quizId, updatedAnswers);
        if (response) {
          setResult(response);
          // Mark completed in list
          setQuizzes((prev) =>
            prev.map((q) => ((q.id ?? q.quizId) === quizId ? { ...q, completed: true } : q))
          );
        }
      } catch (err) {
        console.warn("[PersonalityTest] submitPersonalityQuiz error:", err?.message || err);
        Alert.alert("Submission Error", err?.message || "Could not submit quiz.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // ── 10. Restart & Navigation ──
  const handleRestart = () => {
    setActiveQuiz(null);
    setQuizQuestions([]);
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setAnswers([]);
    setResult(null);
    setIsSubmitting(false);
    fetchQuizzes();
  };

  const handleShareResult = async () => {
    if (!result) return;
    const archetypeName = result.archetypeName || result.archetypeCode || "My Archetype";
    const traits = Array.isArray(result.traits) ? result.traits.join(", ") : "";

    try {
      await Share.share({
        message: `✨ I took the ${result.quizTitle || "Personality Test"} on Tuk-Tuk and unlocked "${archetypeName}"!\n\n"${result.description}"\n\n✨ Traits: ${traits}\n\nTake the test on Tuk-Tuk Voice Party!`,
      });
    } catch {
      Alert.alert("Share", "Could not open share dialog.");
    }
  };

  const handleJoinVoiceRoom = () => {
    router.push("/(tabs)/home");
  };

  // ── 1. CALCULATING / LOADING SCREEN ──
  if (isSubmitting) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={["#080334", "#180a31", "#2e1065"]} style={styles.fullScreenCenter}>
          <Animated.View style={[styles.pulseOrbWrap, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient colors={["#ac4dff", "#7c3aed", "#4c1d95"]} style={styles.pulseOrb}>
              <Sparkles size={40} color="#fde047" />
            </LinearGradient>
          </Animated.View>
          <Text style={styles.calculatingTitle}>Analyzing Your Social Chemistry...</Text>
          <Text style={styles.calculatingSub}>Reading voice room aura, charisma & party frequency ✨</Text>
        </LinearGradient>
      </View>
    );
  }

  // ── 2. RESULT SCREEN ──
  if (result) {
    const archetypeName = result.archetypeName || result.archetypeCode || "Your Archetype";
    const traitsList = Array.isArray(result.traits) ? result.traits : [];

    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <StatusBar barStyle="light-content" />
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.resultScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={handleRestart}>
              <ChevronLeft size={22} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{result.quizTitle || "Your Archetype"}</Text>
            <TouchableOpacity style={styles.shareHeaderBtn} activeOpacity={0.8} onPress={handleShareResult}>
              <Share2 size={19} color="#e9d5ff" />
            </TouchableOpacity>
          </View>

          {/* Archetype Hero Card */}
          <LinearGradient
            colors={["#4c1d95", "#7c3aed", "#9333ea"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroResultCard}
          >
            <View style={styles.resultBadgePill}>
              <Sparkles size={13} color="#fde047" />
              <Text style={styles.resultBadgeText}>YOUR PERSONALITY</Text>
            </View>

            <View style={styles.resultIconCircle}>
              {result.iconUrl ? (
                <Image source={{ uri: result.iconUrl }} style={{ width: 42, height: 42 }} resizeMode="contain" />
              ) : (
                <Crown size={36} color="#fde047" />
              )}
            </View>

            <Text style={styles.resultArchetypeTitle}>{archetypeName}</Text>
            <Text style={styles.resultArchetypeSub}>{result.quizTitle || "Voice Room Persona"}</Text>

            <View style={styles.catchphraseBox}>
              <Text style={styles.catchphraseQuote}>{`"${result.description}"`}</Text>
            </View>
          </LinearGradient>

          {/* Dynamic Traits Breakdown */}
          {traitsList.length > 0 && (
            <View style={styles.infoSectionCard}>
              <View style={styles.cardHeaderRow}>
                <Award size={18} color="#a855f7" />
                <Text style={styles.cardHeaderTitle}>Trait Breakdown</Text>
              </View>
              {traitsList.map((trait, idx) => {
                const traitName = typeof trait === "string" ? trait : trait.label || `Trait ${idx + 1}`;
                const traitValue = typeof trait === "object" && trait.value ? trait.value : 90 + ((idx * 3) % 9);
                return (
                  <View key={idx} style={styles.traitRow}>
                    <View style={styles.traitLabelRow}>
                      <Text style={styles.traitLabelText}>{traitName}</Text>
                      <Text style={styles.traitValText}>{traitValue}%</Text>
                    </View>
                    <View style={styles.traitBarBg}>
                      <LinearGradient
                        colors={["#a855f7", "#ec4899"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.traitBarFill, { width: `${traitValue}%` }]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Social Superpower */}
          <View style={styles.infoSectionCard}>
            <View style={styles.cardHeaderRow}>
              <Zap size={18} color="#f59e0b" />
              <Text style={styles.cardHeaderTitle}>Your Social Superpower</Text>
            </View>
            <Text style={styles.superpowerText}>{result.description}</Text>
          </View>

          {/* Actions */}
          <View style={styles.resultActionsCol}>
            <TouchableOpacity style={styles.primaryShareBtn} activeOpacity={0.85} onPress={handleShareResult}>
              <LinearGradient
                colors={["#7c3aed", "#4f46e5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryShareGrad}
              >
                <Share2 size={18} color="white" />
                <Text style={styles.primaryShareText}>Share to Chat & Friends</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              activeOpacity={0.8}
              onPress={() => {
                const targetQuiz = activeQuiz || {
                  id: result?.quizId ?? result?.id,
                  title: result?.quizTitle,
                };
                if (targetQuiz?.id) {
                  handleStartQuiz(targetQuiz);
                }
              }}
            >
              <RotateCcw size={17} color="#e9d5ff" />
              <Text style={styles.secondaryActionText}>Retest Quiz</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.retakeBtn} activeOpacity={0.75} onPress={handleRestart}>
              <Text style={styles.retakeText}>Back to All Quizzes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (activeQuiz && quizQuestions.length > 0) {
    const currentQ = quizQuestions[currentQuestionIdx];
    const totalQ = quizQuestions.length;
    const progressPercent = Math.round(((currentQuestionIdx + 1) / totalQ) * 100);
    const optionsList = Array.isArray(currentQ?.options) ? currentQ.options : [];
    const questionTitle = currentQ?.questionText || currentQ?.text || currentQ?.title || "";

    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <StatusBar barStyle="light-content" />

        {/* Top Quiz Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={handleRestart}>
            <ChevronLeft size={22} color="white" />
          </TouchableOpacity>
          <View style={styles.headerCenterCol}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {activeQuiz.title || "Personality & Vibe"}
            </Text>
            <Text style={styles.headerSubtitle}>
              Question {currentQuestionIdx + 1} of {totalQ}
            </Text>
          </View>
          <View style={styles.progressPercentPill}>
            <Text style={styles.progressPercentText}>{progressPercent}%</Text>
          </View>
        </View>

        {/* Animated Progress Bar */}
        <View style={styles.progressTrackBg}>
          <Animated.View
            style={[
              styles.progressTrackFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>

        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.questionScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Question Card */}
            <LinearGradient colors={["#1e1035", "#12082b"]} style={styles.questionBox}>
              <View style={styles.questionBadgeRow}>
                <Sparkles size={14} color="#fde047" />
                <Text style={styles.questionTagText}>SELECT YOUR INSTINCT</Text>
              </View>
              <Text style={styles.questionMainText}>{questionTitle}</Text>
            </LinearGradient>

            {/* Options List */}
            <View style={styles.optionsList}>
              {optionsList.map((opt, idx) => {
                const isSelected =
                  selectedOption === opt ||
                  (selectedOption?.id !== undefined && selectedOption?.id === opt.id) ||
                  (selectedOption?.code !== undefined && selectedOption?.code === opt.code);
                const optLetter = opt.code || opt.optionCode || String.fromCharCode(65 + idx);
                const optText = opt.text || opt.optionText || "";

                return (
                  <TouchableOpacity
                    key={opt.id ?? opt.code ?? idx}
                    activeOpacity={0.85}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => handleSelectOption(opt)}
                  >
                    <LinearGradient
                      colors={
                        isSelected
                          ? ["rgba(124, 77, 255, 0.4)", "rgba(168, 85, 247, 0.25)"]
                          : ["rgba(255, 255, 255, 0.05)", "rgba(255, 255, 255, 0.02)"]
                      }
                      style={styles.optionGradInner}
                    >
                      <View style={[styles.optionCheckCircle, isSelected && styles.optionCheckCircleSelected]}>
                        {isSelected ? (
                          <CheckCircle2 size={18} color="#fde047" />
                        ) : (
                          <Text style={styles.optionLetter}>{optLetter}</Text>
                        )}
                      </View>
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {optText}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </ScrollView>

        {/* Bottom Next Button */}
        <View style={styles.bottomBarWrap}>
          <TouchableOpacity
            style={[styles.nextBtn, !selectedOption && styles.nextBtnDisabled]}
            activeOpacity={0.85}
            disabled={!selectedOption}
            onPress={handleNextQuestion}
          >
            <LinearGradient
              colors={selectedOption ? ["#7c3aed", "#a855f7"] : ["#374151", "#1f2937"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextBtnGrad}
            >
              <Text style={[styles.nextBtnText, !selectedOption && styles.nextBtnTextDisabled]}>
                {currentQuestionIdx + 1 === totalQ ? "Reveal My Archetype ✨" : "Next Question"}
              </Text>
              <ArrowRight size={18} color={selectedOption ? "white" : "#6b7280"} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── 4. CATEGORY SELECTION HUB (MAIN SCREEN) ──
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => router.back()}>
          <ChevronLeft size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personality & Vibe Test</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.categoryScrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchQuizzes(true)}
            tintColor="#a855f7"
            colors={["#a855f7"]}
          />
        }
      >
        {/* Hero Banner */}
        <LinearGradient
          colors={["#2e1065", "#4c1d95", "#7c3aed"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroBannerTag}>
            <Flame size={13} color="#fde047" />
            <Text style={styles.heroBannerTagText}>TUK-TUK SOCIAL AURA</Text>
          </View>
          <Text style={styles.heroBannerTitle}>Discover Your Voice Archetype</Text>
          <Text style={styles.heroBannerSub}>
            Take interactive quizzes to unlock your charisma score, voice superpowers, and room compatibility.
          </Text>
        </LinearGradient>

        {/* Section Heading */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Featured Tests</Text>
          <Text style={styles.sectionCount}>{quizzes.length} Quizzes</Text>
        </View>

        {/* Loading Indicator */}
        {loadingQuizzes && (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#a855f7" />
          </View>
        )}

        {/* Dynamic Category Cards from API */}
        {!loadingQuizzes && (
          <View style={styles.categoriesList}>
            {quizzes.map((quiz, idx) => {
              const isDone = Boolean(quiz.completed);
              const duration = quiz.durationMinutes ? `${quiz.durationMinutes} mins` : "5 mins";
              const count = quiz.questionCount ?? quiz.totalQuestions ?? 5;
              const cardGradient = resolveCardGradient(quiz, idx);

              return (
                <TouchableOpacity
                  key={quiz.id ?? quiz.quizId ?? idx}
                  style={styles.catCard}
                  activeOpacity={0.85}
                  onPress={() => (isDone ? handleViewResult(quiz) : handleStartQuiz(quiz))}
                >
                  <LinearGradient
                    colors={cardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.catCardGrad}
                  >
                    <View style={styles.catCardTopRow}>
                      <View style={styles.catIconWrap}>
                        {quiz.iconUrl ? (
                          <Image
                            source={{ uri: quiz.iconUrl }}
                            style={{ width: 26, height: 26, borderRadius: 13 }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Sparkles size={20} color="#fde047" />
                        )}
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        {isDone && (
                          <View style={styles.completedBadgePill}>
                            <CheckCircle2 size={12} color="#4ade80" />
                            <Text style={styles.completedBadgeText}>Completed</Text>
                          </View>
                        )}
                        {quiz.badge ? (
                          <View style={styles.catBadgePill}>
                            <Text style={styles.catBadgeText}>{quiz.badge}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    <Text style={styles.catTitle}>{quiz.title}</Text>
                    <Text style={styles.catTagline} numberOfLines={2}>
                      {quiz.description}
                    </Text>

                    <View style={styles.catFooterRow}>
                      <Text style={styles.catMetaText}>
                        ⏱️ {duration} • {count} Questions
                      </Text>
                      <View style={styles.catArrowBtn}>
                        <ArrowRight size={14} color="white" />
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── EXACT PREVIOUS STYLES ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080334",
  },
  fullScreenCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  pulseOrbWrap: {
    marginBottom: 28,
  },
  pulseOrb: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ac4dff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  calculatingTitle: {
    color: "white",
    fontSize: ms(18),
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  calculatingSub: {
    color: "#e9d5ff",
    fontSize: ms(13),
    textAlign: "center",
    lineHeight: 19,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenterCol: {
    alignItems: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: ms(16),
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#a78bfa",
    fontSize: ms(11),
    marginTop: 2,
  },
  shareHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(124,77,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressPercentPill: {
    backgroundColor: "rgba(168,85,247,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.4)",
  },
  progressPercentText: {
    color: "#fde047",
    fontSize: ms(11),
    fontWeight: "800",
  },
  progressTrackBg: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    width: "100%",
  },
  progressTrackFill: {
    height: "100%",
    backgroundColor: "#a855f7",
  },
  scrollBody: {
    flex: 1,
  },
  categoryScrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  heroBanner: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  heroBannerTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  heroBannerTagText: {
    color: "#fde047",
    fontSize: ms(9.5),
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  heroBannerTitle: {
    color: "white",
    fontSize: ms(18),
    fontWeight: "800",
    lineHeight: 24,
    marginBottom: 6,
  },
  heroBannerSub: {
    color: "#e9d5ff",
    fontSize: ms(12),
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: "white",
    fontSize: ms(15),
    fontWeight: "800",
  },
  sectionCount: {
    color: "#a78bfa",
    fontSize: ms(12),
    fontWeight: "600",
  },
  categoriesList: {
    gap: 14,
  },
  catCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  catCardGrad: {
    padding: 18,
    borderRadius: 16,
  },
  catCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  catIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  completedBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(34, 197, 94, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(74, 222, 128, 0.4)",
  },
  completedBadgeText: {
    color: "#4ade80",
    fontSize: ms(10),
    fontWeight: "700",
  },
  catBadgePill: {
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  catBadgeText: {
    color: "#fde047",
    fontSize: ms(10),
    fontWeight: "700",
  },
  catTitle: {
    color: "white",
    fontSize: ms(16),
    fontWeight: "800",
    marginBottom: 4,
  },
  catTagline: {
    color: "rgba(255,255,255,0.85)",
    fontSize: ms(12),
    lineHeight: 17,
    marginBottom: 14,
  },
  catFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    paddingTop: 10,
  },
  catMetaText: {
    color: "#f3e8ff",
    fontSize: ms(11),
    fontWeight: "600",
  },
  catArrowBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  questionScrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  questionBox: {
    padding: 20,
    borderRadius: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.3)",
  },
  questionBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  questionTagText: {
    color: "#fde047",
    fontSize: ms(9.5),
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  questionMainText: {
    color: "white",
    fontSize: ms(16),
    fontWeight: "700",
    lineHeight: 23,
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  optionCardSelected: {
    borderColor: "#a855f7",
  },
  optionGradInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  optionCheckCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  optionCheckCircleSelected: {
    backgroundColor: "rgba(168,85,247,0.3)",
  },
  optionLetter: {
    color: "#e9d5ff",
    fontSize: ms(13),
    fontWeight: "700",
  },
  optionText: {
    flex: 1,
    color: "rgba(255,255,255,0.9)",
    fontSize: ms(13),
    lineHeight: 18,
    fontWeight: "500",
  },
  optionTextSelected: {
    color: "white",
    fontWeight: "700",
  },
  bottomBarWrap: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#080334",
  },
  nextBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  nextBtnDisabled: {
    opacity: 0.6,
  },
  nextBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  nextBtnText: {
    color: "white",
    fontSize: ms(14),
    fontWeight: "700",
  },
  nextBtnTextDisabled: {
    color: "#9ca3af",
  },
  resultScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroResultCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  resultBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 14,
  },
  resultBadgeText: {
    color: "#fde047",
    fontSize: ms(11),
    fontWeight: "800",
  },
  resultIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  resultArchetypeTitle: {
    color: "white",
    fontSize: ms(19),
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
  },
  resultArchetypeSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: ms(12.5),
    textAlign: "center",
    marginBottom: 16,
  },
  catchphraseBox: {
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  catchphraseQuote: {
    color: "#fef08a",
    fontSize: ms(12),
    fontStyle: "italic",
    textAlign: "center",
    fontWeight: "600",
  },
  infoSectionCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  cardHeaderTitle: {
    color: "white",
    fontSize: ms(14),
    fontWeight: "700",
  },
  superpowerText: {
    color: "#e2e8f0",
    fontSize: ms(12.5),
    lineHeight: 19,
  },
  traitRow: {
    marginBottom: 10,
  },
  traitLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  traitLabelText: {
    color: "#cbd5e1",
    fontSize: ms(11.5),
    fontWeight: "600",
  },
  traitValText: {
    color: "#f472b6",
    fontSize: ms(11.5),
    fontWeight: "800",
  },
  traitBarBg: {
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  traitBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  resultActionsCol: {
    gap: 10,
    marginTop: 6,
  },
  primaryShareBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  primaryShareGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  primaryShareText: {
    color: "white",
    fontSize: ms(14),
    fontWeight: "700",
  },
  secondaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    backgroundColor: "rgba(124,77,255,0.2)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },
  secondaryActionText: {
    color: "#e9d5ff",
    fontSize: ms(13.5),
    fontWeight: "700",
  },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  retakeText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: ms(12),
    fontWeight: "600",
  },
});
