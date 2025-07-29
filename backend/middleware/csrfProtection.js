const csurf = require('csurf');

const csrfProtection = csurf({
  cookie: {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
  },
  value: (req) => {
    return req.headers['x-csrf-token'] || req.body._csrf;
  },
});

module.exports = csrfProtection;