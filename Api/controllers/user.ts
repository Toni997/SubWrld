import asyncHandler from 'express-async-handler'
import generateToken from '../utils/generateToken'
import { Request, Response } from 'express'
import { IGetUserRequest, IUpdateUserRequest } from '../interfaces/request'
import User from '../models/user'

// @desc Auth user & get token
// @route POST /api/users/login
// @access Public
const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body

  const user = await User.findOne({ username })

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user),
    })
  } else {
    res.status(401)
    throw new Error('Invalid email or password')
  }
})

// @desc Register a new user
// @route POST /api/users
// @access Public
const signupUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body

  const usernameExists = await User.findOne({ username })

  if (usernameExists) {
    res.status(400)
    throw new Error('Username already exists')
  }

  const emailExists = await User.findOne({ email })

  if (emailExists) {
    res.status(400)
    throw new Error('Email already exists')
  }

  const user = await User.create({
    username,
    email,
    password,
  })

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user),
    })
  } else {
    res.status(400)
    throw new Error('Invalid user data')
  }
})

// @desc Get user profile
// @route GET /api/users/profile
// @access Private
const updateUser = asyncHandler(
  async (req: IUpdateUserRequest, res: Response) => {
    const user = await User.findById(req.user?._id)

    if (user) {
      user.username = req.body.name || user.username
      user.email = req.body.email || user.email
      if (req.body.password) {
        user.password = req.body.password
      }

      const updatedUser = await user.save()

      res.json({
        _id: updatedUser._id,
        name: updatedUser.username,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        token: generateToken(updatedUser._id),
      })
    } else {
      res.status(404)
      throw new Error('User not found')
    }
  }
)

// @desc Update user profile
// @route PUT /api/users/profile
// @access Private
const getUser = asyncHandler(async (req: IGetUserRequest, res: Response) => {
  const user = await User.findById(req.params.userId)

  if (user) {
    res.json(user)
  } else {
    res.status(404)
    throw new Error('User not found')
  }
})

export { loginUser, signupUser, getUser, updateUser }
