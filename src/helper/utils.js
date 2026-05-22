export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({ success: true, message, data });
};

export const sendFailure = (res, message = 'Something went wrong', statusCode = 500) => {
  res.status(statusCode).json({ success: false, message });
};