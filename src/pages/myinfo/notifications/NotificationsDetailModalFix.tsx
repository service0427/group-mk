      {/* 알림 상세 모달 */}
      {selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          open={!!selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onMarkAsRead={markAsRead}
          onArchive={archiveNotification}
          onDelete={(id) => {
            setNotificationToDelete(id);
            setDeleteMultiple(false);
            setShowDeleteConfirm(true);
            setSelectedNotification(null);
          }}
        />
      )}