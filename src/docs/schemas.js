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
			district_id: {
				type: 'integer',
				minimum: 1,
				description: 'Lọc theo quận/huyện (district).',
				example: 5,
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
			district_id: { type: 'integer', example: 1 },
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
			district_id: { type: 'integer', nullable: true, example: 5 },
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
			parent_id: { type: 'integer', minimum: 1, nullable: true, example: 2 },
		},
	},

	CommentReplyRequest: {
		type: 'object',
		required: ['content'],
		properties: {
			content: { type: 'string', example: 'Mình đồng ý với bạn.' },
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
		required: ['district_id'],
		properties: {
			lat: { type: 'number', minimum: -90, maximum: 90, example: 10.77584 },
			lng: { type: 'number', minimum: -180, maximum: 180, example: 106.70098 },
			address: { type: 'string', example: 'Phường Bến Thành, Quận 1, TP.HCM' },
			district_id: { type: 'integer', minimum: 1, example: 1 },
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
};
