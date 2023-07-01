import multer, { Multer, FileFilterCallback } from 'multer'
import { Request } from 'express'
import { subtitleValidator } from '../middleware/validators/subtitleValidator'
import { v4 as uuidv4 } from 'uuid'
import { CustomError } from '../middleware/errorMiddleware'
import fs from 'fs'
import path from 'path'

const fileSizeLimitMegabytes = 1
export const tempFolderPath = path.join('uploads', 'temp')
export const subtitlesFolderPath = path.join('uploads', 'subtitles')

const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    if (!fs.existsSync(tempFolderPath)) {
      fs.mkdirSync(tempFolderPath)
    }
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

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedExtensions = ['.srt', '.sub', '.ssa', '.ass', '.vtt']
  const allowedMimeTypes = [
    'application/x-subrip',
    'application/x-matroska',
    'application/vnd.ms-ssa',
    'application/vnd.nikse.subtitleeditor',
    'text/plain',
  ]

  const fileExtension = '.' + file.originalname.split('.').pop()
  const mimeType = file.mimetype

  if (
    allowedExtensions.includes(fileExtension) &&
    allowedMimeTypes.includes(mimeType)
  ) {
    const { error } = subtitleValidator.validate(req.body)
    if (!error) {
      req.statusCode = 400
      cb(null, true)
    } else {
      cb(new CustomError(error.details[0].message, 400))
    }
  } else {
    cb(new CustomError('Unsupported files', 415))
  }
}

const upload: Multer = multer({
  storage: storage,
  limits: {
    fileSize: fileSizeLimitMegabytes * 1024 * 1024,
  },
  fileFilter: fileFilter,
})

export { upload }
