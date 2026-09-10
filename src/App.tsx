import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Place, FilterState, UserLocation } from './types/place';
import placesRawData from './assets/namyangju_places.json';
import { SUBWAY_STATIONS } from './data/subwayStations';
import { Header } from './components/Header/Header';
import { FilterPanel } from './components/Filter/FilterPanel';
import { VWorldMap } from './components/Map/VWorldMap';
import { PlaceListView } from './components/PlaceList/PlaceListView';
import { RandomRouletteModal } from './components/RandomRoulette/RandomRouletteModal';
import { calculateDistanceKm } from './utils/distance';
import { getFilterStateFromUrl, syncFilterStateToUrl } from './utils/urlState';
import { Map, List, CheckCircle } from 'lucide-react';
import './App.css';

export const App: React.FC = () => {
  // 1. 초기 데이터셋 (241개 항목)
  const initialPlaces = useMemo<Place[]>(() => {
    return (placesRawData as unknown as Place[]).map((p) => ({
      ...p,
      foodTags: p.foodTags || [],
    }));
  }, []);

  // 2. 찜 목록 (로컬스토리지 기반 즐겨찾기)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('namyangju_saved_places');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 3. URL 파라미터 복원 및 기본 필터 상태
  const [filterState, setFilterState] = useState<FilterState>(() => {
    const urlState = getFilterStateFromUrl();
    return {
      searchQuery: urlState.searchQuery || '',
      selectedRegions: urlState.selectedRegions || [],
      selectedCategories: urlState.selectedCategories || [],
      selectedFoodTags: urlState.selectedFoodTags || [],
      selectedStationId: urlState.selectedStationId || null,
      onlyFavorites: Boolean(urlState.onlyFavorites),
      sortBy: urlState.sortBy || 'name',
      viewMode: urlState.viewMode || 'card',
    };
  });

  // 4. 사용자 위치 및 상태
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // 5. 부가 편의 상태 (룰렛 모달, 토스트 피드백)
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 모바일 화면 모드 (지도 vs 목록)
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map');

  // URL 동기화
  useEffect(() => {
    syncFilterStateToUrl(filterState);
  }, [filterState]);

  // 찜 토글 핸들러
  const handleToggleFavorite = useCallback((placeId: string) => {
    setFavoriteIds((prev) => {
      const updated = prev.includes(placeId)
        ? prev.filter((id) => id !== placeId)
        : [...prev, placeId];
      try {
        localStorage.setItem('namyangju_saved_places', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
      return updated;
    });
  }, []);

  // 링크 공유 핸들러
  const handleShare = useCallback(() => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setToastMessage('현재 맛집 검색 링크가 복사되었습니다! 친구나 가족에게 전송해보세요.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  }, []);

  // 6. 사용자 위치 취득 (Geolocation API)
  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('사용하시는 브라우저에서 위치 정보를 지원하지 않습니다.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const loc: UserLocation = {
          longitude: pos.coords.longitude,
          latitude: pos.coords.latitude,
          accuracy: pos.coords.accuracy,
        };
        setUserLocation(loc);
        // 위치를 가져왔으면 자동으로 거리순 정렬 활성화
        setFilterState((prev) => ({ ...prev, sortBy: 'distance' }));
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        if (err.code === err.PERMISSION_DENIED) {
          alert('위치 정보 접근 권한이 허용되지 않았습니다. 브라우저 설정에서 위치 권한을 확인해주세요.');
        } else {
          const confirmSim = window.confirm(
            '실제 GPS 위치를 가져오지 못했습니다. 남양주시청(다산동)을 기준으로 주변 맛집을 탐색하시겠습니까?'
          );
          if (confirmSim) {
            setUserLocation({
              longitude: 127.1598,
              latitude: 37.6361,
            });
            setFilterState((prev) => ({ ...prev, sortBy: 'distance' }));
          }
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  // 7. 사용 가능한 필터 옵션들 (CSV 데이터에서 동적 계산 - 하드코딩 금지)
  const availableRegions = useMemo(() => {
    const counts: Record<string, number> = {};
    initialPlaces.forEach((p) => {
      counts[p.sourceRegion] = (counts[p.sourceRegion] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [initialPlaces]);

  const availableCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    initialPlaces.forEach((p) => {
      counts[p.businessCategory] = (counts[p.businessCategory] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [initialPlaces]);

  const availableFoodTags = useMemo(() => {
    const counts: Record<string, number> = {};
    initialPlaces.forEach((p) => {
      if (p.foodTags && p.foodTags.length > 0) {
        p.foodTags.forEach((tag) => {
          if (tag !== '미분류') {
            counts[tag] = (counts[tag] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [initialPlaces]);

  // 8. 필터링 및 거리 계산 로직
  const filteredAndSortedPlaces = useMemo(() => {
    // 선택된 전철역 정보 조회
    const selectedStation = filterState.selectedStationId
      ? SUBWAY_STATIONS.find((s) => s.id === filterState.selectedStationId)
      : null;

    return initialPlaces
      .map((place) => {
        // 내 위치가 있으면 거리(km) 계산 추가
        let dist: number | undefined = undefined;
        if (
          userLocation &&
          place.latitude !== null &&
          place.longitude !== null &&
          place.geocodeStatus === '정상'
        ) {
          dist = calculateDistanceKm(
            userLocation.latitude,
            userLocation.longitude,
            place.latitude,
            place.longitude
          );
        }
        return {
          ...place,
          distanceKm: dist,
          isFavorite: favoriteIds.includes(place.id),
        };
      })
      .filter((place) => {
        // 찜한 맛집만 보기 필터
        if (filterState.onlyFavorites) {
          if (!favoriteIds.includes(place.id)) return false;
        }

        // 전철역 역세권 반경 1.5km 필터
        if (selectedStation) {
          if (place.latitude === null || place.longitude === null) return false;
          const distToStation = calculateDistanceKm(
            selectedStation.latitude,
            selectedStation.longitude,
            place.latitude,
            place.longitude
          );
          if (distToStation > 1.5) return false;
        }

        // 검색어 필터 (상호명, 도로명 주소, 비고)
        if (filterState.searchQuery.trim()) {
          const q = filterState.searchQuery.trim().toLowerCase();
          const nameMatch = place.name.toLowerCase().includes(q);
          const addrMatch = place.address.toLowerCase().includes(q);
          const noteMatch = place.note ? place.note.toLowerCase().includes(q) : false;
          if (!nameMatch && !addrMatch && !noteMatch) return false;
        }

        // 읍면동 필터 (선택된 것 중 하나라도 일치 - OR)
        if (filterState.selectedRegions.length > 0) {
          if (!filterState.selectedRegions.includes(place.sourceRegion)) {
            return false;
          }
        }

        // 업종 필터 (선택된 것 중 하나라도 일치 - OR)
        if (filterState.selectedCategories.length > 0) {
          if (!filterState.selectedCategories.includes(place.businessCategory)) {
            return false;
          }
        }

        // 음식 종류 태그 필터 (선택된 것 중 하나라도 일치 - OR)
        if (filterState.selectedFoodTags.length > 0) {
          const hasTag = place.foodTags?.some((t) => filterState.selectedFoodTags.includes(t));
          if (!hasTag) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // 거리순 정렬
        if (filterState.sortBy === 'distance') {
          if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
            return a.distanceKm - b.distanceKm;
          }
          if (a.distanceKm !== undefined) return -1;
          if (b.distanceKm !== undefined) return 1;
        }

        // 지역순 정렬
        if (filterState.sortBy === 'region') {
          const regComp = a.sourceRegion.localeCompare(b.sourceRegion, 'ko');
          if (regComp !== 0) return regComp;
        }

        // 기본: 상호명 가나다순
        return a.name.localeCompare(b.name, 'ko');
      });
  }, [initialPlaces, filterState, userLocation, favoriteIds]);

  // 필터 초기화
  const handleResetFilters = useCallback(() => {
    setFilterState({
      searchQuery: '',
      selectedRegions: [],
      selectedCategories: [],
      selectedFoodTags: [],
      selectedStationId: null,
      onlyFavorites: false,
      sortBy: 'name',
      viewMode: 'card',
    });
  }, []);

  // 지도 경계 클릭 시 지역 필터 토글
  const handleToggleRegionFilter = useCallback((regionName: string) => {
    setFilterState((prev) => {
      const exists = prev.selectedRegions.includes(regionName);
      return {
        ...prev,
        selectedRegions: exists
          ? prev.selectedRegions.filter((r) => r !== regionName)
          : [...prev.selectedRegions, regionName],
      };
    });
  }, []);

  // 마커 팝오버에서 '카드 보기' 클릭 시 -> 목록 탭으로 전환 후 해당 카드로 포커스
  const handleSelectPlaceFromMap = useCallback((place: Place) => {
    setSelectedPlace(place);
    setFilterState((prev) => ({ ...prev, viewMode: 'card' }));
    setMobileTab('list');
  }, []);

  // 카드에서 '지도에서 보기' 클릭 시 -> 지도 탭으로 전환 후 해당 마커로 이동
  const handleViewOnMapFromCard = useCallback((place: Place) => {
    setSelectedPlace(place);
    setMobileTab('map');
  }, []);

  return (
    <div className="app-container">
      {/* 상단 공통 헤더 */}
      <Header
        searchQuery={filterState.searchQuery}
        onSearchChange={(q) => setFilterState((prev) => ({ ...prev, searchQuery: q }))}
        totalCount={initialPlaces.length}
        filteredCount={filteredAndSortedPlaces.length}
        onGetCurrentLocation={handleGetCurrentLocation}
        isLocating={isLocating}
        hasUserLocation={Boolean(userLocation)}
        onOpenRoulette={() => setIsRouletteOpen(true)}
        onShare={handleShare}
      />

      {/* 모바일 상단 뷰 전환 탭 (768px 이하에서 노출) */}
      <div className="mobile-view-tabs" role="tablist" aria-label="모바일 보기 모드 선택">
        <button
          type="button"
          className={`mobile-tab-btn ${mobileTab === 'map' ? 'active' : ''}`}
          onClick={() => setMobileTab('map')}
          role="tab"
          aria-selected={mobileTab === 'map'}
        >
          <Map size={16} />
          <span>지도 탐색</span>
        </button>
        <button
          type="button"
          className={`mobile-tab-btn ${mobileTab === 'list' ? 'active' : ''}`}
          onClick={() => setMobileTab('list')}
          role="tab"
          aria-selected={mobileTab === 'list'}
        >
          <List size={16} />
          <span>업소 목록 ({filteredAndSortedPlaces.length})</span>
        </button>
      </div>

      {/* 메인 본문: 왼쪽 지도(약 55%), 오른쪽 목록(약 45%) */}
      <main className="app-main-content">
        {/* 왼쪽 55% 지도 영역 */}
        <section
          className={`main-map-section ${mobileTab === 'map' ? 'mobile-visible' : 'mobile-hidden'}`}
          aria-label="지도 영역"
        >
          <VWorldMap
            places={filteredAndSortedPlaces}
            selectedPlace={selectedPlace}
            onSelectPlace={handleSelectPlaceFromMap}
            selectedRegions={filterState.selectedRegions}
            onToggleRegionFilter={handleToggleRegionFilter}
            userLocation={userLocation}
            onLocateUser={handleGetCurrentLocation}
            isLocating={isLocating}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
          />
        </section>

        {/* 오른쪽 45% 필터 및 업소 목록 영역 */}
        <section
          className={`main-list-section ${mobileTab === 'list' ? 'mobile-visible' : 'mobile-hidden'}`}
          aria-label="업소 목록 및 필터 영역"
        >
          {/* 상단 고정 필터 패널 */}
          <FilterPanel
            filterState={filterState}
            onFilterChange={(newPartial) => setFilterState((prev) => ({ ...prev, ...newPartial }))}
            onResetFilters={handleResetFilters}
            availableRegions={availableRegions}
            availableCategories={availableCategories}
            availableFoodTags={availableFoodTags}
            filteredCount={filteredAndSortedPlaces.length}
            totalCount={initialPlaces.length}
            hasUserLocation={Boolean(userLocation)}
            favoriteCount={favoriteIds.length}
          />

          {/* 스크롤 가능한 업소 목록 (카드보드 / 테이블) */}
          <PlaceListView
            places={filteredAndSortedPlaces}
            selectedPlace={selectedPlace}
            onSelectPlace={setSelectedPlace}
            onViewOnMap={handleViewOnMapFromCard}
            viewMode={filterState.viewMode}
            onResetFilters={handleResetFilters}
            onSortBy={(field) => setFilterState((prev) => ({ ...prev, sortBy: field }))}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
          />
        </section>
      </main>

      {/* 오늘 뭐 먹지? 룰렛 모달 */}
      <RandomRouletteModal
        places={initialPlaces}
        isOpen={isRouletteOpen}
        onClose={() => setIsRouletteOpen(false)}
        onSelectPlace={handleSelectPlaceFromMap}
        initialRegion={filterState.selectedRegions.length === 1 ? filterState.selectedRegions[0] : '전체'}
      />

      {/* 복사 알림 토스트 */}
      {toastMessage && (
        <div className="global-toast-notification" role="status" aria-live="polite">
          <CheckCircle size={18} className="toast-check-icon" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;
