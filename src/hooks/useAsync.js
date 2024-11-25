import { useState, useCallback } from 'react';

export function useAsync() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (promise) => {
    try {
      setLoading(true);
      setError(null);
      const result = await promise;
      return result;
    } catch (error) {
      setError(error.message || 'Something went wrong');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, run };
} 