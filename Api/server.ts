import express, { Express } from 'express'
import dotenv from 'dotenv'
import morgan from 'morgan'
import cors from 'cors'
import { errorHandler, notFound } from './middleware/errorMiddleware'
import connectDB from './config/mongo'

import indexRouter from './routes/index'
import usersRouter from './routes/users'
import tvShowRouter from './routes/tv-shows'
import subtitleRouter from './routes/subtitles'
import announcementRouter from './routes/announcements'

dotenv.config()

connectDB()

const app: Express = express()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(morgan('dev'))
app.use(
  cors({
    origin: 'http://localhost:9000',
  })
)

app.use('/', indexRouter)
app.use('/users', usersRouter)
app.use('/tv-shows', tvShowRouter)
app.use('/subtitles', subtitleRouter)
app.use('/announcements', announcementRouter)

app.use(notFound)
app.use(errorHandler)

const port: string | number = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
