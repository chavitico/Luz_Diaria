// Notification service using expo-notifications
// Handles local scheduled notifications for daily devotional reminders

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_STORAGE_KEY = 'daily_light_notification_settings';

export interface NotificationSettings {
  enabled: boolean;
  hour: number; // 0-23
  minute: number; // 0-59
  scheduledIdentifier?: string;
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  hour: 7, // 7:00 AM default
  minute: 0,
};

// Rotating spiritual copy — deterministic by day-of-year
const SPIRITUAL_MESSAGES_ES = [
  { title: '🕊️ Luz Diaria', body: 'Detente un momento. Dios quiere hablarte hoy.' },
  { title: '🌅 Luz Diaria', body: 'Un nuevo día. Una nueva luz para tu camino.' },
  { title: '📖 Luz Diaria', body: 'Aparta un momento. La Palabra te espera.' },
  { title: '🌿 Luz Diaria', body: 'No es prisa. Es encuentro. Hoy hay una luz para ti.' },
];

const SPIRITUAL_MESSAGES_EN = [
  { title: '🕊️ Daily Light', body: 'Pause for a moment. God wants to speak to you today.' },
  { title: '🌅 Daily Light', body: 'A new day. A new light for your path.' },
  { title: '📖 Daily Light', body: 'Set aside a moment. The Word is waiting for you.' },
  { title: '🌿 Daily Light', body: "It's not hurry. It's encounter. Today there's a light for you." },
];

function getDailyMessageIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return dayOfYear % SPIRITUAL_MESSAGES_ES.length;
}

// Configure notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('[Notifications] Must use physical device for push notifications');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Notifications] Permission not granted');
    return false;
  }

  // Configure for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('devotional-reminders', {
      name: 'Luz Diaria',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 150],
      lightColor: '#E8A87C',
      sound: undefined,
    });
  }

  console.log('[Notifications] Permission granted');
  return true;
}

/**
 * Get saved notification settings from storage
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[Notifications] Error reading settings:', error);
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
}

/**
 * Save notification settings to storage
 */
export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(settings));
    console.log('[Notifications] Settings saved:', settings);
  } catch (error) {
    console.error('[Notifications] Error saving settings:', error);
  }
}

/**
 * Schedule a daily notification for the devotional.
 * Uses rotating spiritual copy — one message per day-of-year.
 */
export async function scheduleDailyNotification(
  hour: number,
  minute: number,
  language: 'en' | 'es' = 'es'
): Promise<string | null> {
  try {
    await cancelAllScheduledNotificationsOnly();

    const idx = getDailyMessageIndex();
    const msg = language === 'es' ? SPIRITUAL_MESSAGES_ES[idx]! : SPIRITUAL_MESSAGES_EN[idx]!;

    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    };

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: msg.title,
        body: msg.body,
        sound: undefined as any,
        data: { screen: 'home' },
      },
      trigger,
    });

    console.log(`[Notifications] Scheduled daily notification at ${hour}:${minute.toString().padStart(2, '0')}, ID: ${identifier}`);

    await saveNotificationSettings({
      enabled: true,
      hour,
      minute,
      scheduledIdentifier: identifier,
    });

    return identifier;
  } catch (error) {
    console.error('[Notifications] Error scheduling notification:', error);
    return null;
  }
}

// Internal helper — cancels OS notifications without touching settings
async function cancelAllScheduledNotificationsOnly(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('[Notifications] Error cancelling notifications:', error);
  }
}

/**
 * Cancel all scheduled notifications and mark as disabled in settings
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Notifications] All scheduled notifications cancelled');

    const settings = await getNotificationSettings();
    await saveNotificationSettings({
      ...settings,
      enabled: false,
      scheduledIdentifier: undefined,
    });
  } catch (error) {
    console.error('[Notifications] Error cancelling notifications:', error);
  }
}

/**
 * Get all scheduled notifications (for debugging)
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Format time for display (e.g., "7:00 AM" or "07:00")
 */
export function formatNotificationTime(hour: number, minute: number, use24Hour: boolean = false): string {
  if (use24Hour) {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

/**
 * Initialize notifications on app start.
 * - First run: auto-schedules at 7:00 AM.
 * - Subsequent runs: reschedules if still enabled (keeps message fresh).
 * - Silently skips if permissions are denied by the user.
 */
export async function initializeNotifications(language: 'en' | 'es' = 'es'): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
    const settings: NotificationSettings = stored
      ? JSON.parse(stored)
      : DEFAULT_NOTIFICATION_SETTINGS;

    if (settings.enabled) {
      const hasPermission = await requestNotificationPermissions();
      if (hasPermission) {
        await scheduleDailyNotification(settings.hour, settings.minute, language);
        console.log('[Notifications] Reinitialized daily notification');
      }
    } else if (!stored) {
      // Brand-new install: auto-request and schedule at 7:00 AM
      const hasPermission = await requestNotificationPermissions();
      if (hasPermission) {
        await scheduleDailyNotification(
          DEFAULT_NOTIFICATION_SETTINGS.hour,
          DEFAULT_NOTIFICATION_SETTINGS.minute,
          language
        );
        console.log('[Notifications] Auto-scheduled first-time notification at 7:00 AM');
      }
    }
  } catch (error) {
    console.error('[Notifications] Error initializing:', error);
  }
}

/**
 * Send an immediate test notification (for debugging)
 */
export async function sendTestNotification(language: 'en' | 'es' = 'es'): Promise<void> {
  try {
    const idx = getDailyMessageIndex();
    const msg = language === 'es' ? SPIRITUAL_MESSAGES_ES[idx]! : SPIRITUAL_MESSAGES_EN[idx]!;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: msg.title,
        body: msg.body,
        sound: undefined as any,
        data: { screen: 'home' },
      },
      trigger: null,
    });
    console.log('[Notifications] Test notification sent');
  } catch (error) {
    console.error('[Notifications] Error sending test notification:', error);
  }
}
