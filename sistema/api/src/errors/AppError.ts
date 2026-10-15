export class AppError extends Error {
  statusCode: number;
  // Campos extras devolvidos junto com o `error` (ex.: as pendências do 409 na
  // exclusão de conta, que a tela usa para montar o modal de sucessores).
  details: Record<string, unknown> | undefined;

  constructor(
    statusCode: number,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}
