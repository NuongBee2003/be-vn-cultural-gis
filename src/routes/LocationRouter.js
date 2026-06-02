const express = require('express');
const route = express.Router();
const LocationManager = require('../manager/locationManager');

/**
 * @openapi
 * /api/v1/location/geo:
 *   post:
 *     tags:
 *       - Location
 *     summary: Lấy danh sách marker trong khung nhìn bản đồ
 *     description: >
 *       Trả về các điểm (locations) nằm trong bbox. API join sang Place và Category để lấy thông tin hiển thị marker (ví dụ: place.name, category.icon_marker).
 *
 *       Lưu ý: Server hiện merge tham số từ querystring và JSON body; Swagger mô tả theo JSON body để dễ dùng.
 *       
 *       **Tối ưu hóa hiệu suất (Caching):** API này sử dụng cơ chế **Tile-based Caching** với Redis.
 *       Bbox truyền vào sẽ được tự động snap về các grid cell (kích thước ~5.5km). Khi người dùng kéo thả bản đồ trong cùng một khu vực, API sẽ trả về kết quả ngay lập tức từ bộ nhớ đệm (thời gian sống: 10 phút), giúp giảm tải server và tăng tốc độ phản hồi.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GeoViewportRequest'
 *           examples:
 *             default:
 *               summary: Ví dụ bbox + limit
 *               value:
 *                 bbox: 106.68575113624685,10.76988371401646,106.70763796180837,10.78931857765812
 *                 limit: 20
 *             filterByPlace:
 *               summary: Lọc theo place_id
 *               value:
 *                 bbox: 106.68575113624685,10.76988371401646,106.70763796180837,10.78931857765812
 *                 limit: 20
 *                 place_id: 12
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GeoViewportSuccessResponse'
 *       '400':
 *         description: Dữ liệu đầu vào không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Lỗi hệ thống
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
route.post('/geo', LocationManager.getLocationsByGeo);

/**
 * @openapi
 * /api/v1/location/category/{categoryId}:
 *   get:
 *     tags:
 *       - Location
 *     summary: Lọc danh sách địa điểm theo category
 *     description: Trả về danh sách locations có place thuộc categoryId (kèm place + category để FE lấy icon_marker).
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID của category cần lọc.
 *         example: 1
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success, message, data]
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: OK
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LocationMarker'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 10
 *                     category_id:
 *                       type: integer
 *                       example: 1
 *       '400':
 *         description: Dữ liệu đầu vào không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Lỗi hệ thống
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
route.get('/category/:categoryId', LocationManager.getLocationsByCategory);

/**
 * @openapi
 * /api/v1/location:
 *   get:
 *     tags:
 *       - Location
 *     summary: Lấy tất cả locations (dành cho admin) - có phân trang
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Số trang (mặc định 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Số items trên mỗi trang (mặc định 20)
 *     responses:
 *       '200':
 *         description: OK
 *       '400':
 *         description: Bad Request
 *       '500':
 *         description: Internal server error
 */
route.get('/', LocationManager.getAllLocations);

/**
 * @openapi
 * /api/v1/location:
 *   post:
 *     tags:
 *       - Location
 *     summary: Tạo mới địa điểm (Place + Location + Assets trong 1 request)
 *     description: >
 *       Tạo đồng thời Place, Location và ảnh trong một transaction duy nhất.
 *
 *       **Hai chế độ:**
 *
 *       - **Tạo mới hoàn toàn:** Không truyền `place_id`. Bắt buộc truyền `name`. Hệ thống sẽ tự tạo Place mới rồi gắn Location vào.
 *
 *       - **Gắn vào Place đã có:** Truyền `place_id`. Hệ thống bỏ qua `name`/`description`/`category_id` và chỉ tạo Location mới gắn vào Place đó.
 *
 *       **Lưu ý về `images`:** Mảng string URL. Ảnh đầu tiên sẽ được đánh dấu `is_primary = true` tự động.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên địa điểm. Bắt buộc khi không truyền place_id.
 *                 example: Nhà Thờ Đức Bà
 *               description:
 *                 type: string
 *                 description: Mô tả địa điểm (tùy chọn).
 *                 example: Công trình kiến trúc Pháp cổ tại trung tâm TP.HCM
 *               category_id:
 *                 type: integer
 *                 description: ID danh mục của địa điểm (tùy chọn).
 *                 example: 1
 *               place_id:
 *                 type: integer
 *                 description: ID của Place đã tồn tại. Nếu truyền, bỏ qua name/description/category_id.
 *                 example: 5
 *               lat:
 *                 type: number
 *                 description: Vĩ độ (tùy chọn).
 *                 example: 10.779960
 *               lng:
 *                 type: number
 *                 description: Kinh độ (tùy chọn).
 *                 example: 106.699190
 *               address:
 *                 type: string
 *                 description: Địa chỉ (tùy chọn).
 *                 example: 01 Công xã Paris, Bến Nghé, Quận 1, TP.HCM
 *               images:
 *                 type: array
 *                 description: Danh sách URL ảnh. Ảnh đầu tiên tự động là ảnh chính (is_primary).
 *                 items:
 *                   type: string
 *                   example: https://cdn.example.com/nha-tho.jpg
 *           examples:
 *             taoMoiHoanToan:
 *               summary: Tạo mới Place + Location + Ảnh
 *               value:
 *                 name: Nhà Thờ Đức Bà
 *                 description: Công trình kiến trúc Pháp cổ tại trung tâm TP.HCM
 *                 category_id: 1
 *                 lat: 10.779960
 *                 lng: 106.699190
 *                 address: 01 Công xã Paris, Bến Nghé, Quận 1, TP.HCM
 *                 images:
 *                   - https://cdn.example.com/nha-tho-1.jpg
 *                   - https://cdn.example.com/nha-tho-2.jpg
 *             ganVaoPlaceCuHay:
 *               summary: Gắn Location mới vào Place đã có
 *               value:
 *                 place_id: 5
 *                 lat: 10.762622
 *                 lng: 106.660172
 *                 address: 123 Đường ABC, Quận 1, TP.HCM
 *     responses:
 *       '201':
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Created
 *                 data:
 *                   type: object
 *                   description: Location vừa được tạo
 *       '400':
 *         description: Dữ liệu không hợp lệ (thiếu name khi không có place_id, lat/lng sai khoảng, v.v.)
 *       '500':
 *         description: Internal server error
 */
