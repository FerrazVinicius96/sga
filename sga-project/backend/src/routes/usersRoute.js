const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const adminOnly = [authenticateToken, authorizeRole(['admin', 'super_admin'])];

router.post('/register', ...adminOnly, usersController.register);

router.get('/', ...adminOnly, usersController.list);
router.get('/:id', ...adminOnly, usersController.getById);
router.put('/:id', ...adminOnly, usersController.update);
router.patch('/:id/reset-password', ...adminOnly, usersController.resetPassword);
router.patch('/:id/activate', ...adminOnly, usersController.activate);
router.patch('/:id/deactivate', ...adminOnly, usersController.deactivate);
router.delete('/:id', ...adminOnly, usersController.remove);

module.exports = router;
