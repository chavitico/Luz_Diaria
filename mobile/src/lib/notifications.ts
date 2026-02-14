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
  enabled: false,
  hour: 6, // 6:00 AM default
  minute: 0,
};

// Configure notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
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
      name: 'Devotional Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E8A87C',
      sound: 'default',
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
 * Schedule a daily notification for the devotional
 */
export async function scheduleDailyNotification(
  hour: number,
  minute: number,
  language: 'en' | 'es' = 'es'
): Promise<string | null> {
  try {
    // Cancel any existing scheduled notifications first
    await cancelAllScheduledNotifications();

    const notificationContent = {
      title: language === 'es' ? '🕊️ Tu devocional te espera' : '🕊️ Your devotional awaits',
      body: language === 'es'
        ? 'Es hora de tu momento de reflexión diaria. ¡Abre la app y nutre tu espíritu!'
        : 'Time for your daily reflection. Open the app and nourish your spirit!',
      sound: 'default' as const,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    };

    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    };

    const identifier = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger,
    });

    console.log(`[Notifications] Scheduled daily notification at ${hour}:${minute.toString().padStart(2, '0')}, ID: ${identifier}`);

    // Save settings
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

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Notifications] All scheduled notifications cancelled');

    // Update settings
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
 * Format time for display (e.g., "6:00 AM" or "06:00")
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
 * Initialize notifications on app start
 * Reschedules notification if enabled in settings
 */
export async function initializeNotifications(language: 'en' | 'es' = 'es'): Promise<void> {
  try {
    const settings = await getNotificationSettings();

    if (settings.enabled) {
      const hasPermission = await requestNotificationPermissions();
      if (hasPermission) {
        // Reschedule the notification to ensure it's active
        await scheduleDailyNotification(settings.hour, settings.minute, language);
        console.log('[Notifications] Reinitialized daily notification');
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
    await Notifications.scheduleNotificationAsync({
      content: {
        title: language === 'es' ? '🔔 Notificación de prueba' : '🔔 Test Notification',
        body: language === 'es'
          ? '¡Las notificaciones están funcionando correctamente!'
          : 'Notifications are working correctly!',
        sound: 'default',
      },
      trigger: null, // Immediately
    });
    console.log('[Notifications] Test notification sent');
  } catch (error) {
    console.error('[Notifications] Error sending test notification:', error);
  }
}
