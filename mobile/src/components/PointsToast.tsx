// Points Toast Component - Shows "+X points" notifications
// Subtle, non-intrusive design that appears at top and fades in/out

import React, { useEffect, useCallback } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { Star, AlertCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export interface ToastMessage {
  id: string;
  points: number;
  label: string;
  type?: 'success' | 'warning'; // warning for daily cap reached
}

interface PointsToastProps {
  message: ToastMessage | null;
  onHide: () => void;
  primaryColor?: string;
}

export function PointsToast({ message, onHide, primaryColor = '#8B5CF6' }: PointsToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const handleHide = useCallback(() => {
    onHide();
  }, [onHide]);

  useEffect(() => {
    if (message) {
      // Animate in
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });

      // Animate out after 2 seconds
      translateY.value = withDelay(
        2000,
        withTiming(-100, { duration: 300 }, (finished) => {
          if (finished) {
            runOnJS(handleHide)();
          }
        })
      );
      opacity.value = withDelay(2000, withTiming(0, { duration: 300 }));
    }
  }, [message, handleHide]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!message) return null;

  const isWarning = message.type === 'warning';

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: insets.top + 10,
          left: 20,
          right: 20,
          zIndex: 9999,
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          backgroundColor: isWarning ? 'rgba(251, 191, 36, 0.95)' : 'rgba(34, 197, 94, 0.95)',
          borderRadius: 16,
          paddingVertical: 14,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        {isWarning ? (
          <AlertCircle size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
        ) : (
          <Star size={20} color="#FFFFFF" fill="#FFFFFF" style={{ marginRight: 10 }} />
        )}
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: '700',
          }}
        >
          {isWarning ? message.label : `+${message.points} ${message.label}`}
        </Text>
      </View>
    </Animated.View>
  );
}

// Hook to manage toast queue
import { useState, useRef } from 'react';

export function usePointsToast() {
  const [currentToast, setCurrentToast] = useState<ToastMessage | null>(null);
  const queueRef = useRef<ToastMessage[]>([]);
  const isShowingRef = useRef(false);

  const showNext = useCallback(() => {
    if (queueRef.current.length > 0 && !isShowingRef.current) {
      isShowingRef.current = true;
      const next = queueRef.current.shift();
      setCurrentToast(next || null);
    }
  }, []);

  const showToast = useCallback((points: number, label: string, type?: 'success' | 'warning') => {
    const newToast: ToastMessage = {
      id: Date.now().toString(),
      points,
      label,
      type: type || 'success',
    };
    queueRef.current.push(newToast);
    showNext();
  }, [showNext]);

  const hideToast = useCallback(() => {
    isShowingRef.current = false;
    setCurrentToast(null);
    // Show next toast in queue after a small delay
    setTimeout(showNext, 100);
  }, [showNext]);

  return {
    currentToast,
    showToast,
    hideToast,
  };
}
