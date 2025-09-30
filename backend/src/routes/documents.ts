import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validatePagination, validateUuidParam } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { DocumentController } from '../controllers/DocumentController';
import multer from 'multer';

const router = Router();
const documentController = new DocumentController();

// Configurar multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  },
});

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas de documentos
router.get('/', validatePagination, asyncHandler(documentController.list));
router.get('/:id', validateUuidParam, asyncHandler(documentController.getById));
router.post('/upload', upload.single('file'), asyncHandler(documentController.upload));
router.get('/:id/download', validateUuidParam, asyncHandler(documentController.download));
router.delete('/:id', validateUuidParam, asyncHandler(documentController.delete));

export default router;
