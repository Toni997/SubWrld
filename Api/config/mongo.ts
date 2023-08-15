import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    mongoose.set('debug', true)

    const conn = await mongoose.connect(process.env.MONGO_URI as string)

    console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (error: any) {
    console.log(`Error: ${error.message}`)
    process.exit(1)
  }
}

export default connectDB
