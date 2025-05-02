import { default as NotificationManagePageComponent } from './NotificationManagePage';

export { NotificationManagePageComponent as NotificationPage };
export { default as NotificationManagePage } from './NotificationManagePage';

// Export utility functions
export { checkNotificationAggregatesTable, checkAndInitializeTable } from './utils/check-table';
export { validateAggregateTable, refreshStats } from './utils/initializeStats';
export { fetchAllNotificationStats } from './stats-helper';

// Export hooks
export { useNotifications } from './hooks/useNotifications';
export { useNotificationStats } from './hooks/useNotificationStats';

// Export services
export * from './services/notificationService';
export * from './services/notificationAggregateService';