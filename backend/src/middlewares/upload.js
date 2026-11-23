import multer from 'multer';

import {
  ALLOWED_IMAGE_MIME_TYPES,
  detectImageType,
  normalizeImageMimeType,
} from '../utils/image.js';
import { ValidationError } from '../utils/errors.js';

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const EVENT_POSTER_MAX_BYTES = 4 * 1024 * 1024;

function createValidationError(field, message) {
  return new ValidationError('Validasi gagal', [{ field, message }]);
}

function capitalize(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function createImageUploadMiddleware({
  field = 'photo',
  fileLabel = 'foto',
  maxBytes,
  maxSizeLabel,
}) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxBytes,
      files: 1,
    },
    fileFilter: (req, file, callback) => {
      const mimeType = normalizeImageMimeType(file.mimetype);

      if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
        return callback(
          createValidationError(
            field,
            `Format ${fileLabel} harus JPEG, PNG, atau WebP`,
          ),
        );
      }

      return callback(null, true);
    },
  });

  return (req, res, next) => {
    upload.single(field)(req, res, (error) => {
      if (!error) {
        return next();
      }

      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return next(
            createValidationError(
              field,
              `Ukuran ${fileLabel} maksimal ${maxSizeLabel}`,
            ),
          );
        }

        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(
            createValidationError(field, `Field ${field} tidak valid`),
          );
        }

        return next(
          createValidationError(field, `${capitalize(fileLabel)} tidak dapat diproses`),
        );
      }

      return next(error);
    });
  };
}

export function validateImageUpload(field = 'photo', { fileLabel = 'foto' } = {}) {
  return (req, res, next) => {
    if (!req.file) {
      return next(
        createValidationError(field, `${capitalize(fileLabel)} wajib diunggah`),
      );
    }

    const detected = detectImageType(req.file.buffer);

    if (!detected) {
      return next(
        createValidationError(
          field,
          `Format ${fileLabel} harus JPEG, PNG, atau WebP`,
        ),
      );
    }

    const declaredMimeType = normalizeImageMimeType(req.file.mimetype);

    if (declaredMimeType !== detected.mime) {
      return next(
        createValidationError(
          field,
          `Format ${fileLabel} tidak sesuai isi file`,
        ),
      );
    }

    req.file.detectedMimeType = detected.mime;
    req.file.detectedExtension = detected.extension;

    return next();
  };
}

export const uploadAvatar = createImageUploadMiddleware({
  field: 'photo',
  fileLabel: 'foto',
  maxBytes: AVATAR_MAX_BYTES,
  maxSizeLabel: '2 MB',
});

export const validateAvatar = validateImageUpload('photo', {
  fileLabel: 'foto',
});

export const uploadEventPoster = createImageUploadMiddleware({
  field: 'poster',
  fileLabel: 'poster',
  maxBytes: EVENT_POSTER_MAX_BYTES,
  maxSizeLabel: '4 MB',
});

export const validateEventPoster = validateImageUpload('poster', {
  fileLabel: 'poster',
});
