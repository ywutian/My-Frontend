import { useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    if (typeof message === 'string') {
      setToast({ message, type });
    } else {
      setToast(message);
    }

    if (message) {
      setTimeout(() => {
        setToast(null);
      }, 3000);
    }
  };

  return { toast, showToast };
} 