import 'isomorphic-fetch';

const nameValidator = name => {
  let messages = [];
  const regex = /^[a-zA-Z \-]+$/;
  if (!regex.test(name))
    messages.push('Only alphabetic characters are allowed.');
  return {
    isValid: messages.length === 0,
    messages
  };
};

const usernameValidator = username => {
  let messages = [];
  const regex = /^[a-zA-Z0-9\-]+$/;
  if (!regex.test(username))
    messages.push(
      "Your username must only contain alphanumeric characters or '-'."
    );
  return {
    isValid: messages.length === 0,
    messages
  };
};

const emailValidator = email => {
  let messages = [];
  const regex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  if (!regex.test(email))
    messages.push('This email address is not well formatted.');
  return {
    isValid: messages.length === 0,
    messages
  };
};

let badPasswordList;
fetch('/bad-password-list').then(res =>
  res.text().then(text => (badPasswordList = text))
);
const passwordValidator = password => {
  let messages = [];
  const regex = new RegExp(`^${password}$`, 'm');
  if (regex.test(badPasswordList))
    messages.push(
      "This password has been breached multiple times, you shouldn't use it anymore"
    );
  if (password.length < 8)
    messages.push('Your password must be at least 8 characters long.');
  return {
    isValid: messages.length === 0,
    messages
  };
};

export { nameValidator, usernameValidator, emailValidator, passwordValidator };
