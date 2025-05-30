import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getSettings, updateSettings } from '../utils/storage';

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    imageMood: 'humorous',
    vocabularySet: 'general',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const currentSettings = await getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSettingChange = async (key, value) => {
    try {
      const newSettings = { ...settings, [key]: value };
      await updateSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to update settings. Please try again.');
    }
  };

  const handleDonation = () => {
    Alert.alert(
      'Support VocabMaster! 💝',
      'Thank you for considering a donation! Your support helps us keep the app free and continue developing new features.\n\nThis is just a placeholder for the MVP. In the future, we\'ll integrate real donation options.',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { 
          text: 'Learn More', 
          onPress: () => {
            // In a real app, this would link to a donation page
            Alert.alert('Coming Soon!', 'Donation integration will be available in a future update.');
          }
        },
      ]
    );
  };

  const SettingRow = ({ icon, title, subtitle, value, options, onPress }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={24} color="#6366f1" />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.settingRight}>
        <Text style={styles.settingValue}>{value}</Text>
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </View>
    </TouchableOpacity>
  );

  const showImageMoodOptions = () => {
    Alert.alert(
      'Image Mood',
      'Choose the style for vocabulary images (Midjourney-generated)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Humorous',
          onPress: () => handleSettingChange('imageMood', 'humorous'),
          style: settings.imageMood === 'humorous' ? 'default' : 'default',
        },
        // Future options can be added here
      ]
    );
  };

  const showVocabularySetOptions = () => {
    Alert.alert(
      'Vocabulary Set',
      'Choose which vocabulary set to study',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'General Vocabulary',
          onPress: () => handleSettingChange('vocabularySet', 'general'),
          style: settings.vocabularySet === 'general' ? 'default' : 'default',
        },
        // Future options can be added here
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#6366f1', '#8b5cf6', '#a855f7']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Customize your learning experience</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Learning Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Preferences</Text>
          
          <SettingRow
            icon="image-outline"
            title="Image Mood"
            subtitle="Style of images for vocabulary words"
            value="Humorous"
            onPress={showImageMoodOptions}
          />

          <SettingRow
            icon="library-outline"
            title="Vocabulary Set"
            subtitle="Choose which words to study"
            value="General Vocabulary"
            onPress={showVocabularySetOptions}
          />
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.aboutCard}>
            <View style={styles.aboutHeader}>
              <View style={styles.aboutLogo}>
                <Ionicons name="book" size={32} color="white" />
              </View>
              <View style={styles.aboutInfo}>
                <Text style={styles.aboutTitle}>VocabMaster</Text>
                <Text style={styles.aboutVersion}>Version 1.0.0 (MVP)</Text>
              </View>
            </View>
            
            <Text style={styles.aboutDescription}>
              Learn vocabulary the easy way! VocabMaster makes expanding your vocabulary 
              fun and engaging with images and spaced repetition learning.
            </Text>

            <View style={styles.aboutFeatures}>
              <Text style={styles.aboutFeaturesTitle}>MVP Features:</Text>
              <Text style={styles.aboutFeature}>• 20 carefully selected vocabulary words</Text>
              <Text style={styles.aboutFeature}>• Progress tracking and statistics</Text>
              <Text style={styles.aboutFeature}>• Local data storage</Text>
              <Text style={styles.aboutFeature}>• Foundation for spaced repetition</Text>
            </View>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support VocabMaster</Text>
          
          <TouchableOpacity style={styles.donationCard} onPress={handleDonation}>
            <LinearGradient
              colors={['#ef4444', '#dc2626']}
              style={styles.donationGradient}
            >
              <View style={styles.donationContent}>
                <Ionicons name="heart" size={28} color="white" />
                <View style={styles.donationText}>
                  <Text style={styles.donationTitle}>Make a Donation</Text>
                  <Text style={styles.donationSubtitle}>
                    Help keep VocabMaster free for everyone
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.donationNote}>
            VocabMaster is completely free to use. Your optional donations help us 
            continue developing new features and keeping the app free for all students.
          </Text>
        </View>

        {/* Future Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coming Soon</Text>
          
          <View style={styles.futureFeaturesList}>
            <View style={styles.futureFeature}>
              <Ionicons name="time-outline" size={20} color="#6366f1" />
              <Text style={styles.futureFeatureText}>
                Advanced spaced repetition algorithm
              </Text>
            </View>
            
            <View style={styles.futureFeature}>
              <Ionicons name="image-outline" size={20} color="#6366f1" />
              <Text style={styles.futureFeatureText}>
                Midjourney-generated images
              </Text>
            </View>
            
            <View style={styles.futureFeature}>
              <Ionicons name="library-outline" size={20} color="#6366f1" />
              <Text style={styles.futureFeatureText}>
                Multiple vocabulary sets and difficulty levels
              </Text>
            </View>
            
            <View style={styles.futureFeature}>
              <Ionicons name="trophy-outline" size={20} color="#6366f1" />
              <Text style={styles.futureFeatureText}>
                Achievements and learning streaks
              </Text>
            </View>
            
            <View style={styles.futureFeature}>
              <Ionicons name="cloud-outline" size={20} color="#6366f1" />
              <Text style={styles.futureFeatureText}>
                Cloud sync and backup
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for vocabulary learners everywhere
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    marginRight: 8,
  },
  aboutCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aboutLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  aboutInfo: {
    flex: 1,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 14,
    color: '#6b7280',
  },
  aboutDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  aboutFeatures: {
    marginTop: 8,
  },
  aboutFeaturesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  aboutFeature: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  donationCard: {
    borderRadius: 12,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  donationGradient: {
    borderRadius: 12,
    padding: 20,
  },
  donationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  donationText: {
    flex: 1,
    marginLeft: 16,
  },
  donationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  donationSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  donationNote: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
    textAlign: 'center',
  },
  futureFeaturesList: {
    marginTop: 8,
  },
  futureFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  futureFeatureText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerCopyright: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
}); 