import React from 'react';
import { Search, MapPin, Navigation, X, Dices, Share2 } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCount: number;
  filteredCount: number;
  onGetCurrentLocation: () => void;
  isLocating: boolean;
  hasUserLocation: boolean;
  onOpenRoulette: () => void;
  onShare: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  totalCount,
  filteredCount,
  onGetCurrentLocation,
  isLocating,
  hasUserLocation,
  onOpenRoulette,
  onShare,
}) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo-group">
          <div className="logo-icon-wrapper" aria-hidden="true">
            <MapPin className="logo-icon" size={24} />
          </div>
          <div className="title-group">
            <h1 className="service-title">남양주 맛집지도</h1>
            <p className="service-subtitle">우리 동네 맛집부터 주말에 가고 싶은 베이커리까지</p>
          </div>
        </div>
        <span className="source-tag">남양주시 인스타그램 소개 업소 모음</span>
      </div>

      <div className="header-center">
        <div className="search-container">
          <Search className="search-icon" size={18} aria-hidden="true" />
          <input
            type="text"
            className="search-input"
            placeholder="상호명, 도로명 주소, 메뉴/비고 통합 검색..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="맛집 검색"
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => onSearchChange('')}
              aria-label="검색어 지우기"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="header-right">
        {/* 오늘 뭐 먹지? 룰렛 추천 버튼 */}
        <button
          type="button"
          className="header-tool-btn roulette"
          onClick={onOpenRoulette}
          title="오늘 뭐 먹지? 랜덤 맛집 뽑기"
        >
          <Dices size={16} />
          <span>오늘 뭐 먹지?</span>
        </button>

        {/* 내 주변 탐색 버튼 */}
        <button
          type="button"
          className={`location-btn ${hasUserLocation ? 'active' : ''}`}
          onClick={onGetCurrentLocation}
          disabled={isLocating}
          title="현재 내 위치 주변 맛집 찾기"
        >
          <Navigation className={`nav-icon ${isLocating ? 'spin' : ''}`} size={16} />
          <span>{hasUserLocation ? '내 위치 기준' : '내 주변 탐색'}</span>
        </button>

        {/* 링크 공유하기 버튼 */}
        <button
          type="button"
          className="header-tool-btn share"
          onClick={onShare}
          title="현재 검색 조건 링크 복사"
          aria-label="링크 공유하기"
        >
          <Share2 size={16} />
        </button>

        <div className="counter-box" aria-live="polite">
          <span className="counter-label">탐색 결과</span>
          <span className="counter-value">
            <strong>{filteredCount}</strong>
            <span className="counter-total"> / {totalCount}곳</span>
          </span>
        </div>
      </div>
    </header>
  );
};
