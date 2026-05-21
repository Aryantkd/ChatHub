import "dotenv/config";

export const authenticate = async (email, password) => {
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    return Promise.resolve({ email, password });
  }
  return null;
};


export const PORT = process.env.PORT || 5000;
export const COOKIE_PASSWORD = process.env.COOKIE_PASSWORD;
