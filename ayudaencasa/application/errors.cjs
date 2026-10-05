'use strict';
class AppError extends Error { constructor(code,message,status=400){super(message);this.name='AppError';this.code=code;this.status=status;} }
const unauthorized=()=>new AppError('UNAUTHENTICATED','Authentication required',401);
const forbidden=()=>new AppError('FORBIDDEN','Access denied',403);
const notFound=()=>new AppError('NOT_FOUND','Resource not found',404);
const conflict=(message='Request conflicts with current state')=>new AppError('CONFLICT',message,409);
module.exports={AppError,unauthorized,forbidden,notFound,conflict};
