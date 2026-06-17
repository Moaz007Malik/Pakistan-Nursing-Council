const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const lazyHandler = (exportName) => (req, res, next) => {
  const authController = require('../controllers/auth.controller');
  return authController[exportName](req, res, next);
};

const router = express.Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('role').notEmpty(),
  ],
  validate,
  lazyHandler('register')
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validate,
  lazyHandler('login')
);

router.post('/refresh', lazyHandler('refreshToken'));
router.post('/logout', authenticate, lazyHandler('logout'));
router.get('/me', authenticate, lazyHandler('getMe'));
router.patch('/profile', authenticate, lazyHandler('updateProfile'));

module.exports = router;
