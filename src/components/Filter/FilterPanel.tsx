import React, { useState } from 'react';
import { RotateCcw, Filter, ChevronDown, ChevronUp, LayoutGrid, Table, ArrowUpDown, Heart, Train } from 'lucide-react';
import { FilterState } from '../../types/place';
import { SUBWAY_STATIONS } from '../../data/subwayStations';
import './FilterPanel.css';

interface FilterPanelProps {
  filterState: FilterState;
  onFilterChange: (newState: Partial<FilterState>) => void;
  onResetFilters: () => void;
  availableRegions: { name: string; count: number }[];
  availableCategories: { name: string; count: number }[];
  availableFoodTags: { name: string; count: number }[];
  filteredCount: number;
  totalCount: number;
  hasUserLocation: boolean;
  favoriteCount?: number;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filterState,
  onFilterChange,
  onResetFilters,
  availableRegions,
  availableCategories,
  availableFoodTags,
  filteredCount,
  totalCount,
  hasUserLocation,
  favoriteCount = 0,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'region' | 'category' | 'tag' | 'subway'>('region');

  // 다중 선택 토글 헬퍼
  const toggleArrayItem = (list: string[], item: string) => {
    if (list.includes(item)) {
      return list.filter((i) => i !== item);
    } else {
      return [...list, item];
    }
  };

  const hasActiveFilters =
    filterState.selectedRegions.length > 0 ||
    filterState.selectedCategories.length > 0 ||
    filterState.selectedFoodTags.length > 0 ||
    filterState.onlyFavorites ||
    Boolean(filterState.selectedStationId) ||
    Boolean(filterState.searchQuery);

