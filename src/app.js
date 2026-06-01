const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const schemas = require('./docs/schemas');

const initRoutes = require('./routes/index');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

require('./config/connectionDB');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use((req, res, next) => {
	const origin = req.headers.origin;
	if (corsOrigin === '*') {
		res.header('Access-Control-Allow-Origin', '*');
	} else if (origin) {
		const allowed = corsOrigin
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
		if (allowed.includes(origin)) {
			res.header('Access-Control-Allow-Origin', origin);
		}
	}
	res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
	if (req.method === 'OPTIONS') return res.sendStatus(204);
	next();
});

const swaggerSpec = swaggerJSDoc({
	definition: {
		openapi: '3.0.3',
		info: {
			title: 'VN Cultural GIS API',
			version: '1.0.0',
			description:
				'Tài liệu API (Swagger/OpenAPI) cho hệ thống bản đồ văn hoá. Swagger được generate từ comment trong router.',
		},
		tags: [
			{ name: 'Auth', description: 'API đăng nhập/đăng ký' },
			{ name: 'User', description: 'API liên quan đến người dùng' },
			{ name: 'Post', description: 'API liên quan đến bài post' },
			{ name: 'Location', description: 'API liên quan đến vị trí/marker' },
			{ name: 'Place', description: 'API liên quan đến địa điểm (place)' },
			{ name: 'Search', description: 'API tìm kiếm (Elasticsearch)' },
			{ name: 'Comment', description: 'API liên quan đến comment bài viết' },
		],
		components: {
			schemas,
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
				},
			},
		},
	},
	apis: ['./src/routes/*.js'],
});

app.get('/api-docs.json', (req, res) => {
	const protoHeader = req.headers['x-forwarded-proto'];
	const proto = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader || req.protocol || 'https')
		.toString()
		.split(',')[0]
		.trim();
	const hostHeader = req.headers['x-forwarded-host'];
	const host = (Array.isArray(hostHeader) ? hostHeader[0] : hostHeader) || req.get('host');
	const baseUrl = host ? `${proto}://${host}` : '/';

	return res.json({
		...swaggerSpec,
		servers: [
			{ url: baseUrl, description: 'Current host' },
			{ url: `http://localhost:${process.env.PORT || 5000}`, description: 'Local dev' },
		],
	});
});

app.use(
	'/api-docs',
	swaggerUi.serve,
	swaggerUi.setup(null, {
		swaggerOptions: {
			url: '/api-docs.json',
		},
	})
);

initRoutes(app);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
