import { toast } from 'sonner';

export const handleError = (error, userMessage = 'An error occurred') => {
  console.error('Error:', error);
  toast.error(userMessage);
};

export const handleAsyncOperation = async (operation, errorMessage) => {
  try {
    return await operation();
  } catch (error) {
    handleError(error, errorMessage);
    throw error;
  }
};

export const withErrorHandling = (fn, errorMessage) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, errorMessage);
    }
  };
};