  return (
    <div className="filter-panel-wrapper">
      {/* 모바일 접기/펼치기 헤더 */}
      <div className="filter-header-bar">
        <button
          type="button"
          className="filter-toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-expanded={!isCollapsed}
        >
          <Filter size={16} />
          <span>상세 필터 검색</span>
          {hasActiveFilters && <span className="active-dot" />}
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>

        {/* 선택된 조건 초기화 버튼 */}
        {hasActiveFilters && (
          <button type="button" className="reset-all-btn" onClick={onResetFilters}>
            <RotateCcw size={13} />
            <span>필터 초기화</span>
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="filter-body">
          {/* 탭 네비게이션 & 찜 필터 토글 */}
          <div className="filter-tabs-row">
            <div className="filter-tabs">
              <button
                type="button"
                className={`filter-tab-btn ${activeTab === 'region' ? 'active' : ''}`}
                onClick={() => setActiveTab('region')}
              >
                ① 읍면동 ({availableRegions.length})
                {filterState.selectedRegions.length > 0 && (
                  <span className="selected-count">{filterState.selectedRegions.length}</span>
                )}
              </button>
              <button
                type="button"
                className={`filter-tab-btn ${activeTab === 'category' ? 'active' : ''}`}
                onClick={() => setActiveTab('category')}
              >
                ② 업종 ({availableCategories.length})
                {filterState.selectedCategories.length > 0 && (
                  <span className="selected-count">{filterState.selectedCategories.length}</span>
                )}
              </button>
              <button
                type="button"
                className={`filter-tab-btn ${activeTab === 'tag' ? 'active' : ''}`}
                onClick={() => setActiveTab('tag')}
              >
                ③ 음식 종류 ({availableFoodTags.length})
                {filterState.selectedFoodTags.length > 0 && (
                  <span className="selected-count">{filterState.selectedFoodTags.length}</span>
                )}
              </button>
              <button
                type="button"
                className={`filter-tab-btn ${activeTab === 'subway' ? 'active' : ''}`}
                onClick={() => setActiveTab('subway')}
              >
                <Train size={13} />
                <span>④ 전철역 ({SUBWAY_STATIONS.length})</span>
                {filterState.selectedStationId && (
                  <span className="selected-count">1</span>
                )}
              </button>
            </div>

            {/* 찜한 맛집만 보기 토글 버튼 */}
            <button
              type="button"
              className={`filter-fav-toggle-btn ${filterState.onlyFavorites ? 'active' : ''}`}
              onClick={() => onFilterChange({ onlyFavorites: !filterState.onlyFavorites })}
              title="내가 찜한 맛집만 모아보기"
            >
              <Heart size={14} fill={filterState.onlyFavorites ? '#FFFFFF' : '#E76F51'} color={filterState.onlyFavorites ? '#FFFFFF' : '#E76F51'} />
              <span>찜한 맛집 ({favoriteCount})</span>
            </button>
          </div>

          {/* 탭 내용 영역 */}
          <div className="filter-tab-content">
            {/* 1. 읍면동 필터 */}
            {activeTab === 'region' && (
              <div className="filter-chip-group">
                <button
                  type="button"
                  className={`filter-chip ${filterState.selectedRegions.length === 0 ? 'selected all' : ''}`}
                  onClick={() => onFilterChange({ selectedRegions: [] })}
                >
                  전체 ({totalCount})
                </button>
                {availableRegions.map(({ name, count }) => {
                  const isSelected = filterState.selectedRegions.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      className={`filter-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() =>
                        onFilterChange({
                          selectedRegions: toggleArrayItem(filterState.selectedRegions, name),
                        })
                      }
                    >
                      <span>{name}</span>
                      <span className="chip-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. 업종 필터 */}
            {activeTab === 'category' && (
              <div className="filter-chip-group">
                <button
                  type="button"
                  className={`filter-chip ${filterState.selectedCategories.length === 0 ? 'selected all' : ''}`}
                  onClick={() => onFilterChange({ selectedCategories: [] })}
                >
                  전체 ({totalCount})
                </button>
                {availableCategories.map(({ name, count }) => {
                  const isSelected = filterState.selectedCategories.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      className={`filter-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() =>
                        onFilterChange({
                          selectedCategories: toggleArrayItem(filterState.selectedCategories, name),
                        })
                      }
                    >
                      <span>{name}</span>
                      <span className="chip-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3. 음식 종류 필터 */}
            {activeTab === 'tag' && (
              <div className="filter-chip-group">
                <button
                  type="button"
                  className={`filter-chip ${filterState.selectedFoodTags.length === 0 ? 'selected all' : ''}`}
                  onClick={() => onFilterChange({ selectedFoodTags: [] })}
                >
                  전체
                </button>
                {availableFoodTags.map(({ name, count }) => {
                  const isSelected = filterState.selectedFoodTags.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      className={`filter-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() =>
                        onFilterChange({
                          selectedFoodTags: toggleArrayItem(filterState.selectedFoodTags, name),
                        })
                      }
                    >
                      <span>{name}</span>
                      <span className="chip-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 4. 전철역 필터 (반경 1.5km 역세권) */}
            {activeTab === 'subway' && (
              <div className="filter-chip-group">
                <button
                  type="button"
                  className={`filter-chip ${!filterState.selectedStationId ? 'selected all' : ''}`}
                  onClick={() => onFilterChange({ selectedStationId: null })}
                >
                  전체
                </button>
                {SUBWAY_STATIONS.map((station) => {
                  const isSelected = filterState.selectedStationId === station.id;
                  return (
                    <button
                      key={station.id}
                      type="button"
                      className={`filter-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() =>
                        onFilterChange({
                          selectedStationId: isSelected ? null : station.id,
                        })
                      }
                    >
                      <span>{station.name}</span>
                      <span className="chip-line">{station.line}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ④ 선택한 조건 칩 목록 */}
          {hasActiveFilters && (
            <div className="active-filters-row">
              <span className="active-filters-label">적용 조건:</span>
              <div className="active-chips">
                {filterState.onlyFavorites && (
                  <span className="active-filter-chip favorite">
                    ♥ 찜한 맛집만
                    <button
                      type="button"
                      onClick={() => onFilterChange({ onlyFavorites: false })}
                    >
                      ×
                    </button>
                  </span>
                )}
                {filterState.selectedStationId && (
                  <span className="active-filter-chip station">
                    🚇 {SUBWAY_STATIONS.find((s) => s.id === filterState.selectedStationId)?.name} (1.5km)
                    <button
                      type="button"
                      onClick={() => onFilterChange({ selectedStationId: null })}
                    >
                      ×
                    </button>
                  </span>
                )}
                {filterState.selectedRegions.map((r) => (
                  <span key={r} className="active-filter-chip">
                    {r}
                    <button
                      type="button"
                      onClick={() =>
                        onFilterChange({
                          selectedRegions: filterState.selectedRegions.filter((i) => i !== r),
                        })
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
                {filterState.selectedCategories.map((c) => (
                  <span key={c} className="active-filter-chip">
                    {c}
                    <button
                      type="button"
                      onClick={() =>
                        onFilterChange({
                          selectedCategories: filterState.selectedCategories.filter((i) => i !== c),
                        })
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
                {filterState.selectedFoodTags.map((t) => (
                  <span key={t} className="active-filter-chip">
                    #{t}
                    <button
                      type="button"
                      onClick={() =>
                        onFilterChange({
                          selectedFoodTags: filterState.selectedFoodTags.filter((i) => i !== t),
                        })
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ⑤ 정렬 및 카드/테이블 뷰 컨트롤 바 */}
      <div className="filter-controls-bar">
        <div className="results-indicator">
          <strong>{filteredCount}곳</strong>의 업소 탐색됨
        </div>

        <div className="controls-right">
          {/* 정렬 드롭다운 */}
          <div className="sort-dropdown-container">
            <ArrowUpDown size={14} className="sort-icon" />
            <select
              className="sort-select"
              value={filterState.sortBy}
              onChange={(e) =>
                onFilterChange({ sortBy: e.target.value as 'name' | 'region' | 'distance' })
              }
              aria-label="정렬 기준 선택"
            >
              <option value="name">가나다순</option>
              <option value="region">지역순 (읍면동)</option>
              <option value="distance" disabled={!hasUserLocation}>
                {hasUserLocation ? '내 위치 거리순' : '거리순 (위치권한 필요)'}
              </option>
            </select>
          </div>

          {/* 카드 / 테이블 전환 토글 */}
          <div className="view-toggle-group" role="radiogroup" aria-label="보기 방식 선택">
            <button
              type="button"
              className={`view-toggle-btn ${filterState.viewMode === 'card' ? 'active' : ''}`}
              onClick={() => onFilterChange({ viewMode: 'card' })}
              title="카드보드 뷰"
              aria-checked={filterState.viewMode === 'card'}
              role="radio"
            >
              <LayoutGrid size={16} />
              <span className="btn-text">카드</span>
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${filterState.viewMode === 'table' ? 'active' : ''}`}
              onClick={() => onFilterChange({ viewMode: 'table' })}
              title="테이블 뷰"
              aria-checked={filterState.viewMode === 'table'}
              role="radio"
            >
              <Table size={16} />
              <span className="btn-text">목록</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
