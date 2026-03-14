'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useRoomStore } from '@/lib/store';
import { Sidebar } from '@/components/Sidebar';
import type { Room, Category } from '@/types';
import { api } from '@/lib/api';

export default function ExplorePage() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { joinRoom } = useRoomStore();
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPrivate, setShowPrivate] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'users' | 'newest'>('newest');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [roomsData, categoriesData] = await Promise.all([
          api.getRooms(),
          api.getCategories(),
        ]);
        setRooms(roomsData);
        setCategories(categoriesData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleJoinRoom = useCallback(async (roomId: string) => {
    try {
      await joinRoom(roomId);
      router.push('/rooms');
    } catch (err) {
      console.error('Failed to join room:', err);
    }
  }, [joinRoom, router]);

  const handleLogout = useCallback(() => {
    logout();
    router.push('/login');
  }, [logout, router]);

  const filteredRooms = rooms
    .filter(room => {
      if (!showPrivate && room.is_private) return false;
      if (selectedCategory && room.category_id !== selectedCategory) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return room.name.toLowerCase().includes(query) || 
               room.description?.toLowerCase().includes(query);
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'users':
          return (b.user_count || 0) - (a.user_count || 0);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return null;
    const category = categories.find(c => c.id === categoryId);
    return category?.name;
  };

  if (!user || isLoading) {
    return (
      <div className="app-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={handleLogout} />
      
      <div className="main-content">
        <div className="main-header">
          Explore Rooms
        </div>
        
        <div className="main-body">
          <div className="explore-page">
            <div className="explore-controls">
              <div className="search-bar">
                <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search rooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="filter-controls">
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="filter-select"
                >
                  <option value="newest">Newest</option>
                  <option value="name">Name</option>
                  <option value="users">Most Users</option>
                </select>
                
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showPrivate}
                    onChange={(e) => setShowPrivate(e.target.checked)}
                  />
                  Show Private Rooms
                </label>
              </div>
            </div>
            
            <div className="category-filters">
              <button
                className={`category-chip ${selectedCategory === null ? 'active' : ''}`}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`category-chip ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
            
            <div className="rooms-grid">
              {filteredRooms.length === 0 ? (
                <div className="empty-state">
                  <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3>No rooms found</h3>
                  <p>Try adjusting your filters or create a new room</p>
                </div>
              ) : (
                filteredRooms.map(room => (
                  <div key={room.id} className="room-card">
                    <div className="room-header">
                      <h3 className="room-name">{room.name}</h3>
                      {room.is_private && (
                        <span className="private-badge">Private</span>
                      )}
                    </div>
                    
                    {room.description && (
                      <p className="room-description">{room.description}</p>
                    )}
                    
                    <div className="room-meta">
                      <span className="user-count">
                        <svg className="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        {room.user_count || 0}/{room.max_users || 50}
                      </span>
                      {room.category_id && (
                        <span className="category-tag">
                          {getCategoryName(room.category_id)}
                        </span>
                      )}
                    </div>
                    
                    <button
                      className="join-button"
                      onClick={() => handleJoinRoom(room.id)}
                    >
                      Join Room
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .explore-page {
          padding: 0;
        }
        .explore-controls {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .search-bar {
          flex: 1;
          min-width: 250px;
          position: relative;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          color: #666;
        }
        .search-input {
          width: 100%;
          padding: 12px 12px 12px 44px;
          background: #1a1a2e;
          border: 1px solid #333;
          border-radius: 8px;
          color: white;
          font-size: 14px;
        }
        .search-input:focus {
          outline: none;
          border-color: #0f3460;
        }
        .filter-controls {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .filter-select {
          padding: 10px 16px;
          background: #1a1a2e;
          border: 1px solid #333;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          cursor: pointer;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #888;
          font-size: 14px;
          cursor: pointer;
        }
        .category-filters {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .category-chip {
          padding: 8px 16px;
          background: #1a1a2e;
          border: 1px solid #333;
          border-radius: 20px;
          color: #888;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .category-chip:hover {
          border-color: #0f3460;
          color: white;
        }
        .category-chip.active {
          background: #0f3460;
          border-color: #0f3460;
          color: white;
        }
        .rooms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .room-card {
          background: #1a1a2e;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 20px;
          transition: all 0.2s;
        }
        .room-card:hover {
          border-color: #0f3460;
          transform: translateY(-2px);
        }
        .room-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .room-name {
          font-size: 16px;
          font-weight: 600;
          color: white;
          margin: 0;
        }
        .private-badge {
          font-size: 11px;
          padding: 2px 8px;
          background: #333;
          border-radius: 4px;
          color: #888;
        }
        .room-description {
          font-size: 13px;
          color: #888;
          margin-bottom: 12px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .room-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }
        .user-count {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: #666;
        }
        .meta-icon {
          width: 16px;
          height: 16px;
        }
        .category-tag {
          font-size: 11px;
          padding: 2px 8px;
          background: #0f3460;
          border-radius: 4px;
          color: #4a90d9;
        }
        .join-button {
          width: 100%;
          padding: 10px;
          background: #0f3460;
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .join-button:hover {
          background: #1a4a7a;
        }
        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }
        .empty-icon {
          width: 64px;
          height: 64px;
          margin-bottom: 16px;
          color: #444;
        }
        .empty-state h3 {
          color: #888;
          margin-bottom: 8px;
        }
        .empty-state p {
          font-size: 14px;
        }
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          color: #888;
        }
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #333;
          border-top-color: #0f3460;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
