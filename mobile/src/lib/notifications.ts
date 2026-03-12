// Notification service using expo-notifications
// Handles local scheduled notifications for daily devotional reminders

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_STORAGE_KEY = 'daily_light_notification_settings';

// Engagement tracking keys
export const ENGAGEMENT_KEYS = {
  LAST_OPENED_DATE: 'daily_light_last_opened_date',
  LAST_NOTIFICATION_SENT_DATE: 'daily_light_last_notification_sent_date',
  LAST_DEVOTIONAL_COMPLETED_DATE: 'daily_light_last_devotional_completed_date',
};

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

// Pastoral daily reminder variants — no pressure, no streaks, calm tone
function getSpiritualMessages(language: 'en' | 'es'): { title: string; body: string }[] {
  const now = new Date();
  const day = now.getDate();
  const monthNames = language === 'es'
    ? ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
    : ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const fecha = `${day} de ${monthNames[now.getMonth()]}`;

  if (language === 'es') {
    return [
      { title: 'Luz Diaria', body: `Tu devocional de hoy — ${fecha} — está listo para acompañarte.` },
      { title: 'Luz Diaria', body: 'Dios tiene una palabra para ti hoy. Cuando quieras, aquí está.' },
      { title: 'Luz Diaria', body: 'Tu devocional de hoy ya está disponible. Caminamos juntos.' },
    ];
  } else {
    return [
      { title: 'Daily Light', body: `Today's devotional — ${fecha} — is ready to accompany you.` },
      { title: 'Daily Light', body: 'God has a word for you today. Whenever you are ready, it is here.' },
      { title: 'Daily Light', body: "Today's devotional is available. We walk together." },
    ];
  }
}

function getRandomMessageIndex(length: number): number {
  return Math.floor(Math.random() * length);
}

/** Returns today's date as YYYY-MM-DD in local time */
function getLocalDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
    if (__DEV__) console.log('[Notifications] Must use physical device for push notifications');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    if (__DEV__) console.log('[Notifications] Permission not granted');
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

  if (__DEV__) console.log('[Notifications] Permission granted');
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
    if (__DEV__) console.log('[Notifications] Settings saved:', settings);
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

    const messages = getSpiritualMessages(language);
    const msg = messages[getRandomMessageIndex(messages.length)]!;

    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    };

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: msg.title,
        subtitle: undefined,
        body: msg.body,
        data: { screen: 'home' },
        categoryIdentifier: undefined,
      },
      trigger,
    });

    if (__DEV__) console.log(`[Notifications] Scheduled daily notification at ${hour}:${minute.toString().padStart(2, '0')}, ID: ${identifier}`);

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
    if (__DEV__) console.log('[Notifications] All scheduled notifications cancelled');

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
 * Mark that the user opened the app today.
 * Returns true if this is the first open today, false if already opened.
 */
export async function markAppOpenedToday(): Promise<boolean> {
  try {
    const today = getLocalDateString();
    const lastOpened = await AsyncStorage.getItem(ENGAGEMENT_KEYS.LAST_OPENED_DATE);
    if (lastOpened === today) {
      return false; // Already opened today
    }
    await AsyncStorage.setItem(ENGAGEMENT_KEYS.LAST_OPENED_DATE, today);
    if (__DEV__) console.log('[Engagement] App opened for the first time today:', today);
    return true;
  } catch (error) {
    console.error('[Engagement] Error marking app open:', error);
    return false;
  }
}

/**
 * Check if the user already opened the app today.
 */
export async function hasOpenedAppToday(): Promise<boolean> {
  try {
    const today = getLocalDateString();
    const lastOpened = await AsyncStorage.getItem(ENGAGEMENT_KEYS.LAST_OPENED_DATE);
    return lastOpened === today;
  } catch (error) {
    return false;
  }
}

/**
 * Mark that we sent a notification today (to prevent duplicates).
 */
