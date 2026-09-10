import React, { useEffect, useRef, useState, useCallback } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Icon, Text, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import Overlay from 'ol/Overlay';
import Cluster from 'ol/source/Cluster';
import { boundingExtent } from 'ol/extent';
import { defaults as defaultInteractions, MouseWheelZoom } from 'ol/interaction';

import { Place, UserLocation } from '../../types/place';
import { MapControls } from './MapControls';
import { MapPopover } from './MapPopover';
import boundaryGeoJson from '../../assets/namyangju_boundary.json';
import './VWorldMap.css';

interface VWorldMapProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  selectedRegions: string[];
  onToggleRegionFilter: (regionName: string) => void;
  userLocation: UserLocation | null;
  onLocateUser: () => void;
  isLocating: boolean;
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
}

// 남양주시 대략적인 중심 좌표 (경도: 127.216, 위도: 37.636)
const NAMYANGJU_CENTER = fromLonLat([127.2165, 37.636]);
const DEFAULT_ZOOM = 11.2;

export const VWorldMap: React.FC<VWorldMapProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
  selectedRegions,
  onToggleRegionFilter,
  userLocation,
  onLocateUser,
  isLocating,
  favoriteIds = [],
  onToggleFavorite,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const popoverOverlayRef = useRef<HTMLDivElement>(null);
  const centerPinRef = useRef<HTMLDivElement>(null);

  const mapRef = useRef<Map | null>(null);
  const clusterLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const boundaryLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const userLocationLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const overlayRef = useRef<Overlay | null>(null);

  const [activePopoverPlace, setActivePopoverPlace] = useState<Place | null>(null);
  const [showCenterMarker, setShowCenterMarker] = useState(false);
  const [centerAddressText, setCenterAddressText] = useState<string>('남양주시 중심');
  const [isVWorldFailed, setIsVWorldFailed] = useState(false);
  const [clusterPlacesMenu, setClusterPlacesMenu] = useState<Place[] | null>(null);
  const [mapType, setMapType] = useState<'base' | 'satellite'>('base');

  const baseLayerRef = useRef<TileLayer<XYZ | OSM> | null>(null);
  const satelliteLayerRef = useRef<TileLayer<XYZ> | null>(null);
  const hybridLayerRef = useRef<TileLayer<XYZ> | null>(null);

  // 마커 호버 닫힘 지연 타이머 (마커에서 팝오버로 마우스 이동 시 닫힘 방지)
  const closeTimerRef = useRef<number | null>(null);

  const vworldKey = import.meta.env.VITE_VWORLD_API_KEY || '7209B6A2-8394-467E-AF8C-75E0279312C2';

  // 1. 지도 초기화
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // VWorld 일반 타일 레이어 (오류 시 OSM으로 대체)
    const baseSource = vworldKey
      ? new XYZ({
          url: `https://api.vworld.kr/req/wmts/1.0.0/${vworldKey}/Base/{z}/{y}/{x}.png`,
          crossOrigin: 'anonymous',
        })
      : new OSM();

    baseSource.on('tileloaderror', () => {
      setIsVWorldFailed(true);
    });

    const baseLayer = new TileLayer({
      source: baseSource,
      visible: true,
    });
    baseLayerRef.current = baseLayer;

    // VWorld 위성(항공사진) 레이어
    const satelliteSource = new XYZ({
      url: `https://api.vworld.kr/req/wmts/1.0.0/${vworldKey}/Satellite/{z}/{y}/{x}.jpeg`,
      crossOrigin: 'anonymous',
    });
    const satelliteLayer = new TileLayer({
      source: satelliteSource,
      visible: false,
    });
    satelliteLayerRef.current = satelliteLayer;

    // VWorld 하이브리드(지명/도로 라벨) 레이어
    const hybridSource = new XYZ({
      url: `https://api.vworld.kr/req/wmts/1.0.0/${vworldKey}/Hybrid/{z}/{y}/{x}.png`,
      crossOrigin: 'anonymous',
    });
    const hybridLayer = new TileLayer({
      source: hybridSource,
      visible: false,
    });
    hybridLayerRef.current = hybridLayer;

    // 2. 남양주시 읍면동 행정경계 레이어
    const boundarySource = new VectorSource({
      features: new GeoJSON().readFeatures(boundaryGeoJson, {
        featureProjection: 'EPSG:3857',
      }),
    });

    const boundaryLayer = new VectorLayer({
      source: boundarySource,
      style: (feature) => {
        const props = feature.getProperties();
        const rawName = props.adm_nm || props.emd_kor_nm || '';
        // "경기도 남양주시 와부읍" -> "와부읍"
        const shortName = rawName.replace(/^경기도\s+남양주시\s+/, '').trim();
        const isSelected = selectedRegions.includes(shortName);

        return new Style({
          stroke: new Stroke({
            color: isSelected ? '#E76F51' : '#2D6A4F',
            width: isSelected ? 2.5 : 1.5,
          }),
          fill: new Fill({
            color: isSelected ? 'rgba(231, 111, 81, 0.12)' : 'rgba(45, 106, 79, 0.05)',
          }),
          text: new Text({
            text: shortName,
            font: 'bold 12px Pretendard, sans-serif',
            fill: new Fill({
              color: isSelected ? '#C0392B' : '#1B4332',
            }),
            stroke: new Stroke({
              color: '#FFFFFF',
              width: 3,
            }),
          }),
        });
      },
    });
    boundaryLayerRef.current = boundaryLayer;

    // 3. 업소 마커 및 클러스터 소스
    const markerSource = new VectorSource();
    const clusterSource = new Cluster({
      distance: 35,
      source: markerSource,
    });

    const clusterLayer = new VectorLayer({
      source: clusterSource,
      style: (feature) => {
        const clusterFeatures = feature.get('features') as Feature[];
        const size = clusterFeatures.length;

        if (size > 1) {
          // 클러스터 스타일
          return new Style({
            image: new CircleStyle({
              radius: Math.min(16 + size * 1.5, 28),
              fill: new Fill({
                color: '#2D6A4F',
              }),
              stroke: new Stroke({
                color: '#FFFFFF',
                width: 2.5,
              }),
            }),
            text: new Text({
              text: size.toString(),
              fill: new Fill({
                color: '#FFFFFF',
              }),
              font: 'bold 13px Pretendard, sans-serif',
            }),
          });
        }

        // 단일 마커 스타일
        const singlePlace = clusterFeatures[0]?.get('place') as Place;
        if (!singlePlace) return undefined;

        let color = '#1B4332'; // 음식점 기본
        if (singlePlace.businessCategory === '카페·베이커리·디저트') {
          color = '#B07D62';
        } else if (singlePlace.businessCategory === '기타 먹거리') {
          color = '#0077B6';
        }

        const isSelected = selectedPlace?.id === singlePlace.id;

        return new Style({
          image: new CircleStyle({
            radius: isSelected ? 10 : 7,
            fill: new Fill({
              color: isSelected ? '#E76F51' : color,
            }),
            stroke: new Stroke({
              color: '#FFFFFF',
              width: isSelected ? 3 : 2,
            }),
          }),
        });
      },
    });
    clusterLayerRef.current = clusterLayer;

    // 4. 사용자 내 위치 레이어
    const userLocationSource = new VectorSource();
    const userLocationLayer = new VectorLayer({
      source: userLocationSource,
      style: new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: '#2563EB' }),
          stroke: new Stroke({ color: '#FFFFFF', width: 3 }),
        }),
      }),
    });
    userLocationLayerRef.current = userLocationLayer;

    // 5. 팝오버 오버레이 생성
    const overlay = new Overlay({
      element: popoverOverlayRef.current || undefined,
      autoPan: {
        animation: {
          duration: 250,
        },
      },
      positioning: 'bottom-center',
      stopEvent: true,
      offset: [0, -14],
    });
    overlayRef.current = overlay;

    // 6. Map 인스턴스 생성
    const map = new Map({
      target: mapContainerRef.current,
      layers: [baseLayer, satelliteLayer, hybridLayer, boundaryLayer, clusterLayer, userLocationLayer],
      view: new View({
        center: NAMYANGJU_CENTER,
        zoom: DEFAULT_ZOOM,
        minZoom: 9.5,
        maxZoom: 19,
      }),
      overlays: [overlay],
      controls: [], // 커스텀 컨트롤 사용
      interactions: defaultInteractions({
        mouseWheelZoom: true,
        doubleClickZoom: true,
        dragPan: true,
        pinchZoom: true,
      }),
    });

    mapRef.current = map;

    // 초기 바운드 맞춤 (남양주시 경계 전체가 보이도록)
    boundarySource.once('change', () => {
      const extent = boundarySource.getExtent();
      if (extent && !extent.some(isNaN)) {
        map.getView().fit(extent, {
          padding: [30, 30, 30, 30],
          duration: 500,
        });
      }
    });

    // 지도 이동 완료(moveend) 시 중심 좌표 역계산
    map.on('moveend', () => {
      const center = map.getView().getCenter();
      if (center) {
        const lonLat = toLonLat(center);
        setCenterAddressText(`중심 좌표: ${lonLat[1].toFixed(4)}N, ${lonLat[0].toFixed(4)}E`);
      }
    });

    // 마커 및 경계 클릭 이벤트
    map.on('click', (event) => {
      // 1. 클러스터 및 마커 클릭 검사
      const feature = map.forEachFeatureAtPixel(event.pixel, (feat, layer) => {
        if (layer === clusterLayer) return feat;
        return null;
      });

      if (feature) {
        const clusterFeatures = feature.get('features') as Feature[];
        if (clusterFeatures && clusterFeatures.length > 1) {
          // 클러스터 클릭: 여러 개면 줌 확대 또는 같은 좌표면 목록 표시
          const extent = boundingExtent(
            clusterFeatures.map((f) => (f.getGeometry() as Point).getCoordinates())
          );
          // 모든 점이 동일한 좌표인 경우 목록 메뉴 팝업
          const firstCoord = (clusterFeatures[0].getGeometry() as Point).getCoordinates();
          const allSameCoord = clusterFeatures.every((f) => {
            const c = (f.getGeometry() as Point).getCoordinates();
            return Math.abs(c[0] - firstCoord[0]) < 1 && Math.abs(c[1] - firstCoord[1]) < 1;
          });

          if (allSameCoord) {
            setClusterPlacesMenu(clusterFeatures.map((f) => f.get('place')));
          } else {
            map.getView().fit(extent, {
              duration: 500,
              padding: [60, 60, 60, 60],
              maxZoom: map.getView().getZoom()! + 2,
            });
          }
          return;
        } else if (clusterFeatures && clusterFeatures.length === 1) {
          const place = clusterFeatures[0].get('place') as Place;
          if (place) {
            const coord = (clusterFeatures[0].getGeometry() as Point).getCoordinates();
            overlay.setPosition(coord);
            setActivePopoverPlace(place);
            setClusterPlacesMenu(null);
          }
          return;
        }
      }

      // 2. 경계 폴리곤 클릭 검사 (읍면동 필터 토글 및 확대)
      const boundaryFeature = map.forEachFeatureAtPixel(event.pixel, (feat, layer) => {
        if (layer === boundaryLayer) return feat;
        return null;
      });

      if (boundaryFeature) {
        const geom = boundaryFeature.getGeometry();
        if (geom) {
          map.getView().fit(geom.getExtent(), {
            duration: 600,
            padding: [40, 40, 40, 40],
          });
        }
        const props = boundaryFeature.getProperties();
        const rawName = props.adm_nm || props.emd_kor_nm || '';
        const shortName = rawName.replace(/^경기도\s+남양주시\s+/, '').trim();
        if (shortName) {
          onToggleRegionFilter(shortName);
        }
        return;
      }

      // 빈 영역 클릭 시 팝오버 닫기
      overlay.setPosition(undefined);
      setActivePopoverPlace(null);
      setClusterPlacesMenu(null);
    });

    // 마커 호버 이벤트
    map.on('pointermove', (event) => {
      if (event.dragging) return;
      const pixel = map.getEventPixel(event.originalEvent);
      const hit = map.hasFeatureAtPixel(pixel, {
        layerFilter: (l) => l === clusterLayer || l === boundaryLayer,
      });
      map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    return () => {
      map.setTarget(undefined);
    };
  }, []);

  // 1-1. mapType 변경 시 레이어 표시/숨김 토글
  useEffect(() => {
    if (!baseLayerRef.current || !satelliteLayerRef.current || !hybridLayerRef.current) return;
    if (mapType === 'satellite') {
      baseLayerRef.current.setVisible(false);
      satelliteLayerRef.current.setVisible(true);
      hybridLayerRef.current.setVisible(true);
    } else {
      baseLayerRef.current.setVisible(true);
      satelliteLayerRef.current.setVisible(false);
      hybridLayerRef.current.setVisible(false);
    }
  }, [mapType]);

  // 2. places 변경 시 마커 피처 갱신
  useEffect(() => {
    if (!clusterLayerRef.current) return;
    const clusterSource = clusterLayerRef.current.getSource() as Cluster;
    if (!clusterSource) return;
    const markerSource = clusterSource.getSource() as VectorSource;
    if (!markerSource) return;

    markerSource.clear();

    const validPlaces = places.filter(
      (p) => p.longitude !== null && p.latitude !== null && p.geocodeStatus === '정상'
    );

    const features = validPlaces.map((place) => {
      const coord = fromLonLat([place.longitude!, place.latitude!]);
      const feat = new Feature({
        geometry: new Point(coord),
        place: place,
      });
      return feat;
    });

    markerSource.addFeatures(features);
  }, [places]);

  // 3. selectedRegions 변경 시 경계 스타일 갱신
  useEffect(() => {
    if (!boundaryLayerRef.current) return;
    boundaryLayerRef.current.changed();
  }, [selectedRegions]);

  // 4. selectedPlace 변경 시 (외부 카드 클릭 등으로 이동)
  useEffect(() => {
    if (!selectedPlace || !mapRef.current || !overlayRef.current) return;
    if (selectedPlace.longitude === null || selectedPlace.latitude === null) return;

    const coord = fromLonLat([selectedPlace.longitude, selectedPlace.latitude]);
    mapRef.current.getView().animate({
      center: coord,
      zoom: Math.max(mapRef.current.getView().getZoom() || 14, 15),
      duration: 600,
    });

    overlayRef.current.setPosition(coord);
    setActivePopoverPlace(selectedPlace);
    setClusterPlacesMenu(null);
  }, [selectedPlace]);

  // 5. 사용자 위치 마커 갱신
  useEffect(() => {
    if (!userLocationLayerRef.current) return;
    const source = userLocationLayerRef.current.getSource();
    if (!source) return;

    source.clear();
    if (userLocation) {
      const coord = fromLonLat([userLocation.longitude, userLocation.latitude]);
      const feat = new Feature({
        geometry: new Point(coord),
      });
      source.addFeature(feat);

      if (mapRef.current) {
        mapRef.current.getView().animate({
          center: coord,
          zoom: 14.5,
          duration: 700,
        });
      }
    }
  }, [userLocation]);

  // 지도 컨트롤 핸들러
  const handleZoomIn = () => {
    if (!mapRef.current) return;
    const view = mapRef.current.getView();
    view.animate({ zoom: (view.getZoom() || 12) + 1, duration: 250 });
  };

  const handleZoomOut = () => {
    if (!mapRef.current) return;
    const view = mapRef.current.getView();
    view.animate({ zoom: (view.getZoom() || 12) - 1, duration: 250 });
  };

  const handleResetView = () => {
    if (!mapRef.current || !boundaryLayerRef.current) return;
    const source = boundaryLayerRef.current.getSource();
    if (source) {
      const extent = source.getExtent();
      if (extent && !extent.some(isNaN)) {
        mapRef.current.getView().fit(extent, {
          padding: [40, 40, 40, 40],
          duration: 600,
        });
      }
    }
  };

  const handleFitSelectedRegion = () => {
    if (!mapRef.current || !boundaryLayerRef.current || selectedRegions.length === 0) return;
    const source = boundaryLayerRef.current.getSource();
    if (!source) return;

    const selectedFeatures = source.getFeatures().filter((f) => {
      const rawName = f.get('adm_nm') || f.get('emd_kor_nm') || '';
      const shortName = rawName.replace(/^경기도\s+남양주시\s+/, '').trim();
      return selectedRegions.includes(shortName);
    });

    if (selectedFeatures.length > 0) {
      const extent = boundingExtent(
        selectedFeatures.flatMap((f) => {
          const geom = f.getGeometry();
          return geom ? [geom.getExtent().slice(0, 2), geom.getExtent().slice(2, 4)] : [];
        })
      );
      mapRef.current.getView().fit(extent, {
        padding: [60, 60, 60, 60],
        duration: 600,
      });
    }
  };

  // 팝오버 닫기
  const handleClosePopover = () => {
    if (overlayRef.current) {
      overlayRef.current.setPosition(undefined);
    }
    setActivePopoverPlace(null);
  };

  // 키보드 Escape 닫기 지원
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClosePopover();
        setClusterPlacesMenu(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="map-wrapper" aria-label="남양주시 맛집 지도">
      {/* VWorld 인증키 / 도메인 에러 시 알림 배너 */}
      {isVWorldFailed && (
        <div className="vworld-warning-banner" role="alert">
          <span>
            ⚠️ VWorld 배경지도 호출이 제한되어 오픈 지도(OSM)로 표시 중입니다. (브이월드 도메인 확인
            필요)
          </span>
        </div>
      )}

      {/* 지도 메인 컨테이너 */}
      <div ref={mapContainerRef} className="map-container" tabIndex={0} />

      {/* 중심 마커 (화면 중앙 고정 십자선/핀) */}
      {showCenterMarker && (
        <div ref={centerPinRef} className="center-crosshair-pin" aria-hidden="true">
          <div className="pin-head" />
          <div className="pin-dot" />
        </div>
      )}

      {/* 지도 컨트롤 버튼 및 범례 */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onFitSelectedRegion={handleFitSelectedRegion}
        hasSelectedRegion={selectedRegions.length > 0}
        onLocateUser={onLocateUser}
        isLocating={isLocating}
        showCenterMarker={showCenterMarker}
        onToggleCenterMarker={() => setShowCenterMarker(!showCenterMarker)}
        centerAddress={centerAddressText}
        mapType={mapType}
        onToggleMapType={() => setMapType((prev) => (prev === 'base' ? 'satellite' : 'base'))}
      />

      {/* 마커 팝오버 오버레이 (DOM) */}
      <div ref={popoverOverlayRef} className="popover-overlay-wrapper">
        {activePopoverPlace && (
          <MapPopover
            place={activePopoverPlace}
            onClose={handleClosePopover}
            onSelectPlace={(place) => {
              onSelectPlace(place);
              handleClosePopover();
            }}
            onMouseEnter={() => {
              if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
            }}
            isFavorite={favoriteIds.includes(activePopoverPlace.id)}
            onToggleFavorite={onToggleFavorite}
          />
        )}
      </div>

      {/* 동일 좌표 다중 업소 선택 모달/메뉴 */}
      {clusterPlacesMenu && clusterPlacesMenu.length > 0 && (
        <div className="cluster-menu-modal" role="dialog" aria-label="동일 위치 업소 목록">
          <div className="cluster-menu-header">
            <h5>동일 위치 업소 ({clusterPlacesMenu.length}개)</h5>
            <button
              type="button"
              className="cluster-menu-close"
              onClick={() => setClusterPlacesMenu(null)}
            >
              ×
            </button>
          </div>
          <div className="cluster-menu-list">
            {clusterPlacesMenu.map((p) => (
              <button
                key={p.id}
                type="button"
                className="cluster-menu-item"
                onClick={() => {
                  onSelectPlace(p);
                  setClusterPlacesMenu(null);
                }}
              >
                <span className="cluster-menu-name">{p.name}</span>
                <span className="badge badge-region">{p.sourceRegion}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
