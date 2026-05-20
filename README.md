# be-vn-cultural-gis (backend)

## Location viewport API for map

## Swagger (OpenAPI)

Sau khi chạy server, mở tài liệu API tại:

- `http://localhost:5000/api-docs`

Use the new geo endpoint to load only markers in current map bounds:

```bash
curl -X POST "http://localhost:3000/api/v1/location/geo" \
	-H "Content-Type: application/json" \
	-d '{"bbox":"106.60,10.72,106.80,10.85","limit":1000}'
```

- `bbox` (required): `minLng,minLat,maxLng,maxLat`
- `limit` (optional): positive integer
- `place_id` (optional): positive integer
- `district_id` (optional): positive integer
