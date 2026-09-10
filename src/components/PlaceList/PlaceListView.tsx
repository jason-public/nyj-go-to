import React from 'react';
import { Place, FilterState } from '../../types/place';
import { PlaceCard } from './PlaceCard';
import { PlaceTable } from './PlaceTable';
import { SearchX, RotateCcw } from 'lucide-react';
import './PlaceListView.css';

interface PlaceListViewProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  onViewOnMap: (place: Place) => void;
  viewMode: 'card' | 'table';
  onResetFilters: () => void;
  onSortBy: (field: 'name' | 'region') => void;
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
}

export const PlaceListView: React.FC<PlaceListViewProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
  onViewOnMap,
  viewMode,
  onResetFilters,
  onSortBy,
  favoriteIds = [],
  onToggleFavorite,
}) => {
  if (places.length === 0) {
    return (
      <div className="empty-results-container" role="status">
        <div className="empty-icon-box">
          <SearchX size={36} />
        </div>
        <h3 className="empty-title">일치하는 맛집이 없습니다</h3>
        <p className="empty-desc">
          선택하신 조건에 해당하는 업소가 없습니다. 검색어를 수정하거나 필터를 초기화해 보세요.
        </p>
        <button type="button" className="empty-reset-btn" onClick={onResetFilters}>
          <RotateCcw size={15} />
          <span>전체 필터 초기화</span>
        </button>
      </div>
    );
  }

  return (
    <div className="place-list-view-content" id="place-list-container">
      {viewMode === 'card' ? (
        <div className="place-card-grid">
          {places.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              isSelected={selectedPlace?.id === place.id}
              onSelect={onSelectPlace}
              onViewOnMap={onViewOnMap}
              isFavorite={favoriteIds.includes(place.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <PlaceTable
          places={places}
          selectedPlace={selectedPlace}
          onSelect={onSelectPlace}
          onViewOnMap={onViewOnMap}
          onSortBy={onSortBy}
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
        />
      )}
    </div>
  );
};