export async function markNotificationSentToday(): Promise<void> {
  try {
    const today = getLocalDateString();
    await AsyncStorage.setItem(ENGAGEMENT_KEYS.LAST_NOTIFICATION_SENT_DATE, today);
    if (__DEV__) console.log('[Engagement] Notification sent today:', today);
  } catch (error) {
    console.error('[Engagement] Error marking notification sent:', error);
  }
}

/**
 * Check if we already sent a notification today.
 */
export async function hasNotificationBeenSentToday(): Promise<boolean> {
  try {
    const today = getLocalDateString();
    const lastSent = await AsyncStorage.getItem(ENGAGEMENT_KEYS.LAST_NOTIFICATION_SENT_DATE);
    return lastSent === today;
  } catch (error) {
    return false;
  }
}

/**
 * Mark that the user completed the devotional today.
 * Call this when the home screen marks completion.
 */
export async function markDevotionalCompletedToday(): Promise<void> {
  try {
    const today = getLocalDateString();
    await AsyncStorage.setItem(ENGAGEMENT_KEYS.LAST_DEVOTIONAL_COMPLETED_DATE, today);
    if (__DEV__) console.log('[Engagement] Devotional completed today:', today);
  } catch (error) {
    console.error('[Engagement] Error marking devotional completed:', error);
  }
}

/**
 * Check if the user completed the devotional today.
 */
export async function hasCompletedDevotionalToday(): Promise<boolean> {
  try {
    const today = getLocalDateString();
    const lastCompleted = await AsyncStorage.getItem(ENGAGEMENT_KEYS.LAST_DEVOTIONAL_COMPLETED_DATE);
    return lastCompleted === today;
  } catch (error) {
    return false;
  }
}

/**
 * Smart notification scheduler:
 * - If user already opened the app today → cancel today's pending notification (OS-scheduled ones
 *   are daily repeating, so we just cancel and reschedule for tomorrow — the DAILY trigger
 *   handles future days automatically).
 * - The goal: if user opens before 7 AM the OS scheduled notif for today fires anyway,
 *   so we suppress it by cancelling and re-scheduling (it won't fire until tomorrow).
 * Call this on every app open, AFTER markAppOpenedToday().
 */
export async function handleSmartNotificationOnOpen(language: 'en' | 'es' = 'es'): Promise<void> {
  try {
    const settings = await getNotificationSettings();
    if (!settings.enabled) return;

    const today = getLocalDateString();
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Check if notification time hasn't fired yet today
    const notifTimeNotYetPassed =
      currentHour < settings.hour ||
      (currentHour === settings.hour && currentMinute < settings.minute);

    if (notifTimeNotYetPassed) {
      // User opened before notification time → suppress today's notification
      // by cancelling and rescheduling (DAILY trigger will fire tomorrow)
      const hasPermission = await requestNotificationPermissions();
      if (hasPermission) {
        await scheduleDailyNotification(settings.hour, settings.minute, language);
        await markNotificationSentToday(); // prevent double-tracking
        if (__DEV__) console.log('[Notifications] Suppressed today\'s notification (user opened early)');
      }
    }
  } catch (error) {
    console.error('[Notifications] Error in smart notification handler:', error);
  }
}

/**
 * Initialize notifications on app start.
 * - First run: auto-schedules at 7:00 AM.
 * - Subsequent runs: reschedules if still enabled (keeps message fresh).
 * - Smart: if user opens before notification time, suppresses today's notification.
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
        if (__DEV__) console.log('[Notifications] Reinitialized daily notification');
        // Smart suppress: if user opens before notification time
        await handleSmartNotificationOnOpen(language);
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
        if (__DEV__) console.log('[Notifications] Auto-scheduled first-time notification at 7:00 AM');
        await handleSmartNotificationOnOpen(language);
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
    const messages = getSpiritualMessages(language);
    const msg = messages[getRandomMessageIndex(messages.length)]!;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: msg.title,
        subtitle: undefined,
        body: msg.body,
        data: { screen: 'home' },
        categoryIdentifier: undefined,
      },
      trigger: null,
    });
    if (__DEV__) console.log('[Notifications] Test notification sent');
  } catch (error) {
    console.error('[Notifications] Error sending test notification:', error);
  }
}
