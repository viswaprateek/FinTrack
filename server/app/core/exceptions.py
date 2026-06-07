class AppError(Exception):
    def __init__(self, detail: str, *, status_code: int = 400):
        self.detail = detail
        self.status_code = status_code


class NotFoundError(AppError):
    def __init__(self, resource: str):
        super().__init__(f"{resource} not found", status_code=404)


class ConflictError(AppError):
    def __init__(self, detail: str):
        super().__init__(detail, status_code=409)


class BadRequestError(AppError):
    def __init__(self, detail: str):
        super().__init__(detail, status_code=400)
