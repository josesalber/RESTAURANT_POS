import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '@services/api';

export default function useApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (method, url, data = null, options = {}) => {
      const { showErrorToast = true, showSuccessToast = false, successMessage } = options;

      try {
        setIsLoading(true);
        setError(null);

        const config = { method, url };
        if (data) {
          if (method === 'get') {
            config.params = data;
          } else {
            config.data = data;
          }
        }

        const response = await api(config);

        if (showSuccessToast && successMessage) {
          toast.success(successMessage);
        }

        return response.data;
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Error en la operación';
        setError(errorMessage);

        if (showErrorToast) {
          toast.error(errorMessage);
        }

        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const get = useCallback(
    (url, params, options) => execute('get', url, params, options),
    [execute]
  );

  const post = useCallback(
    (url, data, options) => execute('post', url, data, options),
    [execute]
  );

  const put = useCallback(
    (url, data, options) => execute('put', url, data, options),
    [execute]
  );

  const patch = useCallback(
    (url, data, options) => execute('patch', url, data, options),
    [execute]
  );

  const del = useCallback(
    (url, options) => execute('delete', url, null, options),
    [execute]
  );

  return {
    isLoading,
    error,
    get,
    post,
    put,
    patch,
    delete: del,
    execute,
  };
}
