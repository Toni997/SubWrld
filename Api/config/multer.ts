import multer, { Multer, FileFilterCallback } from 'multer'
import { Request } from 'express'
import { subtitleValidator } from '../middleware/validators/subtitleValidator'

const fileSizeLimitMegabytes = 1

const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, 'uploads/')
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    cb(null, file.originalname)
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
      cb(null, true)
    } else {
      cb(new Error(error.details[0].message))
    }
  } else {
    cb(null, false)
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
