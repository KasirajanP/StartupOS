import { useEffect, useState } from "react";

export function useAsyncData(loader, dependencies = [], initialValue = null) {
  const [data, setData] = useState(initialValue);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setIsLoading(true);
      setError("");

      try {
        const result = await loader();
        if (isMounted) {
          setData(result);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError?.response?.data?.detail || "Unable to load data.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    run();

    return () => {
      isMounted = false;
    };
  }, [...dependencies, reloadToken]);

  function reload() {
    setReloadToken((current) => current + 1);
  }

  return { data, error, isLoading, setData, reload };
}
