import multer, { Multer, FileFilterCallback } from 'multer'
import { Request } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { CustomError } from '../middleware/errorMiddleware'
import fs from 'fs'
import path from 'path'

const fileSizeLimitMegabytes = 2
export const allowedExtensions = ['.srt', '.sub', '.ssa', '.ass', '.vtt']
export const allowedMimeTypes = [
  'application/x-subrip',
  'application/x-matroska',
  'application/vnd.ms-ssa',
  'application/vnd.nikse.subtitleeditor',
  'text/plain',
]
export const tempFolderPath = path.join('uploads', 'temp')
export const subtitlesFolderPath = path.join('uploads', 'subtitles')

const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    if (!fs.existsSync(tempFolderPath)) fs.mkdirSync(tempFolderPath)
    cb(null, tempFolderPath)
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    cb(null, uuidv4() + '.' + file.originalname.split('.').pop())
  },
})

const fileFilter = async (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const extension = '.' + file.originalname.split('.').pop()
  if (allowedExtensions.includes(extension)) {
    cb(null, true)
  } else {
    cb(new CustomError('Unsupported files', 415))
  }
}

const subtitleMulter: Multer = multer({
  storage,
  limits: {
    fileSize: fileSizeLimitMegabytes * 1024 * 1024,
  },
  fileFilter,
})

export { subtitleMulter }
