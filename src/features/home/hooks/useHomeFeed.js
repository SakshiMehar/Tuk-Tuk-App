import { useState, useEffect, useCallback } from 'react';
import { useHomeStore } from '../store/homeStore';

export function useHomeFeed() {
  const [loading, setLoading] = useState(false);
  const setRecommendedUsers = useHomeStore((s) => s.setRecommendedUsers);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      // Mock recommended users
      const users = [
        { id: 'u1', name: 'Zoya Khan', level: 14, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', tag: 'Singer' },
        { id: 'u2', name: 'Kabir Singhania', level: 22, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', tag: 'Host' },
        { id: 'u3', name: 'Aanya Sharma', level: 9, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', tag: 'Gamer' },
        { id: 'u4', name: 'Rohan Mehta', level: 18, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', tag: 'DJ' },
      ];
      setRecommendedUsers(users);
    } finally {
      setLoading(false);
    }
  }, [setRecommendedUsers]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return { loading, refresh: loadFeed };
}

export default useHomeFeed;
