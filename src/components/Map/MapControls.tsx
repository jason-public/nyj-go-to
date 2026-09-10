import React, { useState } from 'react';
import {
  Plus,
  Minus,
  Maximize2,
  Navigation,
  Crosshair,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import './MapControls.css';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFitSelectedRegion: () => void;
  hasSelectedRegion: boolean;
  onLocateUser: () => void;
  isLocating: boolean;
  showCenterMarker: boolean;
  onToggleCenterMarker: () => void;
  centerAddress?: string;
  mapType: 'base' | 'satellite';
  onToggleMapType: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView,
  onFitSelectedRegion,
  hasSelectedRegion,
  onLocateUser,
  isLocating,
  showCenterMarker,
  onToggleCenterMarker,
  centerAddress,
  mapType,
  onToggleMapType,
}) => {
  const [showLegend, setShowLegend] = useState(true);

  return (
    <div className="map-controls-container">
      {/* 지도 유형(일반/위성) 세그먼트 토글 */}
      <div className="map-type-toggle-group" role="group" aria-label="지도 배경 유형 선택">
        <button
          type="button"
          className={`map-type-btn ${mapType === 'base' ? 'active' : ''}`}
          onClick={onToggleMapType}
        >
          일반
        </button>
        <button
          type="button"
          className={`map-type-btn ${mapType === 'satellite' ? 'active' : ''}`}
          onClick={onToggleMapType}
        >
          위성
        </button>
      </div>
      {/* 상단 컨트롤 버튼 그룹 */}
      <div className="map-control-btn-group">
        <button
          type="button"
          className="map-control-btn"
          onClick={onZoomIn}
          title="지도 확대"
          aria-label="지도 확대"
        >
          <Plus size={18} />
        </button>
        <button
          type="button"
          className="map-control-btn"
          onClick={onZoomOut}
          title="지도 축소"
          aria-label="지도 축소"
        >
          <Minus size={18} />
        </button>
        <div className="btn-divider" />
        <button
          type="button"
          className="map-control-btn"
          onClick={onResetView}
          title="남양주시 전체 보기"
          aria-label="남양주시 전체 보기"
        >
          <Maximize2 size={16} />
        </button>
        {hasSelectedRegion && (
          <button
            type="button"
            className="map-control-btn highlight"
            onClick={onFitSelectedRegion}
            title="선택된 지역 영역에 맞추기"
            aria-label="선택 지역 보기"
          >
            <span className="btn-badge-text">지역</span>
          </button>
        )}
        <button
          type="button"
          className={`map-control-btn ${showCenterMarker ? 'active' : ''}`}
          onClick={onToggleCenterMarker}
          title="지도 중심 마커 표시/해제"
          aria-label="중심 마커 토글"
        >
          <Crosshair size={16} />
        </button>
        <button
          type="button"
          className="map-control-btn"
          onClick={onLocateUser}
          disabled={isLocating}
          title="내 현재 위치로 지도 이동"
          aria-label="내 위치로 이동"
        >
          <Navigation size={16} className={isLocating ? 'spin' : ''} />
        </button>
      </div>

      {/* 중심 주소 표시 배너 (활성화 시) */}
      {showCenterMarker && centerAddress && (
        <div className="center-address-banner" aria-live="polite">
          <Crosshair size={13} className="center-icon" />
          <span className="address-text">{centerAddress}</span>
        </div>
      )}

      {/* 하단 범례 카드 */}
      <div className="map-legend-card">
        <button
          type="button"
          className="legend-header"
          onClick={() => setShowLegend(!showLegend)}
          aria-expanded={showLegend}
        >
          <div className="legend-title-row">
            <Info size={13} />
            <span>지도 범례</span>
          </div>
          {showLegend ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {showLegend && (
          <div className="legend-body">
            <div className="legend-item">
              <span className="legend-marker marker-restaurant" />
              <span className="legend-label">음식점</span>
            </div>
            <div className="legend-item">
              <span className="legend-marker marker-cafe" />
              <span className="legend-label">카페·베이커리·디저트</span>
            </div>
            <div className="legend-item">
              <span className="legend-marker marker-other" />
              <span className="legend-label">기타 먹거리</span>
            </div>
            <div className="legend-item">
              <span className="legend-boundary-line" />
              <span className="legend-label">읍면동 행정경계 (클릭 시 확대)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
