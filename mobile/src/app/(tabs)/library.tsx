// Library Screen - Historical Devotionals

import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { Heart, Calendar, BookOpen, Share2, X, Search, ChevronDown, Check } from 'lucide-react-native';
import { ShareableDevotionalImage } from '@/components/ShareableDevotionalImage';
import { firestoreService, getTodayDate } from '@/lib/firestore';
import { useThemeColors, useLanguage, useUserFavorites, useUser, useAppStore } from '@/lib/store';
import { TRANSLATIONS } from '@/lib/constants';
import { POINTS } from '@/lib/types';
import type { Devotional } from '@/lib/types';
import { cn } from '@/lib/cn';
import { PointsToast, usePointsToast } from '@/components/PointsToast';
import { gamificationApi } from '@/lib/gamification-api';

const { width } = Dimensions.get('window');

type FilterType = 'all' | 'favorites';

interface DevotionalCardProps {
  devotional: Devotional;
  isFavorite: boolean;
  language: 'en' | 'es';
  colors: ReturnType<typeof useThemeColors>;
  onPress: () => void;
  onShare: () => void;
}

function DevotionalCard({ devotional, isFavorite, language, colors, onPress, onShare }: DevotionalCardProps) {
  const title = language === 'es' ? devotional.titleEs : devotional.title;
  const topic = language === 'es' ? devotional.topicEs : devotional.topic;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      className="mb-4 mx-5"
    >
      <View
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: colors.surface,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <View className="flex-row">
          {/* Thumbnail */}
          <Image
            source={{ uri: devotional.imageUrl }}
            style={{ width: 100, height: 100 }}
            contentFit="cover"
            transition={200}
          />

          {/* Content */}
          <View className="flex-1 p-4">
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center">
                <Calendar size={12} color={colors.textMuted} />
                <Text
                  className="text-xs ml-1"
                  style={{ color: colors.textMuted }}
                >
                  {formatDate(devotional.date)}
                </Text>
              </View>
              <View className="flex-row items-center">
                {/* Share Button */}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onShare();
                  }}
                  className="w-7 h-7 rounded-full items-center justify-center mr-2"
                  style={{ backgroundColor: colors.primary + '15' }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Share2 size={14} color={colors.primary} />
                </Pressable>
                {isFavorite && (
                  <Heart size={14} color="#EF4444" fill="#EF4444" />
                )}
              </View>
            </View>

            <Text
              className="text-base font-semibold mb-2"
              style={{ color: colors.text }}
              numberOfLines={2}
            >
              {title}
            </Text>

            <View className="flex-row items-center">
              <View
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: colors.primary + '20' }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: colors.primary }}
                >
                  {topic}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const language = useLanguage();
  const favorites = useUserFavorites();
  const user = useUser();
  const t = TRANSLATIONS[language];

  const addPoints = useAppStore((s) => s.addPoints);
  const updateUser = useAppStore((s) => s.updateUser);

  // Points toast
  const { currentToast, showToast, hideToast } = usePointsToast();

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDevotional, setSelectedDevotional] = useState<Devotional | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const { data: devotionals, isLoading } = useQuery({
    queryKey: ['allDevotionals'],
    queryFn: () => firestoreService.getAllDevotionals(),
  });

  // Extract unique categories from devotionals
  const categories = useMemo(() => {
    if (!devotionals) return [];
    const topicSet = new Set<string>();
    devotionals.forEach((d) => {
      const topic = language === 'es' ? d.topicEs : d.topic;
      if (topic) topicSet.add(topic);
    });
    return Array.from(topicSet).sort();
  }, [devotionals, language]);

  const filteredDevotionals = useMemo(() => {
    if (!devotionals) return [];

    return devotionals.filter((d) => {
      // Filter by favorites
      if (filter === 'favorites' && !favorites.includes(d.date)) {
        return false;
      }

      // Filter by category
      if (selectedCategory !== 'all') {
        const topic = language === 'es' ? d.topicEs : d.topic;
        if (topic !== selectedCategory) {
          return false;
        }
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const title = (language === 'es' ? d.titleEs : d.title)?.toLowerCase() ?? '';
        const topic = (language === 'es' ? d.topicEs : d.topic)?.toLowerCase() ?? '';
        const reflection = (language === 'es' ? d.reflectionEs : d.reflection)?.toLowerCase() ?? '';

        return title.includes(query) || topic.includes(query) || reflection.includes(query);
      }

      return true;
    });
  }, [devotionals, filter, favorites, selectedCategory, searchQuery, language]);

  const handleDevotionalPress = useCallback((devotional: Devotional) => {
    router.push({
      pathname: '/devotional/[date]',
      params: { date: devotional.date },
    });
  }, [router]);

  // Open share modal for a devotional
  const handleOpenShareModal = useCallback((devotional: Devotional) => {
    setSelectedDevotional(devotional);
    setShowShareModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Capture and share image
  const handleShareImage = useCallback(async () => {
    if (!user || !selectedDevotional || !viewShotRef.current) return;

    setIsCapturing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const today = getTodayDate();
    const dailyActions = user?.dailyActions ?? {};

    try {
      // Wait a moment for the view to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture the view as image with higher pixel ratio for better quality
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        useRenderInContext: true,
      });

      if (!uri) {
        console.error('[Share] Failed to capture image');
        setIsCapturing(false);
        return;
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        console.error('[Share] Sharing not available');
        setIsCapturing(false);
        return;
      }

      // Share the image
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: language === 'es' ? 'Compartir Devocional' : 'Share Devotional',
      });

      setIsCapturing(false);
      setShowShareModal(false);
      setSelectedDevotional(null);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Update daily actions
      const newShareCount = (dailyActions.shareDate === today ? (dailyActions.shareCount ?? 0) : 0) + 1;
      updateUser({
        dailyActions: {
          ...dailyActions,
          shareDate: today,
          shareCount: newShareCount,
        },
      });

      // Award points via API
      try {
        const pointsResult = await gamificationApi.awardPoints(user.id, 'share');
        if (pointsResult.success) {
          addPoints(pointsResult.pointsAwarded);
          showToast(
            pointsResult.pointsAwarded,
            language === 'es' ? 'puntos (Compartir)' : 'points (Share)'
          );
        }
        await gamificationApi.updateChallengeProgress(user.id, 'share');
      } catch (error) {
        console.error('[Share] Failed to award points:', error);
        addPoints(POINTS.SHARE_DEVOTIONAL);
        showToast(
          POINTS.SHARE_DEVOTIONAL,
          language === 'es' ? 'puntos (Compartir)' : 'points (Share)'
        );
      }
    } catch (error) {
      console.error('[Share] Failed to share image:', error);
      setIsCapturing(false);
    }
  }, [user, selectedDevotional, language, updateUser, addPoints, showToast]);

  const renderItem = useCallback(
    ({ item }: { item: Devotional }) => (
      <DevotionalCard
        devotional={item}
        isFavorite={favorites.includes(item.date)}
        language={language}
        colors={colors}
        onPress={() => handleDevotionalPress(item)}
        onShare={() => handleOpenShareModal(item)}
      />
    ),
    [favorites, language, colors, handleDevotionalPress, handleOpenShareModal]
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="px-5 pb-4"
        style={{ paddingTop: insets.top + 16 }}
      >
        <Text
          className="text-3xl font-bold mb-4"
          style={{ color: colors.text }}
        >
          {t.library}
        </Text>

        {/* Search Bar */}
        <View
          className="flex-row items-center rounded-xl px-4 mb-4"
          style={{ backgroundColor: colors.surface, height: 44 }}
        >
          <Search size={18} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t.search_placeholder}
            placeholderTextColor={colors.textMuted}
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 15,
              color: colors.text,
            }}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Filter Row: Tabs + Category Dropdown */}
        <View className="flex-row items-center justify-between">
          {/* Filter Tabs */}
          <View className="flex-row flex-1">
            <Pressable
              onPress={() => {
                setFilter('all');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={cn(
                'px-4 py-2 rounded-full mr-2',
                filter === 'all' ? '' : 'bg-transparent'
              )}
              style={
                filter === 'all'
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.surface }
              }
            >
              <Text
                className="font-semibold"
                style={{
                  color: filter === 'all' ? '#FFFFFF' : colors.textMuted,
                }}
              >
                {t.all_devotionals}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setFilter('favorites');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className="px-4 py-2 rounded-full flex-row items-center"
              style={
                filter === 'favorites'
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.surface }
              }
            >
              <Heart
                size={14}
                color={filter === 'favorites' ? '#FFFFFF' : colors.textMuted}
                fill={filter === 'favorites' ? '#FFFFFF' : 'transparent'}
              />
              <Text
                className="font-semibold ml-1"
                style={{
                  color: filter === 'favorites' ? '#FFFFFF' : colors.textMuted,
                }}
              >
                {t.favorites}
              </Text>
            </Pressable>
          </View>

          {/* Category Dropdown */}
          <Pressable
            onPress={() => {
              setShowCategoryDropdown(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="flex-row items-center px-3 py-2 rounded-full"
            style={{ backgroundColor: colors.surface }}
          >
            <Text
              className="text-sm font-medium mr-1"
              style={{ color: selectedCategory === 'all' ? colors.textMuted : colors.primary }}
              numberOfLines={1}
            >
              {selectedCategory === 'all' ? t.filter_category : selectedCategory}
            </Text>
            <ChevronDown size={16} color={selectedCategory === 'all' ? colors.textMuted : colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredDevotionals && filteredDevotionals.length > 0 ? (
        <FlashList
          data={filteredDevotionals}
          renderItem={renderItem}
          estimatedItemSize={116}
          keyExtractor={(item) => item.date}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-1 items-center justify-center px-8"
        >
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: colors.primary + '15' }}
          >
            {searchQuery || selectedCategory !== 'all' ? (
              <Search size={32} color={colors.primary} />
            ) : (
              <BookOpen size={32} color={colors.primary} />
            )}
          </View>
          <Text
            className="text-lg font-semibold text-center mb-2"
            style={{ color: colors.text }}
          >
            {searchQuery || selectedCategory !== 'all'
              ? t.no_results
              : filter === 'favorites'
              ? t.no_favorites
              : 'No devotionals yet'}
          </Text>
          <Text
            className="text-center"
            style={{ color: colors.textMuted }}
          >
            {searchQuery || selectedCategory !== 'all'
              ? language === 'es'
                ? 'Intenta con otros terminos de busqueda'
                : 'Try different search terms'
              : filter === 'favorites'
              ? language === 'es'
                ? 'Toca el corazon en un devocional para guardarlo aqui'
                : 'Tap the heart icon on a devotional to save it here'
              : language === 'es'
              ? 'Los devocionales apareceran aqui cuando esten disponibles'
              : 'Devotionals will appear here as they become available'}
          </Text>
        </Animated.View>
      )}

      {/* Points Toast */}
      <PointsToast
        message={currentToast}
        onHide={hideToast}
        primaryColor={colors.primary}
      />

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowShareModal(false);
          setSelectedDevotional(null);
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.8)',
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: insets.top + 10,
              paddingHorizontal: 20,
              paddingBottom: 16,
            }}
          >
            <Pressable
              onPress={() => {
                setShowShareModal(false);
                setSelectedDevotional(null);
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={22} color="#FFFFFF" />
            </Pressable>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>
              {language === 'es' ? 'Compartir Devocional' : 'Share Devotional'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Preview */}
          {selectedDevotional && (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 120,
              }}
              showsVerticalScrollIndicator={false}
            >
              <ViewShot
                ref={viewShotRef}
                options={{
                  format: 'png',
                  quality: 1,
                  result: 'tmpfile',
                }}
                style={{ backgroundColor: '#000000' }}
              >
                <View collapsable={false}>
                  <ShareableDevotionalImage
                    devotional={selectedDevotional}
                    language={language}
                    colors={colors}
                    translations={{
                      bible_verse: t.bible_verse,
                      reflection: t.reflection,
                      story: t.story,
                      biblical_character: t.biblical_character,
                      application: t.application,
                      prayer: t.prayer,
                    }}
                  />
                </View>
              </ViewShot>
            </ScrollView>
          )}

          {/* Share Button */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              paddingHorizontal: 20,
              paddingBottom: insets.bottom + 20,
              paddingTop: 16,
              backgroundColor: 'rgba(0,0,0,0.9)',
            }}
          >
            <Pressable
              onPress={handleShareImage}
              disabled={isCapturing}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 16,
                paddingVertical: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isCapturing ? 0.7 : 1,
              }}
            >
              {isCapturing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Share2 size={20} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 10 }}>
                    {language === 'es' ? 'Compartir Imagen' : 'Share Image'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Category Dropdown Modal */}
      <Modal
        visible={showCategoryDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryDropdown(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setShowCategoryDropdown(false)}
        >
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: insets.bottom + 20,
              maxHeight: '60%',
            }}
          >
            {/* Handle */}
            <View className="items-center pt-3 pb-2">
              <View
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: colors.textMuted,
                  borderRadius: 2,
                  opacity: 0.3,
                }}
              />
            </View>

            {/* Title */}
            <Text
              className="text-lg font-semibold px-5 pb-3"
              style={{ color: colors.text }}
            >
              {t.filter_category}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* All Categories Option */}
              <Pressable
                onPress={() => {
                  setSelectedCategory('all');
                  setShowCategoryDropdown(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className="flex-row items-center justify-between px-5 py-3"
                style={{
                  backgroundColor: selectedCategory === 'all' ? colors.primary + '15' : 'transparent',
                }}
              >
                <Text
                  className="text-base"
                  style={{
                    color: selectedCategory === 'all' ? colors.primary : colors.text,
                    fontWeight: selectedCategory === 'all' ? '600' : '400',
                  }}
                >
                  {t.all_categories}
                </Text>
                {selectedCategory === 'all' && (
                  <Check size={20} color={colors.primary} />
                )}
              </Pressable>

              {/* Category Options */}
              {categories.map((category) => (
                <Pressable
                  key={category}
                  onPress={() => {
                    setSelectedCategory(category);
                    setShowCategoryDropdown(false);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className="flex-row items-center justify-between px-5 py-3"
                  style={{
                    backgroundColor: selectedCategory === category ? colors.primary + '15' : 'transparent',
                  }}
                >
                  <Text
                    className="text-base"
                    style={{
                      color: selectedCategory === category ? colors.primary : colors.text,
                      fontWeight: selectedCategory === category ? '600' : '400',
                    }}
                  >
                    {category}
                  </Text>
                  {selectedCategory === category && (
                    <Check size={20} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
