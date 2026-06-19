module.exports = {
	GeoViewportRequest: {
		type: 'object',
		required: ['bbox'],
		properties: {
			bbox: {
				type: 'string',
				description: 'Khung nhìn bản đồ theo định dạng minLng,minLat,maxLng,maxLat.',
				example: '106.68575113624685,10.76988371401646,106.70763796180837,10.78931857765812',
			},
			limit: {
				type: 'integer',
				minimum: 1,
				description: 'Giới hạn số marker trả về.',
				example: 20,
			},
			place_id: {
				type: 'integer',
				minimum: 1,
				description: 'Lọc theo địa điểm (place).',
				example: 12,
			},
		},
	},

	CategoryBrief: {
		type: 'object',
		properties: {
			id: { type: 'integer', example: 1 },
			name: { type: 'string', example: 'Di tích' },
			icon_marker: {
				type: 'string',
				nullable: true,
				description: 'Đường dẫn/tên icon marker để FE hiển thị.',
				example: 'https://example.com/icons/heritage.png',
			},
		},
	},

	PlaceBrief: {
		type: 'object',
		properties: {
			id: { type: 'integer', example: 12 },
			name: { type: 'string', example: 'Chợ Bến Thành' },
			category_id: { type: 'integer', nullable: true, example: 1 },
			category: { $ref: '#/components/schemas/CategoryBrief', nullable: true },
		},
	},

	LocationMarker: {
		type: 'object',
		properties: {
			id: { type: 'integer', example: 101 },
			lat: { type: 'number', description: 'Vĩ độ', example: 10.77584 },
			lng: { type: 'number', description: 'Kinh độ', example: 106.70098 },
			address: {
				type: 'string',
				nullable: true,
				example: 'Phường Bến Thành, Quận 1, TP.HCM',
			},
			place_id: { type: 'integer', example: 12 },
			place: { $ref: '#/components/schemas/PlaceBrief' },
		},
	},

	GeoViewportMeta: {
		type: 'object',
		properties: {
			count: { type: 'integer', example: 120 },
			limit: { type: 'integer', nullable: true, example: 20 },
			bbox: {
				type: 'string',
				example: '106.68575113624685,10.76988371401646,106.70763796180837,10.78931857765812',
			},
			place_id: { type: 'integer', nullable: true, example: 12 },
		},
	},

	GeoViewportSuccessResponse: {
		type: 'object',
		required: ['success', 'message', 'data'],
		properties: {
			success: { type: 'boolean', example: true },
			message: { type: 'string', example: 'OK' },
			data: {
				type: 'array',
				items: { $ref: '#/components/schemas/LocationMarker' },
			},
			meta: { $ref: '#/components/schemas/GeoViewportMeta' },
		},
	},

	// ── Comment schemas ──────────────────────────────────────────────────────

	CommentCreateRequest: {
		type: 'object',
		required: ['post_id', 'content'],
		properties: {
			post_id: { type: 'integer', minimum: 1, example: 10 },
			content: { type: 'string', example: 'Bài viết rất hay!' },
			parent_id: {
				type: 'integer',
				minimum: 1,
				nullable: true,
				example: 2,
				description: 'Nếu có giá trị này thì comment hiện tại là reply của comment cha.',
			},
		},
	},

	CommentUpdateRequest: {
		type: 'object',
		required: ['content'],
		properties: {
			content: {
				type: 'string',
				example: 'Mình đã chỉnh lại nội dung comment.',
				description: 'Nội dung mới của comment.',
			},
		},
	},

	/** Thông tin user tóm tắt (dùng trong comment/review) */
	UserBrief: {
		type: 'object',
		properties: {
			id: { type: 'integer', example: 5 },
			username: { type: 'string', example: 'nguyen_minh_tuan' },
			avatar: { type: 'string', nullable: true, example: 'https://example.com/avatar.png' },
		},
	},

	/** Comment item dùng trong response (có user + permission flags) */
	CommentData: {
		type: 'object',
		properties: {
			id: { type: 'integer', example: 1 },
			post_id: { type: 'integer', example: 10 },
			user_id: { type: 'integer', example: 5 },
			parent_id: { type: 'integer', nullable: true, example: 2 },
			content: { type: 'string', example: 'Bài viết rất hay!' },
			created_at: { type: 'string', format: 'date-time', example: '2024-03-01T12:00:00.000Z' },
			user: { $ref: '#/components/schemas/UserBrief', nullable: true },
			editYN: { type: 'string', enum: ['Y', 'N'], example: 'Y', description: 'Y nếu user hiện tại có quyền sửa.' },
			delYN:  { type: 'string', enum: ['Y', 'N'], example: 'Y', description: 'Y nếu user hiện tại có quyền xóa.' },
		},
	},

	CommentResponse: {
		type: 'object',
		required: ['success', 'message', 'data'],
		properties: {
			success: { type: 'boolean', example: true },
			message: { type: 'string', example: 'Created' },
			data: { $ref: '#/components/schemas/CommentData' },
		},
	},

	/**
	 * Comment item với replies lồng nhau — dùng cho GET /post/:id/comments
	 */
	PostCommentItem: {
		type: 'object',
		properties: {
			id: { type: 'integer', example: 1 },
			post_id: { type: 'integer', example: 10 },
			user_id: { type: 'integer', example: 5 },
			parent_id: { type: 'integer', nullable: true, example: null },
			content: { type: 'string', example: 'Địa điểm này thật đẹp!' },
			created_at: { type: 'string', format: 'date-time', example: '2026-06-01T09:00:00.000Z' },
			user: { $ref: '#/components/schemas/UserBrief', nullable: true },
			editYN: { type: 'string', enum: ['Y', 'N'], example: 'N' },
			delYN:  { type: 'string', enum: ['Y', 'N'], example: 'N' },
			replyCount: { type: 'integer', example: 2, description: 'Số lượng replies của comment gốc này.' },
			replies: {
				type: 'array',
				description: 'Danh sách replies (comment con), chỉ ở comment gốc (parent_id = null).',
				items: { $ref: '#/components/schemas/CommentData' },
			},
		},
	},

	/** Response phân trang cho GET /post/:id/comments */
	PostCommentsPagedResponse: {
		type: 'object',
		required: ['success', 'message', 'data'],
		properties: {
			success: { type: 'boolean', example: true },
			message: { type: 'string', example: 'OK' },
			data: {
				type: 'object',
				properties: {
					data: {
						type: 'array',
						items: { $ref: '#/components/schemas/PostCommentItem' },
					},
					total: { type: 'integer', example: 42, description: 'Tổng số comment gốc.' },
					page: { type: 'integer', example: 1 },
					totalPages: { type: 'integer', example: 5 },
				},
			},
		},
	},

	// ── Place / Review schemas ───────────────────────────────────────────────

	PlaceReviewCreateRequest: {
		type: 'object',
		required: ['rating'],
		properties: {
			rating: {
				type: 'integer',
				minimum: 1,
				maximum: 5,
				example: 5,
				description: 'Số sao đánh giá từ 1 đến 5.',
			},
			comment: {
				type: 'string',
				nullable: true,
				example: 'Địa điểm rất đáng ghé thăm.',
			},
		},
	},

	PlaceReviewData: {
		type: 'object',
		properties: {
			id: { type: 'integer', example: 1 },
			user_id: { type: 'integer', example: 5 },
			location_id: { type: 'integer', example: 10 },
			rating: { type: 'integer', example: 5 },
			comment: { type: 'string', nullable: true, example: 'Địa điểm rất đáng ghé thăm.' },
			created_at: { type: 'string', format: 'date-time', example: '2026-05-28T10:00:00.000Z' },
			user: { $ref: '#/components/schemas/UserBrief', nullable: true },
			location: {
				type: 'object',
				nullable: true,
				properties: {
					id: { type: 'integer', example: 10 },
					lat: { type: 'number', nullable: true, example: 10.77584 },
					lng: { type: 'number', nullable: true, example: 106.70098 },
					address: { type: 'string', nullable: true, example: 'Phường Bến Thành, Quận 1, TP.HCM' },
					place_id: { type: 'integer', example: 12 },
					place: { $ref: '#/components/schemas/PlaceBrief', nullable: true },
				},
			},
		},
	},

	PlaceReviewResponse: {
		type: 'object',
		required: ['success', 'message', 'data'],
		properties: {
			success: { type: 'boolean', example: true },
			message: { type: 'string', example: 'Created' },
			data: { $ref: '#/components/schemas/PlaceReviewData' },
		},
	},

	// ── Post schemas ─────────────────────────────────────────────────────────

	PostCreateRequest: {
		type: 'object',
		required: ['title', 'content'],
		properties: {
			title: { type: 'string', example: 'Một bài viết mới' },
			content: { type: 'string', example: 'Nội dung bài viết' },
			location_id: { type: 'integer', minimum: 1, nullable: true, example: 10 },
			status: { type: 'string', example: 'accepted', nullable: true },
		},
	},

	PostUpdateRequest: {
		type: 'object',
		properties: {
			title: { type: 'string', example: 'Tiêu đề đã chỉnh sửa' },
			content: { type: 'string', example: 'Nội dung đã chỉnh sửa' },
			location_id: { type: 'integer', minimum: 1, nullable: true, example: 10 },
			status: { type: 'string', example: 'accepted', nullable: true },
		},
	},

	PostData: {
		type: 'object',
		properties: {
			id: { type: 'integer', example: 1 },
			user_id: { type: 'integer', example: 5 },
			location_id: { type: 'integer', nullable: true, example: 10 },
			title: { type: 'string', example: 'Một bài viết mới' },
			content: { type: 'string', example: 'Nội dung bài viết' },
			status: { type: 'string', enum: ['pending', 'accepted', 'rejected'], example: 'accepted' },
			created_at: { type: 'string', format: 'date-time', example: '2026-05-28T10:00:00.000Z' },
			editYN: { type: 'string', enum: ['Y', 'N'], example: 'Y' },
			delYN:  { type: 'string', enum: ['Y', 'N'], example: 'Y' },
			user: { $ref: '#/components/schemas/UserBrief', nullable: true },
			location: {
				type: 'object',
				nullable: true,
				properties: {
					id: { type: 'integer', example: 10 },
					lat: { type: 'number', nullable: true, example: 10.77584 },
					lng: { type: 'number', nullable: true, example: 106.70098 },
					address: { type: 'string', nullable: true, example: 'Phường Bến Thành, Quận 1, TP.HCM' },
					place_id: { type: 'integer', nullable: true, example: 12 },
					place: { $ref: '#/components/schemas/PlaceBrief', nullable: true },
				},
			},
		},
	},

	PostListResponse: {
		type: 'object',
		required: ['success', 'message', 'data'],
		properties: {
			success: { type: 'boolean', example: true },
			message: { type: 'string', example: 'OK' },
			data: {
				type: 'array',
				items: { $ref: '#/components/schemas/PostData' },
			},
		},
	},

	PostResponse: {
		type: 'object',
		required: ['success', 'message', 'data'],
		properties: {
			success: { type: 'boolean', example: true },
			message: { type: 'string', example: 'OK' },
			data: { $ref: '#/components/schemas/PostData' },
		},
	},

	// ── Common ───────────────────────────────────────────────────────────────

	ErrorResponse: {
		type: 'object',
		required: ['success', 'message', 'error'],
		properties: {
			success: { type: 'boolean', example: false },
			message: {
				type: 'string',
				example: 'bbox is required. Expected format: minLng,minLat,maxLng,maxLat',
			},
			error: {
				type: 'object',
				required: ['code'],
				properties: {
					code: { type: 'string', example: 'BAD_REQUEST' },
					details: { nullable: true, description: 'Thông tin chi tiết (nếu có)' },
				},
			},
		},
	},

	// ── Location / Place create ───────────────────────────────────────────────

	LocationCreateRequest: {
		type: 'object',
		properties: {
			lat: { type: 'number', minimum: -90, maximum: 90, example: 10.77584 },
			lng: { type: 'number', minimum: -180, maximum: 180, example: 106.70098 },
			address: { type: 'string', example: 'Phường Bến Thành, Quận 1, TP.HCM' },
		},
	},

	PlaceCreateRequest: {
		type: 'object',
		required: ['name'],
		properties: {
			name: { type: 'string', example: 'Chợ Bến Thành' },
			description: { type: 'string', example: 'Ngôi chợ lịch sử ở trung tâm Sài Gòn' },
			category_id: { type: 'integer', example: 1 },
			locations: {
				type: 'array',
				items: { $ref: '#/components/schemas/LocationCreateRequest' },
				description: 'Danh sách các vị trí (locations) thuộc địa điểm này.',
			},
		},
	},

	// ── Auth / User schemas ───────────────────────────────────────────────────

	UserProfile: {
		type: 'object',
		properties: {
			id: { type: 'integer', example: 10 },
			username: { type: 'string', example: 'nguyenvana' },
			email: { type: 'string', example: 'user@example.com' },
			role: { type: 'string', enum: ['admin', 'user'], example: 'user' },
			avatar: { type: 'string', nullable: true, example: 'https://example.com/avatar.png' },
			created_at: { type: 'string', format: 'date-time', example: '2024-01-01T10:00:00.000Z' },
		},
	},

	AuthRegisterRequest: {
		type: 'object',
		required: ['username', 'email', 'password'],
		properties: {
			username: { type: 'string', example: 'nguyenvana' },
			email: { type: 'string', example: 'user@example.com' },
			password: { type: 'string', example: 'password123' },
			avatar: { type: 'string', nullable: true, example: 'https://example.com/avatar.png' },
		},
	},

	AuthLoginRequest: {
		type: 'object',
		required: ['email', 'password'],
		properties: {
			email: { type: 'string', example: 'user@example.com' },
			password: { type: 'string', example: 'password123' },
		},
	},

	AuthResponse: {
		type: 'object',
		properties: {
			token: { type: 'string', description: 'JWT token' },
			user: { $ref: '#/components/schemas/UserProfile' },
		},
	},

	UserUpdateRequest: {
		type: 'object',
		properties: {
			username: { type: 'string', example: 'nguyenvana' },
			email: { type: 'string', example: 'user@example.com' },
			currentPassword: { type: 'string', example: 'oldpassword123' },
			password: { type: 'string', example: 'newpassword123' },
			avatar: { type: 'string', nullable: true, example: 'https://example.com/avatar.png' },
		},
	},

	// ── Exhibition schemas ───────────────────────────────────────────────────

	ExhibitionCreateRequest: {
		type: 'object',
		required: ['title', 'description', 'image_url', 'category', 'province'],
		properties: {
			title: { type: 'string', example: 'Đêm phố cổ Hội An' },
			description: { type: 'string', example: 'Không gian đêm phố cổ Hội An hiện lên lung linh...' },
			image_url: { type: 'string', example: 'https://example.com/images/hoian.jpg' },
			category: { type: 'string', enum: ['place', 'food', 'festival'], example: 'place' },
			style_tag: { type: 'string', nullable: true, example: 'Phố Cổ Hội An' },
			place_name: { type: 'string', nullable: true, example: 'Phố cổ Hội An' },
			province: { type: 'string', example: 'Quảng Nam' },
			status: { type: 'string', enum: ['pending', 'accepted', 'rejected'], example: 'pending', description: 'Admin có thể tự chọn trạng thái khi tạo, User mặc định là pending' }
		},
	},

	ExhibitionUpdateRequest: {
		type: 'object',
		properties: {
			title: { type: 'string', example: 'Đêm phố cổ Hội An (Đã chỉnh sửa)' },
			description: { type: 'string', example: 'Mô tả mới của tác phẩm...' },
			image_url: { type: 'string', example: 'https://example.com/images/hoian_new.jpg' },
			category: { type: 'string', enum: ['place', 'food', 'festival'], example: 'place' },
			style_tag: { type: 'string', nullable: true, example: 'Phố Cổ' },
			place_name: { type: 'string', nullable: true, example: 'Hội An' },
			province: { type: 'string', example: 'Quảng Nam' },
			status: { type: 'string', enum: ['pending', 'accepted', 'rejected'], example: 'accepted', description: 'Chỉ Admin mới có quyền cập nhật trạng thái trực tiếp' }
		},
	},

	ExhibitionReviewRequest: {
		type: 'object',
		required: ['status'],
		properties: {
			status: { type: 'string', enum: ['accepted', 'rejected'], example: 'accepted', description: 'Trạng thái phê duyệt' }
		},
	},

	ExhibitionLikeRequest: {
		type: 'object',
		required: ['action'],
		properties: {
			action: { type: 'string', enum: ['like', 'unlike'], example: 'like', description: 'Hành động thích hoặc bỏ thích' }
		},
	},

	ExhibitionData: {
		type: 'object',
		properties: {
			id: { type: 'integer', example: 1 },
			user_id: { type: 'integer', example: 5 },
			title: { type: 'string', example: 'Đêm phố cổ Hội An' },
			description: { type: 'string', example: 'Không gian đêm phố cổ Hội An...' },
			image_url: { type: 'string', example: 'https://example.com/images/hoian.jpg' },
			category: { type: 'string', enum: ['place', 'food', 'festival'], example: 'place' },
			style_tag: { type: 'string', nullable: true, example: 'Phố Cổ Hội An' },
			place_name: { type: 'string', nullable: true, example: 'Phố cổ Hội An' },
			province: { type: 'string', example: 'Quảng Nam' },
			likes: { type: 'integer', example: 42 },
			status: { type: 'string', enum: ['pending', 'accepted', 'rejected'], example: 'accepted' },
			created_at: { type: 'string', format: 'date-time', example: '2026-06-19T15:45:00.000Z' },
			updated_at: { type: 'string', format: 'date-time', example: '2026-06-19T15:45:00.000Z' },
			user: { $ref: '#/components/schemas/UserBrief', nullable: true }
		},
	},

	ExhibitionResponse: {
		type: 'object',
		required: ['success', 'message', 'data'],
		properties: {
			success: { type: 'boolean', example: true },
			message: { type: 'string', example: 'OK' },
			data: { $ref: '#/components/schemas/ExhibitionData' },
		},
	},

	ExhibitionListResponse: {
		type: 'object',
		required: ['success', 'message', 'data'],
		properties: {
			success: { type: 'boolean', example: true },
			message: { type: 'string', example: 'OK' },
			data: {
				type: 'array',
				items: { $ref: '#/components/schemas/ExhibitionData' }
			},
		},
	},

	// ── Cuisine schemas ──────────────────────────────────────────────────────

	CuisineCreateRequest: {
		type: 'object',
		required: ['name'],
		properties: {
			name: { type: 'string', example: 'Phở bò Hà Nội' },
			description: { type: 'string', example: 'Món ăn truyền thống của người Hà Nội...' },
			origin: { type: 'string', example: 'Hà Nội' },
			ingredients: { type: 'string', example: 'Bánh phở, thịt bò, xương ống bò, thảo quả, gừng...' },
			image_url: { type: 'string', example: 'https://example.com/images/pho.jpg' }
		},
	},

	CuisineUpdateRequest: {
		type: 'object',
		properties: {
			name: { type: 'string', example: 'Phở bò chín' },
			description: { type: 'string', example: 'Nước dùng trong, thơm ngọt...' },
			origin: { type: 'string', example: 'Hà Nội' },
			ingredients: { type: 'string', example: 'Bánh phở, thịt nạm bò, nước dùng...' },
			image_url: { type: 'string', example: 'https://example.com/images/pho_bo.jpg' }
		},
	},

	CuisinePlaceCreateRequest: {
		type: 'object',
		required: ['place_id'],
		properties: {
			place_id: { type: 'integer', example: 12 },
			notes: { type: 'string', example: 'Bán buổi sáng, nước dùng rất ngon' }
		},
	},

	CuisineData: {
		type: 'object',
		properties: {
			id: { type: 'integer', example: 1 },
			name: { type: 'string', example: 'Phở bò' },
			description: { type: 'string', example: 'Món ăn truyền thống...' },
			origin: { type: 'string', example: 'Hà Nội' },
			ingredients: { type: 'string', example: 'Bánh phở, thịt bò...' },
			image_url: { type: 'string', example: 'https://example.com/images/pho.jpg' },
			created_at: { type: 'string', format: 'date-time', example: '2026-06-19T15:45:00.000Z' },
			updated_at: { type: 'string', format: 'date-time', example: '2026-06-19T15:45:00.000Z' }
		},
	},

	CuisineResponse: {
		type: 'object',
		required: ['success', 'message', 'data'],
		properties: {
			success: { type: 'boolean', example: true },
			message: { type: 'string', example: 'OK' },
			data: { $ref: '#/components/schemas/CuisineData' }
		},
	},

	CuisineListResponse: {
		type: 'object',
		required: ['success', 'message', 'data'],
		properties: {
			success: { type: 'boolean', example: true },
			message: { type: 'string', example: 'OK' },
			data: {
				type: 'array',
				items: { $ref: '#/components/schemas/CuisineData' }
			},
		},
	},

	// ── FolkArt schemas ──────────────────────────────────────────────────────

	FolkArtCreateRequest: {
		type: 'object',
		required: ['name'],
		properties: {
			name: { type: 'string', example: 'Đờn ca tài tử Nam Bộ' },
			description: { type: 'string', example: 'Nghệ thuật âm nhạc dân gian đặc trưng...' },
			history: { type: 'string', example: 'Ra đời vào cuối thế kỷ 19...' },
			instruments: { type: 'string', example: 'Đờn kìm, đờn tranh, đờn bầu...' },
			image_url: { type: 'string', example: 'https://example.com/images/doncataitu.jpg' }
		},
	},

	FolkArtUpdateRequest: {
		type: 'object',
		properties: {
			name: { type: 'string', example: 'Đờn ca tài tử' },
			description: { type: 'string', example: 'Nghệ thuật đàn hát bình dân...' },
			history: { type: 'string', example: 'Di sản phi vật thể nhân loại...' },
			instruments: { type: 'string', example: 'Đờn kìm, đờn tranh, sáo...' },
			image_url: { type: 'string', example: 'https://example.com/images/don_ca.jpg' }
		},
	},

	FolkArtData: {
		type: 'object',
		properties: {
			id: { type: 'integer', example: 1 },
			name: { type: 'string', example: 'Đờn ca tài tử' },
			description: { type: 'string', example: 'Nghệ thuật đặc trưng...' },
			history: { type: 'string', example: 'Lịch sử hình thành...' },
			instruments: { type: 'string', example: 'Đờn kìm...' },
			image_url: { type: 'string', example: 'https://example.com/images/don_ca.jpg' },
			created_at: { type: 'string', format: 'date-time', example: '2026-06-19T15:45:00.000Z' },
			updated_at: { type: 'string', format: 'date-time', example: '2026-06-19T15:45:00.000Z' }
		},
	},

	FolkArtResponse: {
		type: 'object',
		required: ['success', 'message', 'data'],
		properties: {
			success: { type: 'boolean', example: true },
			message: { type: 'string', example: 'OK' },
			data: { $ref: '#/components/schemas/FolkArtData' }
		},
	},

	FolkArtListResponse: {
		type: 'object',
		required: ['success', 'message', 'data'],
		properties: {
			success: { type: 'boolean', example: true },
			message: { type: 'string', example: 'OK' },
			data: {
				type: 'array',
				items: { $ref: '#/components/schemas/FolkArtData' }
			},
		},
	},

	// ── Custom schemas ───────────────────────────────────────────────────────

	CustomCreateRequest: {
		type: 'object',
		required: ['name'],
		properties: {
			name: { type: 'string', example: 'Nghi lễ thờ cúng Hùng Vương' },
			description: { type: 'string', example: 'Tục lệ giỗ Tổ tiên của dân tộc Việt...' },
			time_period: { type: 'string', example: 'Mùng 10 tháng Ba âm lịch' },
			rituals: { type: 'string', example: 'Dâng hương, rước kiệu, tế lễ...' },
			image_url: { type: 'string', example: 'https://example.com/images/hungvuong.jpg' }
		},
	},

	CustomUpdateRequest: {
		type: 'object',
		properties: {
			name: { type: 'string', example: 'Tín ngưỡng thờ cúng Hùng Vương' },
			description: { type: 'string', example: 'Tục thờ Tổ...' },
			time_period: { type: 'string', example: 'Tháng Ba âm lịch' },
			rituals: { type: 'string', example: 'Lễ dâng hương, hội dân gian...' },
			image_url: { type: 'string', example: 'https://example.com/images/hung_vuong.jpg' }
		},
	},

	CustomData: {
		type: 'object',
		properties: {
			id: { type: 'integer', example: 1 },
			name: { type: 'string', example: 'Tín ngưỡng thờ cúng Hùng Vương' },
			description: { type: 'string', example: 'Tục lệ giỗ Tổ...' },
			time_period: { type: 'string', example: 'Mùng 10 tháng Ba' },
			rituals: { type: 'string', example: 'Nghi lễ chính...' },
			image_url: { type: 'string', example: 'https://example.com/images/hungvuong.jpg' },
			created_at: { type: 'string', format: 'date-time', example: '2026-06-19T15:45:00.000Z' },
			updated_at: { type: 'string', format: 'date-time', example: '2026-06-19T15:45:00.000Z' }
		},
	},

	CustomResponse: {
		type: 'object',
		required: ['success', 'message', 'data'],
		properties: {
			success: { type: 'boolean', example: true },
			message: { type: 'string', example: 'OK' },
			data: { $ref: '#/components/schemas/CustomData' }
		},
	},

	CustomListResponse: {
		type: 'object',
		required: ['success', 'message', 'data'],
		properties: {
			success: { type: 'boolean', example: true },
			message: { type: 'string', example: 'OK' },
			data: {
				type: 'array',
				items: { $ref: '#/components/schemas/CustomData' }
			},
		},
	},

	// ── Notification schemas ─────────────────────────────────────────────────

	NotificationData: {
		type: 'object',
		properties: {
			id: { type: 'integer', example: 1 },
			user_id: { type: 'integer', example: 5 },
			actor_id: { type: 'integer', nullable: true, example: 6 },
			post_id: { type: 'integer', nullable: true, example: 10 },
			comment_id: { type: 'integer', nullable: true, example: 2 },
			url: { type: 'string', nullable: true, example: '/post/10' },
			message: { type: 'string', example: 'nguyen_van_b đã bình luận về bài viết của bạn' },
			is_read: { type: 'boolean', example: false },
			created_at: { type: 'string', format: 'date-time', example: '2026-06-19T15:45:00.000Z' },
			actor: { $ref: '#/components/schemas/UserBrief', nullable: true },
			post: {
				type: 'object',
				nullable: true,
				properties: {
					id: { type: 'integer', example: 10 },
					title: { type: 'string', example: 'Title bài viết' }
				}
			},
			comment: {
				type: 'object',
				nullable: true,
				properties: {
					id: { type: 'integer', example: 2 },
					content: { type: 'string', example: 'Nội dung bình luận' }
				}
			}
		},
	},

	NotificationListResponse: {
		type: 'object',
		required: ['success', 'message', 'data'],
		properties: {
			success: { type: 'boolean', example: true },
			message: { type: 'string', example: 'OK' },
			data: {
				type: 'array',
				items: { $ref: '#/components/schemas/NotificationData' }
			},
		},
	},
};
