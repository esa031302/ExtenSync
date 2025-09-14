import { useState, useEffect, useCallback } from 'react';

// Custom hook for managing notifications with auto-dismiss
export const useNotification = (defaultDuration = 5000) => {
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    variant: 'info'
  });

  // Auto-dismiss timer
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, defaultDuration);

      return () => clearTimeout(timer);
    }
  }, [notification.show, defaultDuration]);

  // Show success notification
  const showSuccess = useCallback((message) => {
    setNotification({
      show: true,
      message: message,
      variant: 'success'
    });
  }, []);

  // Show error notification
  const showError = useCallback((message) => {
    setNotification({
      show: true,
      message: message,
      variant: 'danger'
    });
  }, []);

  // Show info notification
  const showInfo = useCallback((message) => {
    setNotification({
      show: true,
      message: message,
      variant: 'info'
    });
  }, []);

  // Show warning notification
  const showWarning = useCallback((message) => {
    setNotification({
      show: true,
      message: message,
      variant: 'warning'
    });
  }, []);

  // Manually dismiss notification
  const dismiss = useCallback(() => {
    setNotification(prev => ({ ...prev, show: false }));
  }, []);

  return {
    notification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    dismiss
  };
};

// Standardized message templates
export const NotificationMessages = {
  // Project messages
  PROJECT_CREATED: "Project created successfully.",
  PROJECT_UPDATED: "Project updated successfully.",
  PROJECT_DELETED: "Project deleted successfully.",
  PROJECT_STARTED: "Project started successfully.",
  PROJECT_COMPLETED: "Project completed successfully.",
  PROJECT_COMPLETED_EARLY: "Project completed early successfully.",
  PROJECT_APPROVED: "Project approved successfully.",
  PROJECT_REJECTED: "Project rejected successfully.",
  PROJECT_REPROPOSED: "Project reproposed successfully.",
  
  // User messages
  USER_CREATED: "User created successfully.",
  USER_UPDATED: "User updated successfully.",
  USER_DELETED: "User deleted successfully.",
  
  // Profile messages
  PROFILE_UPDATED: "Profile updated successfully.",
  PROFILE_PHOTO_UPDATED: "Profile photo updated successfully.",
  PROFILE_PHOTO_DELETED: "Profile photo deleted successfully.",
  
  // Document messages
  DOCUMENT_UPLOADED: "Document uploaded successfully.",
  DOCUMENT_DELETED: "Document deleted successfully.",
  
  // Evaluation messages
  EVALUATION_UPDATED: "Evaluation updated successfully.",
  EVALUATION_DELETED: "Evaluation deleted successfully.",
  
  // System messages
  LOG_DELETED: "Log entry deleted successfully.",
  
  // Authentication messages
  LOGIN_SUCCESS: "Welcome back! You have been logged in successfully.",
  LOGOUT_SUCCESS: "You have been logged out successfully.",
  REGISTRATION_SUCCESS: "Account created successfully.",
  
  // Error messages
  LOAD_ERROR: "Failed to load data. Please try again.",
  SAVE_ERROR: "Failed to save changes. Please try again.",
  DELETE_ERROR: "Failed to delete item. Please try again.",
  UPLOAD_ERROR: "Failed to upload file. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  PERMISSION_ERROR: "You don't have permission to perform this action.",
  VALIDATION_ERROR: "Please check your input and try again.",
  
  // Generic messages
  OPERATION_SUCCESS: "Operation completed successfully.",
  OPERATION_FAILED: "Operation failed. Please try again."
};
