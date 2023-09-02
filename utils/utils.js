import sha1 from 'sha1';

export const pwdHash = (pwd) => sha1(pwd);
