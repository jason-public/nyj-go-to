export interface SubwayStation {
  id: string;
  name: string;
  line: string;
  longitude: number;
  latitude: number;
}

export const SUBWAY_STATIONS: SubwayStation[] = [
  // 8호선 (별내선)
  { id: 'st-dasan', name: '다산역', line: '8호선', longitude: 127.1584, latitude: 37.6087 },
  { id: 'st-byeollae', name: '별내역', line: '8호선·경춘선', longitude: 127.1272, latitude: 37.6433 },

  // 4호선 (진접선)
  { id: 'st-jinjeop', name: '진접역', line: '4호선', longitude: 127.2023, latitude: 37.7176 },
  { id: 'st-onam', name: '오남역', line: '4호선', longitude: 127.2064, latitude: 37.6978 },
  { id: 'st-byeollaebyul', name: '별내별가람역', line: '4호선', longitude: 127.1207, latitude: 37.6698 },

  // 경춘선
  { id: 'st-pyeongnae', name: '평내호평역', line: '경춘선', longitude: 127.2443, latitude: 37.6534 },
  { id: 'st-maseok', name: '마석역', line: '경춘선', longitude: 127.3015, latitude: 37.6533 },
  { id: 'st-cheonmasan', name: '천마산역', line: '경춘선', longitude: 127.2798, latitude: 37.6586 },
  { id: 'st-geumgok', name: '금곡역', line: '경춘선', longitude: 127.2065, latitude: 37.6366 },
  { id: 'st-sareung', name: '사릉역', line: '경춘선', longitude: 127.1728, latitude: 37.6517 },
  { id: 'st-toegyewon', name: '퇴계원역', line: '경춘선', longitude: 127.1437, latitude: 37.6488 },

  // 경의중앙선
  { id: 'st-deokso', name: '덕소역', line: '경의중앙선', longitude: 127.2084, latitude: 37.5855 },
  { id: 'st-dosim', name: '도심역', line: '경의중앙선', longitude: 127.2246, latitude: 37.5796 },
  { id: 'st-paldang', name: '팔당역', line: '경의중앙선', longitude: 127.2474, latitude: 37.5759 },
  { id: 'st-ungilsan', name: '운길산역', line: '경의중앙선', longitude: 127.3101, latitude: 37.5546 },
];
