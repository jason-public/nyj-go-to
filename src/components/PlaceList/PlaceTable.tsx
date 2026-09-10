import { Place } from '../../types/place';
import { Compass, ExternalLink, Heart } from 'lucide-react';
import './PlaceTable.css';

interface PlaceTableProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelect: (place: Place) => void;
  onViewOnMap: (place: Place) => void;
  onSortBy: (field: 'name' | 'region') => void;
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
}

export const PlaceTable: React.FC<PlaceTableProps> = ({
  places,
  selectedPlace,
  onSelect,
  onViewOnMap,
  onSortBy,
  favoriteIds = [],
  onToggleFavorite,
}) => {
  return (
    <div className="place-table-wrapper" role="region" aria-label="업소 목록 테이블">
      <table className="place-table">
        <thead>
          <tr>
            <th className="th-fav">찜</th>
            <th className="th-name" onClick={() => onSortBy('name')} title="상호명 정렬">
              <span>상호명</span>
              <span className="sort-hint">↕</span>
            </th>
            <th className="th-region" onClick={() => onSortBy('region')} title="지역 정렬">
              <span>읍면동</span>
              <span className="sort-hint">↕</span>
            </th>
            <th className="th-cat">업종</th>
            <th className="th-tags">음식 종류</th>
            <th className="th-address">도로명 주소</th>
            <th className="th-note">비고</th>
            <th className="th-actions">지도/링크</th>
          </tr>
        </thead>
        <tbody>
          {places.map((place) => {
            const isSelected = selectedPlace?.id === place.id;
            const isFavorite = favoriteIds.includes(place.id);
            const isGeocoded =
              place.longitude !== null &&
              place.latitude !== null &&
              place.geocodeStatus === '정상';

            const naverMapUrl = `https://map.naver.com/v5/search/${encodeURIComponent(
              `${place.name} 남양주`
            )}`;

            const kakaoMapUrl = `https://map.kakao.com/link/search/${encodeURIComponent(
              `${place.name} 남양주`
            )}`;

            return (
              <tr
                key={place.id}
                id={`table-row-${place.id}`}
                className={`table-row ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelect(place)}
                tabIndex={0}
              >
                <td className="td-fav">
                  {onToggleFavorite && (
                    <button
                      type="button"
                      className={`table-fav-btn ${isFavorite ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(place.id);
                      }}
                      title={isFavorite ? '찜 해제' : '찜하기'}
                      aria-label="찜하기"
                    >
                      <Heart
                        size={15}
                        fill={isFavorite ? '#E76F51' : 'none'}
                        color={isFavorite ? '#E76F51' : 'currentColor'}
                      />
                    </button>
                  )}
                </td>
                <td className="td-name">
                  <strong>{place.name}</strong>
                  {!isGeocoded && <span className="unverified-tag">위치확인중</span>}
                </td>
                <td className="td-region">
                  <span className="badge badge-region">{place.sourceRegion}</span>
                </td>
                <td className="td-cat">
                  <span className="cat-text">{place.businessCategory}</span>
                </td>
                <td className="td-tags">
                  <div className="table-tags-group">
                    {place.foodTags && place.foodTags.length > 0 && place.foodTags[0] !== '미분류' ? (
                      place.foodTags.map((t) => (
                        <span key={t} className="badge badge-tag">
                          #{t}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </div>
                </td>
                <td className="td-address">{place.address}</td>
                <td className="td-note">
                  {place.note ? <span className="note-pill">{place.note}</span> : '-'}
                </td>
                <td className="td-actions">
                  <div className="action-buttons-cell">
                    <button
                      type="button"
                      className="table-action-btn view-map"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewOnMap(place);
                      }}
                      disabled={!isGeocoded}
                      title="지도에서 보기"
                    >
                      <Compass size={13} />
                      <span>지도</span>
                    </button>
                    <a
                      href={naverMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="table-action-btn naver"
                      onClick={(e) => e.stopPropagation()}
                      title="네이버 지도 열기"
                    >
                      <span>네이버</span>
                      <ExternalLink size={10} />
                    </a>
                    <a
                      href={kakaoMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="table-action-btn kakao"
                      onClick={(e) => e.stopPropagation()}
                      title="카카오맵 열기"
                    >
                      <span>카카오</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
