require("dotenv").config();
const express = require("express");
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const schemas = require('./docs/schemas');
const app = express();
const initRoutes = require("./routes/index");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
require("./config/connectionDB");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const swaggerSpec = swaggerJSDoc({
	definition: {
		openapi: '3.0.3',
		info: {
			title: 'VN Cultural GIS API',
			version: '1.0.0',
			description:
				'Tài liệu API (Swagger/OpenAPI) cho hệ thống bản đồ văn hoá. Swagger được generate từ comment trong router.',
		},
		servers: [
			{ url: `http://localhost:${process.env.PORT || 5000}`, description: 'Local dev' },
			{
				url: 'https://unlumped-inexpugnable-brandee.ngrok-free.dev/',
				description: 'Public (Pinggy tunnel)',
			},
		],
		tags: [
			{ name: 'Auth', description: 'API đăng nhập/đăng ký' },
			{ name: 'User', description: 'API liên quan đến người dùng' },
			{ name: 'Location', description: 'API liên quan đến vị trí/marker' },
			{ name: 'Place', description: 'API liên quan đến địa điểm (place)' },
			{ name: 'Search', description: 'API tìm kiếm (Elasticsearch)' },
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

app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

initRoutes(app);
app.use(notFound);
app.use(errorHandler);
const PORT = process.env.PORT || 5000;
app.listen(PORT, console.log(`Server started on port ${PORT}`));