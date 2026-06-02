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

	CommentData: {
		type: 'object',
		properties: {
			id: { type: 'integer', example: 1 },
			post_id: { type: 'integer', example: 10 },
			user_id: { type: 'integer', example: 5 },
			parent_id: { type: 'integer', nullable: true, example: 2 },
			content: { type: 'string', example: 'Bài viết rất hay!' },
			created_at: { type: 'string', format: 'date-time', example: '2024-03-01T12:00:00.000Z' },
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
			user: {
				$ref: '#/components/schemas/UserProfile',
				nullable: true,
			},
			location: {
				type: 'object',
				nullable: true,
				properties: {
					id: { type: 'integer', example: 10 },
					lat: { type: 'number', nullable: true, example: 10.77584 },
					lng: { type: 'number', nullable: true, example: 106.70098 },
					address: { type: 'string', nullable: true, example: 'Phường Bến Thành, Quận 1, TP.HCM' },
					place_id: { type: 'integer', example: 12 },
					place: {
						$ref: '#/components/schemas/PlaceBrief',
						nullable: true,
					},
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
			status: { type: 'string', example: 'accepted' },
			created_at: { type: 'string', format: 'date-time', example: '2026-05-28T10:00:00.000Z' },
			editYN: { type: 'string', enum: ['Y', 'N'], example: 'Y' },
			delYN: { type: 'string', enum: ['Y', 'N'], example: 'Y' },
			user: { $ref: '#/components/schemas/UserProfile', nullable: true },
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

	UserProfile: {
		type: 'object',
		properties: {
			id: { type: 'integer', example: 10 },
			username: { type: 'string', example: 'nguyenvana' },
			email: { type: 'string', example: 'user@example.com' },
			role: { type: 'string', example: 'user' },
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
};
