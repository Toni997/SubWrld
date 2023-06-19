import express, { Router } from 'express'
import { loginUser, signupUser, getUser, updateUser } from '../controllers/user'
import { authenticate } from '../middleware/authMiddleware'

const usersRouter: Router = express.Router()

usersRouter.post('/login', loginUser)
usersRouter.post('/signup', signupUser)
usersRouter.get('/:userId', getUser)
usersRouter.put('/', authenticate, updateUser)

export default usersRouter