route.post('/', LocationManager.create);

/**
 * @openapi
 * /api/v1/location/{id}:
 *   get:
 *     tags:
 *       - Location
 *     summary: Lấy thông tin chi tiết một location
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID của location
 *     responses:
 *       '200':
 *         description: OK
 *       '400':
 *         description: Bad Request
 *       '404':
 *         description: Not Found
 *       '500':
 *         description: Internal server error
 */
route.get('/:id', LocationManager.getLocationById);

/**
 * @openapi
 * /api/v1/location/{id}:
 *   put:
 *     tags:
 *       - Location
 *     summary: Cập nhật địa điểm (Place + Location + Assets trong 1 request)
 *     description: >
 *       Cập nhật đồng thời thông tin Place, Location và ảnh trong một transaction duy nhất.
 *       Chỉ cần truyền các trường muốn thay đổi, các trường không truyền sẽ giữ nguyên.
 *
 *       **Lưu ý về `images`:**
 *       - Nếu **có truyền** `images` (kể cả mảng rỗng `[]`): hệ thống **xóa toàn bộ ảnh cũ** và thêm ảnh mới.
 *       - Nếu **không truyền** `images`: ảnh hiện tại không bị thay đổi.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID của location cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên địa điểm mới (cập nhật bảng places).
 *                 example: Nhà Thờ Đức Bà
 *               description:
 *                 type: string
 *                 description: Mô tả địa điểm mới (cập nhật bảng places).
 *                 example: Di tích lịch sử cấp quốc gia
 *               category_id:
 *                 type: integer
 *                 description: ID danh mục mới (cập nhật bảng places).
 *                 example: 2
 *               lat:
 *                 type: number
 *                 description: Vĩ độ mới (cập nhật bảng locations).
 *                 example: 10.779960
 *               lng:
 *                 type: number
 *                 description: Kinh độ mới (cập nhật bảng locations).
 *                 example: 106.699190
 *               address:
 *                 type: string
 *                 description: Địa chỉ mới (cập nhật bảng locations).
 *                 example: 01 Công xã Paris, Bến Nghé, Quận 1, TP.HCM
 *               images:
 *                 type: array
 *                 description: >
 *                   Danh sách URL ảnh mới. Khi truyền, ảnh cũ bị xóa và thay bằng ảnh mới.
 *                   Ảnh đầu tiên tự động là ảnh chính (is_primary). Truyền [] để xóa hết ảnh.
 *                 items:
 *                   type: string
 *                   example: https://cdn.example.com/anh-moi.jpg
 *           examples:
 *             capNhatViTriVaAnh:
 *               summary: Cập nhật vị trí + ảnh
 *               value:
 *                 lat: 10.779960
 *                 lng: 106.699190
 *                 address: 01 Công xã Paris, Bến Nghé, Quận 1
 *                 images:
 *                   - https://cdn.example.com/anh-moi-1.jpg
 *                   - https://cdn.example.com/anh-moi-2.jpg
 *             capNhatThongTinPlace:
 *               summary: Chỉ cập nhật thông tin Place
 *               value:
 *                 name: Nhà Thờ Đức Bà (đã cập nhật)
 *                 description: Mô tả mới
 *                 category_id: 2
 *             xoaHetAnh:
 *               summary: Xóa toàn bộ ảnh
 *               value:
 *                 images: []
 *     responses:
 *       '200':
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Updated
 *                 data:
 *                   type: object
 *                   description: Location sau khi cập nhật
 *       '400':
 *         description: Dữ liệu không hợp lệ
 *       '404':
 *         description: Location không tồn tại
 *       '500':
 *         description: Internal server error
 */
route.put('/:id', LocationManager.update);

/**
 * @openapi
 * /api/v1/location/{id}:
 *   delete:
 *     tags:
 *       - Location
 *     summary: Xóa một location
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID của location
 *     responses:
 *       '200':
 *         description: OK
 *       '400':
 *         description: Bad Request
 *       '404':
 *         description: Not Found
 *       '500':
 *         description: Internal server error
 */
route.delete('/:id', LocationManager.delete);

module.exports = route;
