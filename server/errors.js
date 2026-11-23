// An error with an HTTP status; the error handler sends its message as is.
export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
