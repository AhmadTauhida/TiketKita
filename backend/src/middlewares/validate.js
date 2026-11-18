import { ValidationError } from '../utils/errors.js';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message,
      }));

      return next(new ValidationError('Validasi gagal', errors));
    }

    req[source] = result.data;
    return next();
  };
}
