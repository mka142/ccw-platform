import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

import { config, STORAGE_KEYS } from "../config";

import type { ReactNode } from "react";

interface UserContextValue {
  /** Current user ID (null if not acquired yet) */
  userId: string | null;

  /** Whether the user ID is being fetched */
  isLoading: boolean;

  /** Error that occurred during user acquisition */
  error: Error | null;

  /** Current retry attempt number (0 if not retrying) */
  retryCount: number;

  /** Manually refresh/re-acquire user ID */
  refreshUserId: () => Promise<void>;

  /** Clear user ID (logout) */
  clearUserId: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

interface UserProviderProps {
  children: ReactNode;
  /** Device manager API base URL */
  apiBaseUrl?: string;
  /** Use sessionStorage instead of localStorage (cleared on tab close) */
  useSessionStorage?: boolean;
  /** Retry interval in milliseconds (default: 5000ms) */
  retryIntervalMs?: number;
  /** Maximum number of retry attempts (default: 5, 0 = infinite) */
  maxRetries?: number;
}

/**
 * Provider component for User management
 * Handles user ID acquisition and persistence
 *
 * @example
 * ```tsx
 * <UserProvider>
 *   <DeviceManagerProvider>
 *     <App />
 *   </DeviceManagerProvider>
 * </UserProvider>
 * ```
 */
export function UserProvider({
  children,
  apiBaseUrl = config.api.baseUrl,
  useSessionStorage = config.storage.useSessionStorage,
  retryIntervalMs = config.retry.intervalMs,
  maxRetries = config.retry.maxAttempts,
}: UserProviderProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const isAcquiringRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0); // Use ref to avoid triggering useEffect

  /**
   * Get storage instance (localStorage or sessionStorage)
   */
  const getStorage = useCallback(() => {
    return useSessionStorage ? sessionStorage : localStorage;
  }, [useSessionStorage]);

  /**
   * Load user ID from storage
   */
  const loadUserIdFromStorage = useCallback((): string | null => {
    try {
      const storage = getStorage();
      const storedUserId = storage.getItem(STORAGE_KEYS.USER_ID);
      if (
        !storedUserId ||
        storedUserId === "null" ||
        storedUserId === "undefined"
      ) {
        return null;
      }
      return storedUserId;
    } catch (err) {
      console.warn("Failed to load userId from storage:", err);
      return null;
    }
  }, [getStorage]);

  /**
   * Save user ID to storage
   */
  const saveUserIdToStorage = useCallback(
    (id: string) => {
      try {
        const storage = getStorage();
        storage.setItem(STORAGE_KEYS.USER_ID, id);
      } catch (err) {
        console.warn("Failed to save userId to storage:", err);
      }
    },
    [getStorage]
  );

  /**
   * Remove user ID from storage
   */
  const removeUserIdFromStorage = useCallback(() => {
    try {
      const storage = getStorage();
      storage.removeItem(STORAGE_KEYS.USER_ID);
    } catch (err) {
      console.warn("Failed to remove userId from storage:", err);
    }
  }, [getStorage]);

  /**
   * Acquire user ID from device manager API
   */
  const acquireUserId = useCallback(
    async (existingUserId?: string | null): Promise<string> => {
      if (isAcquiringRef.current) {
        console.warn(
          "User ID acquisition already in progress. It's most likely to the React strict mode double-invocation in development. Be aware if you see this message in production"
        );
      }

      isAcquiringRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        // Include existing userId in header if available
        if (existingUserId) {
          headers["X-User-Id"] = existingUserId;
        }

        console.log("🔐 Acquiring user ID from device manager...", {
          existingUserId: existingUserId ? "present" : "none",
        });

        const inputData = { deviceType: "Web" };

        const response = await fetch(config.api.user.acquire, {
          method: "POST",
          headers,
          body: JSON.stringify(inputData),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to acquire user ID: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        const _userId = data?.data?.userId;

        if (!_userId) {
          throw new Error("Invalid response: userId not found");
        }

        const newUserId = _userId;
        console.log("✅ User ID acquired:", newUserId);

        // Save to storage and state
        saveUserIdToStorage(newUserId);
        setUserId(newUserId);

        return newUserId;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to acquire user ID");
        console.error("❌ User ID acquisition failed:", error);
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
        isAcquiringRef.current = false;
      }
    },
    [apiBaseUrl, saveUserIdToStorage]
  );

  /**
   * Initialize user ID on mount with retry logic
   */
  const initializeUserId = useCallback(async () => {
    // Try to load from storage first
    const storedUserId = loadUserIdFromStorage();

    if (storedUserId) {
      console.log("📦 Found user ID in storage:", storedUserId);
      //setUserId(storedUserId);
    }

    // Acquire or validate user ID from server
    try {
      await acquireUserId(storedUserId);

      // Reset retry count on success
      retryCountRef.current = 0;
      setRetryCount(0);
    } catch (err) {
      // Error already logged and set in state
      console.error("Failed to initialize user ID", err);

      // Retry logic using ref to avoid triggering useCallback re-run
      const currentRetry = retryCountRef.current;
      const shouldRetry = maxRetries === 0 || currentRetry < maxRetries;

      if (shouldRetry) {
        const nextRetry = currentRetry + 1;
        retryCountRef.current = nextRetry;
        setRetryCount(nextRetry);

        console.log(
          `⏱️ Retrying user ID acquisition in ${retryIntervalMs}ms (attempt ${nextRetry}${maxRetries > 0 ? `/${maxRetries}` : ""})...`
        );

        // Clear any existing timeout
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }

        // Schedule retry
        retryTimeoutRef.current = setTimeout(() => {
          initializeUserId();
        }, retryIntervalMs);
      } else {
        console.error(
          `❌ Max retry attempts (${maxRetries}) reached. Giving up.`
        );
        setIsLoading(false);
      }
    }
  }, [
    loadUserIdFromStorage,
    acquireUserId,
    maxRetries,
    retryIntervalMs,
  ]);

  /**
   * Manually refresh user ID
   */
  const refreshUserId = useCallback(async () => {
    const currentUserId = loadUserIdFromStorage();
    await acquireUserId(currentUserId);
  }, [loadUserIdFromStorage, acquireUserId]);

  /**
   * Clear user ID (logout)
   */
  const clearUserId = useCallback(() => {
    console.log("🚪 Clearing user ID");
    removeUserIdFromStorage();
    setUserId(null);
    setError(null);
  }, [removeUserIdFromStorage]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    initializeUserId();

    // Cleanup: clear retry timeout on unmount
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [initializeUserId]);

  const value: UserContextValue = {
    userId,
    isLoading,
    error,
    retryCount,
    refreshUserId,
    clearUserId,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/**
 * Hook to access User context
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { userId, isLoading } = useUser();
 *
 *   if (isLoading) {
 *     return <div>Loading user...</div>;
 *   }
 *
 *   return <div>User ID: {userId}</div>;
 * }
 * ```
 */
export function useUser(): UserContextValue {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
}

/**
 * Hook to get just the user ID (convenience hook)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const userId = useUserId();
 *   return <div>User: {userId}</div>;
 * }
 * ```
 */
export function useUserId(): string | null {
  const { userId } = useUser();
  return userId;
}
