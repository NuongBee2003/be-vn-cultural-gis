const { getClient, isEnabled } = require('./elasticsearchClient');

const getPlacesIndex = () => process.env.ELASTICSEARCH_PLACES_INDEX || 'places';

const toPlainObject = (maybeModel) => {
	if (!maybeModel) return null;
	if (typeof maybeModel.get === 'function') {
		return maybeModel.get({ plain: true });
	}
	return maybeModel;
};

const indexPlace = async (place) => {
	if (!isEnabled()) return;
	const client = getClient();
	if (!client) return;

	const doc = toPlainObject(place);
	if (!doc || doc.id === undefined || doc.id === null) return;

	await client.index({
		index: getPlacesIndex(),
		id: String(doc.id),
		document: doc,
	});
};

const deletePlace = async (placeId) => {
	if (!isEnabled()) return;
	const client = getClient();
	if (!client) return;

	try {
		await client.delete({
			index: getPlacesIndex(),
			id: String(placeId),
		});
	} catch (err) {
		// ignore not-found
		if (err && (err.statusCode === 404 || err.meta?.statusCode === 404)) return;
		throw err;
	}
};

const safeIndexPlace = (place) => {
	return indexPlace(place).catch((err) => {
		console.warn('[elasticsearch] indexPlace failed:', err?.message || err);
	});
};

const safeDeletePlace = (placeId) => {
	return deletePlace(placeId).catch((err) => {
		console.warn('[elasticsearch] deletePlace failed:', err?.message || err);
	});
};

module.exports = {
	indexPlace,
	deletePlace,
	safeIndexPlace,
	safeDeletePlace,
};
