import { PaginateModel, Schema, model } from 'mongoose'
import paginate from 'mongoose-paginate-v2'
import { ISubtitle } from '../interfaces/subtitle'

const subtitleSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tvShowId: {
      type: Number,
      required: true,
    },
    season: {
      type: Number,
      required: true,
    },
    episode: {
      type: Number,
      required: true,
    },
    episodeId: {
      type: Number,
      required: true,
      index: true,
    },
    language: {
      type: String,
      required: true,
    },
    frameRate: {
      type: Number,
      required: true,
      default: null,
    },
    subtitleRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'SubtitleRequest',
      default: null,
    },
    isWorkInProgress: {
      type: Boolean,
      required: true,
      default: false,
    },
    forHearingImpaired: {
      type: Boolean,
      required: true,
      default: false,
    },
    onlyForeignLanguage: {
      type: Boolean,
      required: true,
      default: false,
    },
    release: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      default: null,
    },
    downloads: {
      type: Number,
      required: true,
      default: 0,
    },
    uploaderIsAuthor: {
      type: Boolean,
      required: true,
      default: false,
    },
    isConfirmed: {
      type: Boolean,
      required: true,
      default: false,
    },
    thankedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
)

subtitleSchema.virtual('thankedByCount').get(function () {
  return this.thankedBy.length
})

subtitleSchema.plugin(paginate)

const Subtitle = model<ISubtitle, PaginateModel<ISubtitle>>(
  'Subtitle',
  subtitleSchema
)

export default Subtitle
