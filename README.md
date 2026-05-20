# be-vn-cultural-gis (backend)

## Quickstart

### Prerequisites

- Node.js 18+ (khuyến nghị)
- MySQL (local hoặc Docker)
- (Tuỳ chọn) Docker Desktop nếu muốn chạy Elasticsearch bằng Docker

### Install

```bash
npm install
```

### Configure env

Tạo file `.env` ở root dự án (cùng cấp `package.json`). Bạn có thể copy từ `.env.example`:

```bash
copy .env.example .env
```

Chỉnh lại các biến DB cho đúng môi trường của bạn.

### Run server

```bash
npm run dev
```

Mặc định server chạy tại `http://localhost:5000` (hoặc theo `PORT` trong `.env`).

## Swagger (OpenAPI)

Sau khi chạy server, mở tài liệu API tại:

- `http://localhost:<PORT>/api-docs`

Use the new geo endpoint to load only markers in current map bounds:

```bash
curl -X POST "http://localhost:5000/api/v1/location/geo" \
	-H "Content-Type: application/json" \
	-d '{"bbox":"106.60,10.72,106.80,10.85","limit":1000}'
```

- `bbox` (required): `minLng,minLat,maxLng,maxLat`
- `limit` (optional): positive integer
- `place_id` (optional): positive integer
- `district_id` (optional): positive integer

## Elasticsearch (Docker)

Repo này chưa tích hợp Elasticsearch vào API hiện tại, nhưng bạn có thể bật Elasticsearch sẵn để dùng cho tính năng search sau này.

Mặc định trong cấu hình Docker của repo này, **Elasticsearch/Kibana đang tắt security** để dễ chạy local, nên **không cần username/password**.

### Start Elasticsearch + Kibana

```bash
docker compose -f docker-compose.elasticsearch.yml up -d
```

Ghi chú:

- Lệnh `docker compose up -d` (không có `-f`) chỉ chạy được khi repo có file mặc định `docker-compose.yml`. Repo này đang dùng file riêng `docker-compose.elasticsearch.yml`, nên bạn cần thêm `-f` như trên.

Elasticsearch sẽ lắng nghe tại:

- `http://localhost:9200`

Kibana (UI) tại:

- `http://localhost:5601`

### Troubleshooting (Windows)

Nếu bạn gặp lỗi kiểu:

`failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine ... The system cannot find the file specified`

thì thường là Docker daemon/Docker Desktop chưa chạy.

- Mở **Docker Desktop** và chờ trạng thái **Engine running**
- Kiểm tra lại bằng: `docker info`
- Nếu vẫn lỗi: thử **Restart Docker Desktop** hoặc reboot máy

Sau khi `docker info` chạy OK, chạy lại:

```bash
docker compose -f docker-compose.elasticsearch.yml up -d
```

### Có cần password không?

- Không cần (theo mặc định hiện tại), vì trong [docker-compose.elasticsearch.yml](docker-compose.elasticsearch.yml) đã đặt `xpack.security.enabled=false` cho Elasticsearch và tắt security ở Kibana.
- Nếu bạn muốn bật password (gần với production hơn) thì cần **bật lại security** và cấu hình user/password (ví dụ `ELASTIC_PASSWORD`) cho Elasticsearch, đồng thời cấu hình Kibana dùng đúng credentials. (Nếu bạn muốn mình set sẵn một file compose “secure” riêng, nói mình sẽ thêm.)

### Verify (Windows / PowerShell)

```powershell
Invoke-RestMethod http://localhost:9200
```

Hoặc dùng `curl`:

```bash
curl http://localhost:9200
```

### Quick demo: create index + search

Tạo index thử nghiệm và insert 1 document:

```bash
curl -X PUT "http://localhost:9200/places" -H "Content-Type: application/json" -d "{\"mappings\":{\"properties\":{\"name\":{\"type\":\"text\"},\"category\":{\"type\":\"keyword\"}}}}"
curl -X POST "http://localhost:9200/places/_doc/1?refresh=true" -H "Content-Type: application/json" -d "{\"name\":\"Chợ Bến Thành\",\"category\":\"heritage\"}"
curl -X GET "http://localhost:9200/places/_search" -H "Content-Type: application/json" -d "{\"query\":{\"match\":{\"name\":\"Bến Thành\"}}}"
```

### Env var (optional)

Nếu bạn cần cấu hình URL Elasticsearch cho app (tương lai), dùng biến:

- `ELASTICSEARCH_URL` (default: `http://localhost:9200`)
