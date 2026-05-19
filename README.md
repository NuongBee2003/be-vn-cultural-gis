# be-vn-cultural-gis (backend)

## Location viewport API for map

Use the new geo endpoint to load only markers in current map bounds:

```bash
curl "http://localhost:3000/api/v1/location/geo?bbox=106.60,10.72,106.80,10.85&limit=1000"
```

- `bbox` (required): `minLng,minLat,maxLng,maxLat`
- `limit` (optional): positive integer
- `status` (optional): `pending|accepted|rejected` (default: `accepted`)
- `place_id` (optional): positive integer
- `province_id` (optional): positive integer
