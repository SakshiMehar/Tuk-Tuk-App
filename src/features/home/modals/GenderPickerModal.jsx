import React, { memo, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Image,
} from 'react-native';
import { LinearGradient } from '@shared/components';
import { ms } from '@shared/utils/responsive';

const COUNTRIES = [
  { name: 'India', flag: '🇮🇳' },
  { name: 'United States', flag: '🇺🇸' },
  { name: 'United Kingdom', flag: '🇬🇧' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'United Arab Emirates', flag: '🇦🇪' },
  { name: 'Singapore', flag: '🇸🇬' },
  { name: 'Australia', flag: '🇦🇺' },
  { name: 'Germany', flag: '🇩🇪' },
];

export const GenderPickerModal = memo(function GenderPickerModal({
  visible,
  onSelect,
}) {
  const [selectedCountry, setSelectedCountry] = useState('India');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleGenderSelect = useCallback(
    (gender) => {
      if (onSelect) {
        onSelect({ gender, country: selectedCountry });
      }
    },
    [onSelect, selectedCountry]
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <LinearGradient
          colors={['#1a0a3e', '#0d0618', '#1a0a3e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <Text style={styles.headerTitle}>Who are you?</Text>
          <Text style={styles.headerSub}>
            Choose your identity to personalize avatars and your experience
          </Text>

          {/* Country selector */}
          <TouchableOpacity
            style={styles.countryBtn}
            activeOpacity={0.8}
            onPress={() => setDropdownOpen((prev) => !prev)}
          >
            <Text style={styles.countryBtnText}>
              🌍 {selectedCountry || 'Select Country'}
            </Text>
            <Text style={styles.dropdownArrow}>{dropdownOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {dropdownOpen && (
            <View style={styles.dropdown}>
              <TextInput
                style={styles.countrySearch}
                placeholder="Search country..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={search}
                onChangeText={setSearch}
              />
              <ScrollView style={{ maxHeight: 120 }}>
                {filteredCountries.map((c) => (
                  <TouchableOpacity
                    key={c.name}
                    style={styles.countryRow}
                    onPress={() => {
                      setSelectedCountry(c.name);
                      setDropdownOpen(false);
                      setSearch('');
                    }}
                  >
                    <Text style={styles.countryRowText}>
                      {c.flag} {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Boy / Girl options */}
          <View style={styles.avatarRow}>
            {/* Boy */}
            <TouchableOpacity
              style={styles.avatarBtn}
              activeOpacity={0.85}
              onPress={() => handleGenderSelect('Male')}
            >
              <LinearGradient
                colors={['#0d2b6b', '#1a4fbf', '#4a7fff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarCard}
              >
                <Image
                  source={{
                    uri: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Avatar/avatar1.webp',
                  }}
                  style={styles.avatarImg}
                />
                <View style={styles.labelRow}>
                  <Text style={styles.sign}>♂</Text>
                  <Text style={styles.label}>Boy</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Girl */}
            <TouchableOpacity
              style={styles.avatarBtn}
              activeOpacity={0.85}
              onPress={() => handleGenderSelect('Female')}
            >
              <LinearGradient
                colors={['#6b0d3a', '#bf1a6e', '#ff4aaa']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarCard}
              >
                <Image
                  source={{
                    uri: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Avatar/avatar5.webp',
                  }}
                  style={styles.avatarImg}
                />
                <View style={styles.labelRow}>
                  <Text style={styles.sign}>♀</Text>
                  <Text style={styles.label}>Girl</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Other */}
          <TouchableOpacity
            style={styles.otherBtn}
            onPress={() => handleGenderSelect('Other')}
          >
            <Text style={styles.otherTxt}>Prefer not to say</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  card: {
    width: '100%',
    maxWidth: 370,
    borderRadius: 28,
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.35)',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: ms(24),
    fontWeight: '900',
    marginBottom: 6,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: ms(12.5),
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: 'rgba(124,77,255,0.18)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.4)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  countryBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownArrow: {
    color: '#a78bfa',
    fontSize: 12,
  },
  dropdown: {
    width: '100%',
    backgroundColor: 'rgba(20,8,40,0.95)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.3)',
    marginBottom: 14,
    padding: 8,
  },
  countrySearch: {
    color: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 6,
    fontSize: 13,
  },
  countryRow: {
    paddingVertical: 8,
  },
  countryRowText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    marginBottom: 16,
  },
  avatarBtn: {
    flex: 1,
  },
  avatarCard: {
    borderRadius: 22,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 10,
  },
  avatarImg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sign: {
    color: 'white',
    fontSize: 16,
  },
  label: {
    color: '#ffffff',
    fontSize: ms(16),
    fontWeight: '800',
  },
  otherBtn: {
    paddingVertical: 8,
  },
  otherTxt: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});

export default GenderPickerModal;
