import { Router } from 'express';
import {
  registerUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
  validateToken
} from '../controller/userController.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/validate', validateToken);

router.get('/', getAllUsers);
router.get('/:id', getUserById);

router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;