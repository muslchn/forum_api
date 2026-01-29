import AuthenticationTokenManager from '../../../Applications/security/AuthenticationTokenManager.js';
import AuthenticationError from '../../../Commons/exceptions/AuthenticationError.js';

const authenticationMiddleware = (container) => async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AuthenticationError('missing authentication');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new AuthenticationError('invalid authentication');
    }

    const authenticationTokenManager = container.getInstance(AuthenticationTokenManager.name);
    await authenticationTokenManager.verifyAccessToken(token);

    const { id, username } = await authenticationTokenManager.decodePayload(token);

    req.auth = {
      credentials: {
        id,
        username,
      },
    };

    next();
  } catch (error) {
    next(error);
  }
};

export default authenticationMiddleware;
