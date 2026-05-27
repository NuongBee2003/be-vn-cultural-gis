const jwt = require('jsonwebtoken');

const parsedRounds = Number.parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
const BCRYPT_ROUNDS = Number.isFinite(parsedRounds) && parsedRounds > 0 ? parsedRounds : 10;

const toUserResponse = (user) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    created_at: user.created_at,
});

const signAuthToken = (user, secret, expiresIn) =>
    jwt.sign(
        {
            userId: user.id,
            role: user.role,
            email: user.email,
            username: user.username,
        },
        secret,
        { expiresIn }
    );

module.exports = {
    BCRYPT_ROUNDS,
    toUserResponse,
    signAuthToken,
};
