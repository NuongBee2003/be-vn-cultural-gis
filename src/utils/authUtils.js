const jwt = require('jsonwebtoken');

const validator = require('validator');

const parsedBcryptRounds = Number.parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
const MIN_BCRYPT_ROUNDS = 10;
const BCRYPT_ROUNDS =
    Number.isFinite(parsedBcryptRounds) && parsedBcryptRounds >= MIN_BCRYPT_ROUNDS
        ? parsedBcryptRounds
        : MIN_BCRYPT_ROUNDS;

const isValidEmail = (email) => typeof email === 'string' 
&& validator.isEmail(email);

const toUserResponse = (user) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    business_name: user.business_name,
    business_phone: user.business_phone,
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
    isValidEmail,
};
