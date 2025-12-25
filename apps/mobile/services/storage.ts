/**
 * Storage Service
 *
 * Wrapper around AsyncStorage for type-safe local storage.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

class StorageService {
  // Get item with type safety
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Storage get error:", error);
      return null;
    }
  }

  // Set item
  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Storage set error:", error);
      return false;
    }
  }

  // Remove item
  async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Storage remove error:", error);
      return false;
    }
  }

  // Remove multiple items
  async removeMultiple(keys: string[]): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      console.error("Storage multiRemove error:", error);
      return false;
    }
  }

  // Clear all storage (use with caution)
  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error("Storage clear error:", error);
      return false;
    }
  }

  // Get all keys
  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return [...keys];
    } catch (error) {
      console.error("Storage getAllKeys error:", error);
      return [];
    }
  }
}

export const storage = new StorageService();
export default storage;
