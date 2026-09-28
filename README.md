# Our-office

끄적끄적문구 사무실 — https://han8877.github.io/Our-office

Copyright (c) 2026 han8877. All rights reserved.
코드·캐릭터·그림·글을 포함한 모든 구성 요소의 무단 복제·수정·재배포·상업적 이용을 금지합니다.
자세한 내용은 [LICENSE](LICENSE)를 참고하세요.

## 파일 구성

| 파일 | 내용 |
|---|---|
| `index.html` | 화면 뼈대 (메뉴·창·옛 SVG 층 그림) |
| `assets/office.css` | 화면 스타일 |
| `assets/office-main.js` | 게임 본체: 설정·직원 일과·메신저·일지·사물함·결재·음악·효과음·엘리베이터·백업 |
| `assets/office-pixel.js` | 픽셀 화면 연결: 층별 캐릭터 움직임·1층 판매샵·카페·식당·옥상·5층 연구소·그리기·누르기 |
| `assets/pixoffice.js` | 층별 지도와 모든 픽셀 그림 (가구·캐릭터·반찬·메모 보드 등) |
| `assets/pixcity.js` | 옥상 하늘과 서울 풍경 |
| `assets/shop.js` | 온라인샵 |
| `tests/` | 브라우저로 돌리는 확인 스크립트 ([tests/README.md](tests/README.md)) |

`assets/` 파일을 고치면 `index.html` 안의 `?v=` 꼬리표를 새 값으로 바꿔야 아이패드 사파리가 새 파일을 받는다.
