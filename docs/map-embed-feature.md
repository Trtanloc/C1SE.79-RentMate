# Map Embed Feature (Frontend)

## Overview
- Adds Google Maps preview on property detail and lets landlord input a map embed link in dashboard.
- Works with either a proper Google Maps embed URL or an iframe pasted by the user (we extract `src`).
- Optional: uses `VITE_GOOGLE_MAPS_API_KEY` to render via Google Maps Embed API when no embed link is provided.

## Data Flow
1) Dashboard form field `mapEmbedUrl`  
   - File: `rentmate-frontend/src/pages/Dashboard.jsx`  
   - Helper `normalizeMapUrl`:
     - If user pastes a full `<iframe ... src="...">`, it extracts the `src`.
     - If user pastes a URL, it keeps it if it’s a valid URL.
     - Otherwise returns empty.
   - On submit, if normalized URL exists, it is appended to FormData as `mapEmbedUrl`.

2) Stored backend-side via DTO/entity  
   - DTO: `CreatePropertyDto`/`UpdatePropertyDto` already accept `mapEmbedUrl` (optional, string, max 500).
   - Entity: `Property.mapEmbedUrl` (nullable, length 500).

3) Render on Property Detail  
   - File: `rentmate-frontend/src/pages/PropertyDetail.jsx`
   - `mapSrc` logic:
     - If `mapEmbedUrl` contains `maps/embed`, use it directly (best for pb links).
     - Else if `VITE_GOOGLE_MAPS_API_KEY` is set, use Embed API:
       `https://www.google.com/maps/embed/v1/place?key=KEY&q=encodeURIComponent(property.address)`
     - Else fallback to legacy embed search:
       `https://maps.google.com/maps?q=encodeURIComponent(property.address)&output=embed`
   - Only renders the map block if `property.mapEmbedUrl` is present (any non-empty string).
   - “Xem chi tiết địa chỉ” button links to `property.mapEmbedUrl` in a new tab.

## Env / Config
- Frontend `.env`:  
  - `VITE_API_BASE_URL=http://localhost:3000/api`  
  - `VITE_GOOGLE_MAPS_API_KEY=<your_key>` (optional but recommended for reliable embeds)
- Backend `.env`: `GOOGLE_MAPS_API_KEY` currently unused for this feature.

## Usage Guide (Landlord)
1) Lấy link nhúng:
   - Cách 1: Trên Google Maps → “Chia sẻ” → “Nhúng bản đồ” → copy URL trong `src="https://www.google.com/maps/embed?pb=..."`.
   - Cách 2: Dán cả thẻ `<iframe ...>` vào ô Map; hệ thống sẽ tự tách `src`.
2) Dán vào trường “Map / Embed URL” trong Dashboard, lưu property.
3) Xem chi tiết property để thấy iframe map; nút “Xem chi tiết địa chỉ” mở đúng link đã dán.

## Troubleshooting
- Map trắng / “từ chối kết nối”: dùng link embed `.../maps/embed?pb=...` hoặc bật `VITE_GOOGLE_MAPS_API_KEY` để dùng Embed API.
- Link share rút gọn (`maps.app.goo.gl/...`): không nhúng trực tiếp; map vẫn hiện nhờ Embed API nếu có key và địa chỉ property hợp lệ.
- Nếu không thấy map: đảm bảo `mapEmbedUrl` không rỗng (bất kỳ chuỗi nào), và reload frontend sau khi cập nhật `.env`.

## Files Touched
- `rentmate-frontend/src/pages/Dashboard.jsx` (input normalize & submit)
- `rentmate-frontend/src/pages/PropertyDetail.jsx` (map render logic & button label)
- `rentmate-frontend/.env` (add `VITE_GOOGLE_MAPS_API_KEY`)
