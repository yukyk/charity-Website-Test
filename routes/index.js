const router = require('express').Router();
const rateLimit = require('express-rate-limit');

const isTest = process.env.NODE_ENV === 'test';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});

router.use('/auth',          authLimiter, require('./auth.routes'));
router.use('/users',         require('./user.routes'));
router.use('/charities',     require('./charity.routes'));
router.use('/donations',     require('./donation.routes'));
router.use('/admin',         require('./admin.routes'));
router.use('/notifications', require('./notification.routes'));

module.exports = router;
