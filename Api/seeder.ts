import dotenv from 'dotenv'
import users from './seed/users'
import User from './models/user'
import connectDB from './config/mongo'

dotenv.config()

connectDB()

const importData = async () => {
  try {
    await User.deleteMany()

    await User.insertMany(users)

    console.log('Data imported')
    process.exit()
  } catch (error) {
    console.log(`Error: ${error}`)
    process.exit(1)
  }
}

const destroyData = async () => {
  try {
    await User.deleteMany()

    console.log('Data destroyed!')
    process.exit()
  } catch (error) {
    console.log(`Error: ${error}`)
    process.exit(1)
  }
}

if (process.argv[2] === '-d') {
  destroyData()
} else {
  importData()
}
