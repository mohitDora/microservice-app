import { Router } from 'express';
import {
  registerUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser
} from '../controller/userController.js';
import authenticateToken from '../middleware/authMiddleware.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/', getAllUsers);
router.get('/:id', getUserById);

router.put('/:id', authenticateToken, updateUser);
router.delete('/:id', authenticateToken, deleteUser);

export default router;