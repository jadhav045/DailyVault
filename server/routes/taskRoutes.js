import express from 'express';
import { testEndpoint } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.middleware.js';


const router = express.Router();


router.get('/test', verifyToken, testEndpoint);

export default router;