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
docker compose up -d
```

Ghi chú:

- Repo có sẵn file mặc định `docker-compose.yml`, nên bạn có thể chạy `docker compose up -d`.
- Nếu bạn chỉ muốn chạy stack Elastic riêng bằng file khác, có thể dùng: `docker compose -f docker-compose.elasticsearch.yml up -d`

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

Hoặc dùng `curl` (PowerShell nên dùng `curl.exe` để tránh alias `Invoke-WebRequest`):

```bash
curl http://localhost:9200
```

PowerShell:

```powershell
curl.exe http://localhost:9200
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

## Logstash (Docker)

Logstash trong repo này được cấu hình sẵn để nhận log qua HTTP và đẩy vào Elasticsearch.

- HTTP input: `http://localhost:8081`
- Logstash monitoring API: `http://localhost:9600`

### Test nhanh

Gửi 1 log JSON vào Logstash:

```bash
curl -X POST "http://localhost:8081" -H "Content-Type: application/json" -d "{\"message\":\"hello from logstash\",\"level\":\"info\"}"
```

Kiểm tra log đã được index vào Elasticsearch (index pattern `logstash-*`):

```bash
curl "http://localhost:9200/logstash-*/_search?q=message:hello"
```

Trong Kibana, bạn có thể vào Discover và tạo Data View với pattern `logstash-*` để xem log.

### JDBC Input Plugin (MySQL -> Elasticsearch) mỗi 5 phút

Logstash sẽ query MySQL theo chu kỳ `*/5 * * * *` và chỉ lấy các bản ghi `places` có `updated_at > sql_last_value`.

- Tracking column: `places.updated_at`
- Logstash lưu `sql_last_value` vào `logstash/jdbc_last_run/places.yml` (đã mount volume) để lần sau chỉ kéo dữ liệu mới/cập nhật.
- Dữ liệu được upsert vào index Elasticsearch: `places` (document id = `id`).

Chạy (có build Logstash image vì cần MySQL JDBC driver):

```bash
docker compose up -d --build
```

Biến môi trường JDBC (có default trong compose; có thể override bằng `.env`):

- `JDBC_CONNECTION_STRING` (default: `jdbc:mysql://host.docker.internal:3306/vn_cultural_gis?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`)
- `JDBC_USER` (default: `root`)
- `JDBC_PASSWORD` (default: `1234`)

Kiểm tra index `places`:

```bash
curl "http://localhost:9200/places/_search?size=5"
```

PowerShell (gợi ý):

```powershell
curl.exe "http://localhost:9200/places/_count?pretty"
curl.exe -X POST "http://localhost:9200/places/_search?size=3&pretty" -H "Content-Type: application/json" -d '{"query":{"match_all":{}}}'
```

### Real-time / Code-level sync (Application -> Elasticsearch)

Backend có thể index trực tiếp sang Elasticsearch khi bạn create/update/delete place.

- Bật bằng cách set `ELASTICSEARCH_URL=http://localhost:9200`
- Index name có thể đổi qua `ELASTICSEARCH_PLACES_INDEX` (default: `places`)

Ví dụ test nhanh:

1) Tạo place qua API `POST /api/v1/place` -> ES có document ngay.

2) Update place qua API `PUT /api/v1/place/:id` -> backend sẽ cập nhật `updated_at` và re-index.

## Vietnamese Search (Elasticsearch mapping)

Mục tiêu tìm kiếm:

- Gõ tiếng Việt có dấu/không dấu đều ra kết quả.
- Gõ sai chính tả nhẹ (ví dụ: `chua mot cot`) vẫn match `Chùa Một Cột`.

### Lưu ý quan trọng

- **Analyzer/mapping chỉ áp dụng khi tạo index**. Nếu index `places` đã tồn tại và có dữ liệu, bạn cần tạo index mới và **reindex**.
- Logstash giữ nguyên chuỗi thô; Elasticsearch sẽ tokenize theo analyzer của field.

### Option A (không cần plugin): `standard + lowercase + asciifolding`

Option này đơn giản, chạy được ngay với Elasticsearch Docker mặc định.

1) Tạo index mới (ví dụ `places_v1`) với analyzer "fold" (bỏ dấu):

```bash
curl -X PUT "http://localhost:9200/places_v1" -H "Content-Type: application/json" -d "{\
	\"settings\": {\
		\"analysis\": {\
			\"filter\": {\
				\"vi_fold\": {\
					\"type\": \"asciifolding\",\
					\"preserve_original\": true\
				}\
			},\
			\"analyzer\": {\
				\"vi_text\": {\
					\"type\": \"custom\",\
					\"tokenizer\": \"standard\",\
					\"filter\": [\"lowercase\", \"vi_fold\"]\
				}\
			}\
		}\
	},\
	\"mappings\": {\
		\"properties\": {\
			\"id\": {\"type\": \"integer\"},\
			\"name\": {\"type\": \"text\", \"analyzer\": \"vi_text\"},\
			\"description\": {\"type\": \"text\", \"analyzer\": \"vi_text\"},\
			\"category_id\": {\"type\": \"integer\"},\
			\"created_at\": {\"type\": \"date\"},\
			\"updated_at\": {\"type\": \"date\"}\
		}\
	}\
}"
```

2) Reindex dữ liệu từ `places` sang `places_v1`:

```bash
curl -X POST "http://localhost:9200/_reindex?pretty" -H "Content-Type: application/json" -d "{\
	\"source\": { \"index\": \"places\" },\
	\"dest\": { \"index\": \"places_v1\" }\
}"
```

3) Tạo alias `places` trỏ sang `places_v1` để Logstash/app vẫn ghi vào `places`:

```bash
curl -X POST "http://localhost:9200/_aliases" -H "Content-Type: application/json" -d "{\
	\"actions\": [\
		{ \"remove\": { \"index\": \"places\", \"alias\": \"places\", \"ignore_unavailable\": true } },\
		{ \"add\": { \"index\": \"places_v1\", \"alias\": \"places\", \"is_write_index\": true } }\
	]\
}"
```

4) Query tìm kiếm (fuzzy typo):

```bash
curl -X POST "http://localhost:9200/places/_search?pretty" -H "Content-Type: application/json" -d "{\
	\"query\": {\
		\"multi_match\": {\
			\"query\": \"chua mot cot\",\
			\"fields\": [\"name^3\", \"description\"],\
			\"operator\": \"and\",\
			\"fuzziness\": \"AUTO\",\
			\"prefix_length\": 1\
		}\
	}\
}"
```

### Option B (cần plugin): ICU analyzer

Nếu bạn muốn tokenizer tốt hơn cho Unicode, bạn có thể cài plugin `analysis-icu` cho Elasticsearch rồi dùng `icu_tokenizer`/`icu_analyzer`.

Gợi ý (chạy trong container, sau đó restart container):

```bash
docker exec -it be-vn-cultural-gis-elasticsearch bin/elasticsearch-plugin install analysis-icu
docker restart be-vn-cultural-gis-elasticsearch
```

Sau đó bạn có thể thay tokenizer/analyzer bằng ICU trong phần tạo index.
