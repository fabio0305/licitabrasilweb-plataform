import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateLogin, validateUserRegistration, validateCpf } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import {
  cpfValidationRateLimit,
  registrationRateLimit,
  loginRateLimit,
  loginFailureRateLimit
} from '../middleware/rateLimiting';

const router = Router();
const authController = new AuthController();

// Rotas públicas com rate limiting
router.post('/validate-cpf', cpfValidationRateLimit.middleware(), validateCpf, asyncHandler(authController.validateCpf.bind(authController)));
router.post('/register', registrationRateLimit.middleware(), validateUserRegistration, asyncHandler(authController.register.bind(authController)));
router.post('/login', validateLogin, asyncHandler(authController.login.bind(authController)));
router.post('/refresh-token', asyncHandler(authController.refreshToken.bind(authController)));
router.post('/forgot-password', asyncHandler(authController.forgotPassword.bind(authController)));
router.post('/reset-password', asyncHandler(authController.resetPassword.bind(authController)));

// Rotas protegidas
router.post('/logout', authenticate, asyncHandler(authController.logout.bind(authController)));
router.get('/me', authenticate, asyncHandler(authController.getProfile.bind(authController)));
router.put('/me', authenticate, asyncHandler(authController.updateProfile.bind(authController)));
router.put('/change-password', authenticate, asyncHandler(authController.changePassword.bind(authController)));

export default router;
