import { useCallback, useState } from "react";

function useApi(apiFunction) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError("");

        const result = await apiFunction(...args);

        setData(result);

        return result;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Something went wrong.";

        setError(message);

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError("");
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

export default useApi;