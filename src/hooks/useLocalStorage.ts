import { useState, useEffect } from "react";

/**
 * Custom hook for managing state with localStorage persistence
 * @param key The localStorage key to store the data under
 * @param initialValue The initial value if no data exists in localStorage
 * @returns [storedValue, setValue] tuple similar to useState
 */
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Create state to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error, return initialValue
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      // Save state
      setStoredValue(valueToStore);

      // Save to local storage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Listen for changes in other tabs/windows
  useEffect(() => {
    function handleStorageChange(event: StorageEvent) {
      if (event.key === key && event.newValue) {
        try {
          setStoredValue(JSON.parse(event.newValue));
        } catch (error) {
          console.warn(`Error parsing localStorage value:`, error);
        }
      }
    }

    // Add event listener for storage changes
    window.addEventListener("storage", handleStorageChange);

    // Remove event listener on cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;
