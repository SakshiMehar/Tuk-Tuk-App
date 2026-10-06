import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import { Phone, PhoneOff } from "lucide-react-native";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
    acceptCall as apiAcceptCall,
    endCall as apiEndCall,
    getAgoraToken as apiGetAgoraToken,
    rejectCall as apiRejectCall,
    startCall as apiStartCall
} from "../api/callApi";

import { getUserProfile } from "../api/userApi";
import Colors from "../constants/colors";
import {
    leaveCall as agoraLeaveCall,
    startCall as agoraStartCall,
    destroyCallEngine,
    requestPermissions,
    subscribeCallStatus
} from "../services/agoraCallService";
import { wsService } from "../services/websocket";

const CallContext = createContext(null);

const { width, height } = Dimensions.get("window");

export const CallProvider = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const isChatScreen = pathname && pathname.includes("chat-box");
    const [callState, setCallState] = useState({
        status: "IDLE", // IDLE, INCOMING, OUTGOING, CONNECTED
        callId: null,
        callType: null, // 'audio' | 'video'
        channelId: null,
        callerId: null, // Used for displaying caller info
        callerName: null, // Actual name of caller
        callerAvatar: null, // Avatar of caller
        agoraState: { joined: false, localAudioEnabled: true, localVideoEnabled: true, remoteUid: 0 }
    });

    const callStateRef = useRef(callState);
    useEffect(() => {
        callStateRef.current = callState;
    }, [callState]);

    const soundRef = useRef(null);

    // Play ringtone when INCOMING
    useEffect(() => {
        let isMounted = true;
        const playRingtone = async () => {
            if (callState.status === "INCOMING") {
                try {
                    const { sound } = await Audio.Sound.createAsync(
                        require("../../assets/ringtone.wav"),
                        { shouldPlay: true, isLooping: true }
                    );
                    if (isMounted) soundRef.current = sound;
                } catch (error) {
                    console.error("Failed to load ringtone", error);
                }
            } else {
                if (soundRef.current) {
                    await soundRef.current.stopAsync();
                    await soundRef.current.unloadAsync();
                    soundRef.current = null;
                }
            }
        };
        playRingtone();
        return () => {
            isMounted = false;
            if (soundRef.current) {
                soundRef.current.stopAsync();
                soundRef.current.unloadAsync();
                soundRef.current = null;
            }
        };
    }, [callState.status]);

    const endCallLocal = () => {
        agoraLeaveCall();
        setCallState({
            status: "IDLE",
            callId: null,
            callType: null,
            channelId: null,
            callerId: null,
            callerName: null,
            callerAvatar: null,
            agoraState: { joined: false, localAudioEnabled: true, localVideoEnabled: true, remoteUid: 0 }
        });
    };

    useEffect(() => {
        const unsub = subscribeCallStatus((status) => {
            setCallState((prev) => ({ ...prev, agoraState: status }));
        });

        const unsubCall = wsService.onCallSignal((payload) => {
            const { type, callId, senderId } = payload;

            if (type === "CALL_INCOMING") {
                setCallState(prev => {
                    if (prev.status !== "IDLE") return prev;
                    return { ...prev, status: "INCOMING", callType: 'audio', callId: callId, callerId: senderId, callerName: `User ${senderId}` };
                });

                // Fetch caller details
                getUserProfile(senderId).then(profile => {
                    setCallState(prev => {
                        if (prev.callId === callId) {
                            return {
                                ...prev,
                                callerName: profile.name || profile.username || `User ${senderId}`,
                                callerAvatar: profile.avatar || profile.profilePicUrl
                            };
                        }
                        return prev;
                    });
                }).catch(err => console.log("Failed to fetch caller profile", err));
            } else if (type === "CALL_ACCEPTED") {
                setCallState(prev => ({ ...prev, status: "CONNECTED", callId: callId }));
                apiGetAgoraToken(callId).then(tokenData => {
                    const isVid = callStateRef.current.callType === 'video';
                    agoraStartCall({ appId: tokenData.appId, channelId: tokenData.channelName, uid: tokenData.uid, token: tokenData.token, isVideo: isVid });
                }).catch(err => {
                    console.error("Failed to get token", err);
                    endCallLocal();
                });
            } else if (type === "CALL_REJECTED" || type === "CALL_ENDED") {
                endCallLocal();
            }
        });

        return () => {
            unsub();
            unsubCall();
            destroyCallEngine();
        };
    }, []);

    // Check for pending call acceptance from background (Notifee)
    useEffect(() => {
        const checkPendingCall = async () => {
            try {
                const pending = await AsyncStorage.getItem('pending_call_accept');
                if (pending) {
                    const callData = JSON.parse(pending);
                    await AsyncStorage.removeItem('pending_call_accept');

                    if (callData.callId) {
                        setCallState(prev => ({
                            ...prev,
                            status: "INCOMING",
                            callType: 'audio',
                            callId: Number(callData.callId),
                            callerId: Number(callData.senderId),
                            callerName: callData.senderName,
                        }));

                        // Automatically trigger accept flow
                        setTimeout(() => {
                            acceptCall();
                        }, 500);
                    }
                }
            } catch (err) {
                console.warn("Failed to parse pending call", err);
            }
        };
        checkPendingCall();
    }, []);

    const initiateCall = async (type, userId) => {
        const granted = await requestPermissions(type === 'video');
        if (!granted) return Alert.alert("Permission required", "Microphone and Camera access are needed for calling.");

        try {
            const response = await apiStartCall(userId);
            setCallState(prev => ({ ...prev, status: "OUTGOING", callType: type, callId: response.callId || response.id, callerId: userId }));
        } catch (error) {
            Alert.alert("Call failed", "Unable to start call");
        }
    };

    const acceptCall = async () => {
        const currentCall = callStateRef.current;
        if (!currentCall.callId) return;

        const granted = await requestPermissions(currentCall.callType === 'video');
        if (!granted) {
            apiRejectCall(currentCall.callId).catch(() => { });
            endCallLocal();
            return Alert.alert("Permission required", "Microphone and Camera access are needed for calling.");
        }

        try {
            await apiAcceptCall(currentCall.callId);
            const tokenData = await apiGetAgoraToken(currentCall.callId);
            setCallState(prev => ({ ...prev, status: "CONNECTED" }));
            agoraStartCall({ appId: tokenData.appId, channelId: tokenData.channelName, uid: tokenData.uid, token: tokenData.token, isVideo: currentCall.callType === 'video' });

            // Navigate to chat box to view the active call if not already there
            if (currentCall.callerId) {
                // Using push to ensure we land on the correct chat screen
                const chatParams = { userId: currentCall.callerId };
                if (currentCall.callerName) chatParams.name = currentCall.callerName;
                if (currentCall.callerAvatar) chatParams.avatar = encodeURIComponent(currentCall.callerAvatar);

                router.push({
                    pathname: "/chat-box",
                    params: chatParams
                });
            }
        } catch (err) {
            Alert.alert("Call error", "Could not accept call");
            endCallLocal();
        }
    };

    const rejectCall = () => {
        const currentCall = callStateRef.current;
        if (currentCall.callId) apiRejectCall(currentCall.callId).catch(() => { });
        endCallLocal();
    };

    const endCall = () => {
        const currentCall = callStateRef.current;
        if (currentCall.callId) apiEndCall(currentCall.callId).catch(() => { });
        endCallLocal();
    };

    return (
        <CallContext.Provider value={{ callState, initiateCall, acceptCall, rejectCall, endCall }}>
            {children}

            {/* Global Incoming Call Overlay */}
            {callState.status === "INCOMING" && !isChatScreen && (
                <View style={styles.headsUpContainer} pointerEvents="box-none">
                    <LinearGradient colors={["rgba(30,41,59,0.95)", "rgba(15,23,42,0.95)"]} style={styles.headsUpCard}>
                        <View style={styles.headsUpInfo}>
                            <Text style={styles.incomingTitle}>Incoming Call</Text>
                            <Text style={styles.callerName} numberOfLines={1}>{callState.callerName || `User ${callState.callerId}`}</Text>
                        </View>

                        <View style={styles.headsUpActions}>
                            <TouchableOpacity style={[styles.miniBtn, styles.rejectBtn]} onPress={rejectCall}>
                                <PhoneOff color="white" size={20} />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.miniBtn, styles.acceptBtn]} onPress={acceptCall}>
                                <Phone color="white" size={20} />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>
            )}
        </CallContext.Provider>
    );
};

export const useCallContext = () => useContext(CallContext);

const styles = StyleSheet.create({
    headsUpContainer: {
        position: "absolute",
        top: 60, // Account for safe area / notch
        left: 0,
        right: 0,
        alignItems: "center",
        zIndex: 9999,
        elevation: 99,
    },
    headsUpCard: {
        width: width * 0.9,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    headsUpInfo: {
        flex: 1,
    },
    incomingTitle: {
        color: Colors.grayPlaceholder,
        fontSize: 12,
        marginBottom: 4,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    callerName: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },
    headsUpActions: {
        flexDirection: "row",
        gap: 16,
    },
    miniBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    rejectBtn: {
        backgroundColor: Colors.error || "#ef4444",
    },
    acceptBtn: {
        backgroundColor: Colors.success || "#22c55e",
    }
});
