import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function TaskModal({ visible, onClose }) {
  const tasks = [
    { id: 1, title: 'Login in today', reward: '+100', progress: '', status: 'Claim', icon: '🔓' },
    { id: 2, title: 'Make New 1 Friends', reward: '+100', progress: '', status: 'In progress', icon: '🤝' },
    { id: 3, title: 'Join voice room for 30 min.', reward: '+250', progress: '0/1800', status: 'In progress', icon: '🎙️' },
    { id: 4, title: 'Follow 10 New User', reward: '+100', progress: '0/10', status: 'In progress', icon: '👤' },
    { id: 5, title: 'Recharge Once', reward: '+1500', progress: '', status: 'In progress', icon: '💳' },
    { id: 6, title: '10 Post in today', reward: '+1000', progress: '0/10', status: 'In progress', icon: '📝' },
    { id: 7, title: 'Send a gift >300', reward: '+100', progress: '', status: 'In progress', icon: '🎁' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name="list" size={20} color="#8a56fa" />
              </View>
              <Text style={styles.headerTitle}>Task</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Banner Section */}
            <LinearGradient colors={['#e8ddff', '#f3eeff']} style={styles.banner}>
              <Text style={styles.diamondIconBanner}>💎</Text>
              <View style={styles.earnedContainer}>
                <Text style={styles.earnedValue}>0</Text>
                <Text style={styles.earnedDiamondSmall}>💎</Text>
                <Text style={styles.earnedText}>earned</Text>
              </View>
              <Text style={styles.bannerSubtext}>Finish tasks to earn up to 3250💎</Text>
            </LinearGradient>

            {/* Progress Section */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Tasks Completed</Text>
                <Text style={styles.progressCount}>0 / 9</Text>
              </View>
              <View style={styles.progressBarBackground}>
                <View style={styles.progressBarFill} />
              </View>
            </View>

            {/* Reward Tasks List */}
            <Text style={styles.sectionTitle}>REWARD TASKS</Text>
            
            {tasks.map((task, index) => (
              <View key={task.id} style={[styles.taskItem, index === tasks.length - 1 && styles.lastTaskItem]}>
                <View style={styles.taskIconContainer}>
                  <Text style={styles.taskEmoji}>{task.icon}</Text>
                </View>
                
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View style={styles.rewardContainer}>
                    <Text style={styles.taskReward}>{task.reward}</Text>
                    <Text style={styles.rewardDiamondSmall}>💎</Text>
                  </View>
                  {task.progress ? (
                    <Text style={styles.taskProgress}>{task.progress}</Text>
                  ) : null}
                </View>

                <TouchableOpacity 
                  style={[
                    styles.actionButton, 
                    task.status === 'Claim' ? styles.actionButtonClaim : styles.actionButtonInProgress
                  ]}
                >
                  <Text 
                    style={[
                      styles.actionButtonText,
                      task.status === 'Claim' ? styles.actionButtonTextClaim : styles.actionButtonTextInProgress
                    ]}
                  >
                    {task.status}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: height * 0.9,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f3eeff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  banner: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  diamondIconBanner: {
    fontSize: 40,
    marginBottom: 10,
  },
  earnedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  earnedValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  earnedDiamondSmall: {
    fontSize: 16,
    marginHorizontal: 4,
  },
  earnedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 4,
  },
  bannerSubtext: {
    fontSize: 14,
    color: '#666',
  },
  progressSection: {
    marginBottom: 30,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },
  progressCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9e75ff',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    width: '100%',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#e6e6e6', 
    borderRadius: 4,
    width: '0%', 
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 16,
    letterSpacing: 1,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastTaskItem: {
    borderBottomWidth: 0,
  },
  taskIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  taskEmoji: {
    fontSize: 24,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskReward: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9e75ff',
  },
  rewardDiamondSmall: {
    fontSize: 12,
    marginLeft: 2,
  },
  taskProgress: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  actionButtonClaim: {
    backgroundColor: '#7b4aff',
  },
  actionButtonInProgress: {
    backgroundColor: '#f0eaff',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  actionButtonTextClaim: {
    color: '#ffffff',
  },
  actionButtonTextInProgress: {
    color: '#8a56fa',
  },
});
