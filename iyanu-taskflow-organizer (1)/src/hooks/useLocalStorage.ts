import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing state in localStorage
 * @param key The key to store the data under
 * @param initialValue The initial value if no data is found
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Get initial value from localStorage or use provided initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        try {
          return JSON.parse(item);
        } catch (e) {
          console.error(`Error parsing localStorage key "${key}":`, e);
          // If parsing fails, remove the invalid item and use initialValue
          window.localStorage.removeItem(key);
          return initialValue;
        }
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // Handle quota exceeded or other storage errors
      if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.error('LocalStorage quota exceeded!');
        alert('Storage is full. Some data might not be saved.');
      } else {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

/**
 * Utility to clear all app-related localStorage
 */
export const clearAppStorage = () => {
  try {
    const keysToRemove = [
      'taskflow-tasks',
      'taskflow-theme',
      'taskflow-accent',
      'taskflow-section'
    ];
    keysToRemove.forEach(key => window.localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};
