exports.handler = async (event) => {
  const claims = event?.requestContext?.authorizer?.jwt?.claims || {};

  const user = {
    userId: claims.sub || null,
    email: claims.email || null,
    emailVerified: claims.email_verified === 'true' || claims.email_verified === true,
    username: claims['cognito:username'] || claims.username || null,
    tokenUse: claims.token_use || null,
    issuer: claims.iss || null,
  };

  if (!user.userId) {
    return respond(401, {
      message: 'Unauthorized',
      reason: 'Missing Cognito JWT claims',
    });
  }

  return respond(200, {
    user,
    source: 'cognito',
  });
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(body),
  };
}
