import bcrypt from 'bcryptjs'

const users = [
  {
    username: 'admin',
    email: 'admin@example.com',
    password: bcrypt.hashSync('123456', 10),
    isAdmin: true,
    watchlist: [] as any[],
  },
  {
    username: 'johndoe',
    email: 'john@example.com',
    password: bcrypt.hashSync('123456', 10),
    watchlist: [] as any[],
  },
  {
    username: 'janedoe',
    email: 'jane@example.com',
    password: bcrypt.hashSync('123456', 10),
    watchlist: [] as any[],
  },
]

export default users
