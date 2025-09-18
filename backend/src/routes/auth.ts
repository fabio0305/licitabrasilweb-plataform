import { Router } from 'express';
import { AuthController } from '@/controllers/AuthController';
import { validateLogin, validateUserRegistration } from '@/middleware/validation';
import { authenticate } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();
const authController = new AuthController();

// Rotas públicas
router.post('/register', validateUserRegistration, asyncHandler(authController.register));
router.post('/login', validateLogin, asyncHandler(authController.login));
router.post('/refresh-token', asyncHandler(authController.refreshToken));
router.post('/forgot-password', asyncHandler(authController.forgotPassword));
router.post('/reset-password', asyncHandler(authController.resetPassword));

// Rotas protegidas
router.post('/logout', authenticate, asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.getProfile));
router.put('/me', authenticate, asyncHandler(authController.updateProfile));
router.put('/change-password', authenticate, asyncHandler(authController.changePassword));

export default router;
