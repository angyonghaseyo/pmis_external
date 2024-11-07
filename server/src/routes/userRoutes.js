const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { db } = require('../config/firebase'); // Import the initialized db
const UserService = require('../services/userService');
const UserController = require('../controllers/userController');

const router = express.Router();
const userService = new UserService(db);
const userController = new UserController(userService);

router.get('/users', (req, res) => userController.getUsers(req, res));
router.post('/register', upload.single('photoFile'), (req, res) => userController.register(req, res));
router.post('/login', (req, res) => userController.login(req, res));
router.get('/user-profile', (req, res) => userController.getUserProfile(req, res));
router.put('/update-profile', upload.single('photoFile'), (req, res) => userController.updateUserProfile(req, res));
router.get('/all-users-in-company', (req, res) => userController.getAllUsersInCompany(req, res));
router.delete('/users', (req, res) => userController.deleteUser(req, res));
router.delete('/user-account', (req, res) => userController.deleteUserAccount(req, res));
router.post('/invitations', (req, res) => userController.inviteUser(req, res));
router.delete('/invitations/:invitationId', (req, res) => userController.cancelInvitation(req, res));

module.exports = router;