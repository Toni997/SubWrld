import bcrypt from 'bcryptjs'

const users = [
  {
    username: 'admin',
    email: 'admin@example.com',
    password: bcrypt.hashSync('123456', 10),
    isAdmin: true,
  },
  {
    username: 'johndoe',
    email: 'john@example.com',
    password: bcrypt.hashSync('123456', 10),
  },
  {
    username: 'janedoe',
    email: 'jane@example.com',
    password: bcrypt.hashSync('123456', 10),
  },
]

export default users
