
export const ErrorMessages : Record<number, string> = {
    [-1] : "No Connection",
    401: "Unauthorized"
};

export class ApiError extends Error {
    constructor(error : number) {
        super()
        this.errorCode = error
        this.errorMessage = ErrorMessages[error] ?? "Unexpected Error occurred"
    }
    errorCode : number;
    errorMessage: string;
}