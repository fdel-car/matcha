// Function available here: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function toAge(dateString) {
  let birthday = new Date(dateString).getTime();
  return ~~((Date.now() - birthday) / 31557600000);
}

// Accept char with accents, don't forget
const validateName = name => {
  let errors = [];
  const regex = /^[a-zA-Z \-]+$/;
  if (name.length > 32)
    errors.push("Your name can't be more than 32 characters long.");
  if (!regex.test(name)) errors.push('Only alphabetic characters are allowed.');
  return errors;
};

const validateUsername = username => {
  let errors = [];
  const regex = /^[a-zA-Z0-9\-]+$/;
  if (username.length > 32)
    errors.push("Your username can't be more than 32 characters long.");
  if (!regex.test(username))
    errors.push(
      "Your username must only contain alphanumeric characters or '-'."
    );
  return errors;
};

const validateEmail = email => {
  let errors = [];
  const regex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  if (email.length > 64)
    errors.push("Your email address can't be more than 64 characters long.");
  if (!regex.test(email))
    errors.push('This email address is not well formatted.');
  return errors;
};

const validatePassword = list => password => {
  let errors = [];
  const regex = new RegExp(`^${escapeRegExp(password)}$`, 'm');
  if (list && regex.test(list))
    errors.push(
      "This password has been breached multiple times, you shouldn't use it anymore."
    );
  if (password.length < 8)
    errors.push('Your password must be at least 8 characters long.');
  return errors;
};

const confirmPassword = toConfirm => password => {
  let errors = [];
  if (password !== toConfirm)
    errors.push('This password does not match the previous one.');
  return errors;
};

const validateDate = date => {
  let errors = [];
  const regex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  if (!regex.test(date)) errors.push('This date is not well formatted.');
  else {
    const age = toAge(date);
    if (age < 18) errors.push('You have to be an adult to use this website.');
    else if (age > 115) errors.push('You should be dead already, come on...');
  }
  return errors;
};

const validateBio = bio => {
  let errors = [];
  if (bio.length > 512)
    errors.push("Your bio can't be more than 512 characters long.");
  return errors;
};

const validateInterest = interest => {
  let errors = [];
  const regex = /^[a-zA-Z0-9\- ]+$/;
  if (!regex.test(interest))
    errors.push(
      "Your interest must only contain alphanumeric characters or '-' and whitespaces."
    );
  if (interest.length > 128)
    errors.push("Your interest can't be more than 128 characters long.");
  return errors;
};

module.exports = {
  validateName,
  validateUsername,
  validateEmail,
  validatePassword,
  confirmPassword,
  validateDate,
  validateBio,
  validateInterest
};
