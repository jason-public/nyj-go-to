import React from 'react';
import { Place } from '../../types/place';
import { MapPin, Utensils, Coffee, ShoppingBag, ExternalLink, ArrowRight, X, Heart } from 'lucide-react';
import './MapPopover.css';

interface MapPopoverProps {
  place: Place;
  onClose: () => void;
  onSelectPlace: (place: Place) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (placeId: string) => void;
}

export const MapPopover: React.FC<MapPopoverProps> = ({
  place,
  onClose,
  onSelectPlace,
  onMouseEnter,
  onMouseLeave,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const getCategoryIcon = () => {
    switch (place.businessCategory) {
      case '음식점':
        return <Utensils size={14} />;
      case '카페·베이커리·디저트':
        return <Coffee size={14} />;
      default:
        return <ShoppingBag size={14} />;
    }
  };

  const getCategoryClass = () => {
    switch (place.businessCategory) {
      case '음식점':
        return 'badge-restaurant';
      case '카페·베이커리·디저트':
        return 'badge-cafe';
      default:
        return 'badge-other';
    }
  };

  const naverMapUrl = `https://map.naver.com/v5/search/${encodeURIComponent(
    `${place.name} ${place.sourceRegion}`
  )}`;

  const kakaoMapUrl = `https://map.kakao.com/link/search/${encodeURIComponent(
    `${place.name} ${place.sourceRegion}`
  )}`;

  return (
    <div
      className="map-popover-card"
      role="dialog"
      aria-label={`${place.name} 미리보기`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="popover-header">
        <div className="popover-title-row">
          <h4 className="popover-name">{place.name}</h4>
          <div className="popover-header-actions">
            {onToggleFavorite && (
              <button
                type="button"
                className={`popover-fav-btn ${isFavorite ? 'active' : ''}`}
                onClick={() => onToggleFavorite(place.id)}
                title={isFavorite ? '찜 해제' : '찜하기'}
                aria-label="즐겨찾기 찜하기"
              >
                <Heart size={16} fill={isFavorite ? '#E76F51' : 'none'} color={isFavorite ? '#E76F51' : 'currentColor'} />
              </button>
            )}
            <button
              type="button"
              className="popover-close-btn"
              onClick={onClose}
              aria-label="미리보기 닫기"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="popover-badges">
          <span className="badge badge-region">{place.sourceRegion}</span>
          <span className={`badge ${getCategoryClass()}`}>
            {getCategoryIcon()}
            <span>{place.businessCategory}</span>
          </span>
        </div>
      </div>

      <div className="popover-body">
        {place.foodTags && place.foodTags.length > 0 && place.foodTags[0] !== '미분류' && (
          <div className="popover-tags">
            {place.foodTags.map((tag) => (
              <span key={tag} className="badge badge-tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="popover-address">
          <MapPin size={13} className="address-pin-icon" />
          <span>{place.address}</span>
        </div>

        {place.note && <div className="popover-note">"{place.note}"</div>}
      </div>

      <div className="popover-footer">
        <div className="popover-links-group">
          <a
            href={naverMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="popover-naver-btn"
            title="네이버 지도에서 보기"
          >
            <span>네이버</span>
            <ExternalLink size={11} />
          </a>

          <a
            href={kakaoMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="popover-kakao-btn"
            title="카카오맵에서 보기"
          >
            <span>카카오</span>
            <ExternalLink size={11} />
          </a>
        </div>

        <button
          type="button"
          className="popover-view-card-btn"
          onClick={() => onSelectPlace(place)}
        >
          <span>카드 보기</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
