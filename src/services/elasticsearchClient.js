const { Client } = require('@elastic/elasticsearch');

const getElasticsearchUrl = () => process.env.ELASTICSEARCH_URL;

let singletonClient;

const isEnabled = () => Boolean(getElasticsearchUrl());

const getClient = () => {
	if (!isEnabled()) return null;
	if (!singletonClient) {
		singletonClient = new Client({ node: getElasticsearchUrl() });
	}
	return singletonClient;
};

const safePing = async () => {
	const client = getClient();
	if (!client) return false;
	try {
		await client.ping();
		return true;
	} catch (_) {
		return false;
	}
};

module.exports = {
	getClient,
	isEnabled,
	safePing,
};
