const db = require('../models');

class TransactionController {
    async begin() {
        return db.sequelize.transaction();
    }

    async commit(transaction) {
        return transaction.commit();
    }

    async rollback(transaction) {
        return transaction.rollback();
    }
}

module.exports = new TransactionController();
