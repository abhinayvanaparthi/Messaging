const CryptoJS = require("crypto-js");

const SECRET_KEY = process.env.MESSAGE_SECRET;

// Encrypt message
const encryptMessage = (text) => {
  if (!text) return text;
  const encrypted = CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  return encrypted;
};

// Decrypt message
const decryptMessage = (encryptedText) => {
  if (!encryptedText) return encryptedText;
  const bytes = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  return decrypted;
};

module.exports = {
  encryptMessage,
  decryptMessage,
};