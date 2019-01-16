const bcrypt = require('bcryptjs');
const password = 'baseball';

/* Hash a password with cost-factor 10, then run compare verify */
bcrypt.hash(password, 10)
  .then(digest => {
    console.log('digest =', digest);
    return digest;
  })
  .catch(err => {
    console.log('error', err);
  });