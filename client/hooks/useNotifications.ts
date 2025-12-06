import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useStore } from '@/lib/store';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export function useNotifications() {
    const { streak } = useStore();
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);

    useEffect(() => {
        // registerForPushNotificationsAsync();

        // Request permissions for local notifications
        (async () => {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
        })();

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            // console.log(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            // console.log(response);
        });

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, []);

    // Schedule daily notification
    useEffect(() => {
        scheduleDailyNotification();
    }, [streak.lastCompletedDate, streak.freezers, streak.currentStreak]);

    async function scheduleDailyNotification() {
        // Cancel all existing notifications first to avoid duplicates
        await Notifications.cancelAllScheduledNotificationsAsync();

        // Check if test completed today
        const today = new Date().toDateString();
        const lastCompleted = streak.lastCompletedDate ? new Date(streak.lastCompletedDate).toDateString() : null;

        if (today === lastCompleted) {
            // Already completed today, no need to schedule for today.
            // But we should schedule for tomorrow? 
            // The requirement says: "upozornění každý den v náhodný čas mezi 18:00 - 20:00 pokud ten den ještě nebyl splněn test"
            // If we schedule it daily, and the user completes it, we should probably cancel the one for today.
            // Since we cancel all above, we just need to schedule for tomorrow if done today, or today if not done.

            // Actually, simplest is to schedule for "next occurrence" of 18:00-20:00.
            // But we want to customize the message based on streak/freezers.
            // So we should probably schedule just one notification for the near future (today or tomorrow).
        }

        // Logic:
        // We want a notification today between 18:00 and 20:00.
        // If it's already past 20:00, schedule for tomorrow.
        // If it's before 18:00, schedule for today.
        // If it's between 18:00 and 20:00, schedule for a bit later or tomorrow?

        // Random time between 18:00 and 20:00
        const randomHour = 18 + Math.random() * 2; // 18.0 to 20.0
        const hour = Math.floor(randomHour);
        const minute = Math.floor((randomHour - hour) * 60);

        const now = new Date();
        let triggerDate = new Date();
        triggerDate.setHours(hour, minute, 0, 0);

        if (now > triggerDate) {
            // If time passed, schedule for tomorrow
            triggerDate.setDate(triggerDate.getDate() + 1);
        }

        // If test completed today, and trigger date is today, move to tomorrow
        if (today === lastCompleted && triggerDate.toDateString() === today) {
            triggerDate.setDate(triggerDate.getDate() + 1);
        }

        // Message logic
        let title = "Keep your streak alive!";
        let body = "Complete a quiz to maintain your streak.";

        if (streak.currentStreak > 0) {
            if (streak.freezers > 0) {
                body = `Don't lose your ${streak.currentStreak} day streak! You have ${streak.freezers} freezers available, but better save them!`;
            } else {
                body = `Warning! You will lose your ${streak.currentStreak} day streak if you don't complete a quiz today!`;
            }
        } else {
            title = "Start a streak!";
            body = "Complete a quiz today to start your streak.";
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: triggerDate,
            },
        });
    }

    // async function registerForPushNotificationsAsync() {
    //     const { status: existingStatus } = await Notifications.getPermissionsAsync();
    //     let finalStatus = existingStatus;
    //     if (existingStatus !== 'granted') {
    //         const { status } = await Notifications.requestPermissionsAsync();
    //         finalStatus = status;
    //     }
    //     if (finalStatus !== 'granted') {
    //         // alert('Failed to get push token for push notification!');
    //         return;
    //     }
    // }
}
