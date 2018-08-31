const {
  validateName,
  validateUsername,
  validateEmail,
  validatePassword,
  validateBio
} = require('../components/helpers/validation');

const rules = {
  last_name: validateName,
  first_name: validateName,
  username: validateUsername,
  email: validateEmail,
  password: validatePassword,
  bio: validateBio
};

function validateInput(body) {
  let messages = [];
  Object.keys(body).forEach(key => {
    if (!body[key]) return messages.push(`The field ${key} can't be blank.`);
    if (rules[key] === validatePassword) {
      return (messages = messages.concat(validatePassword(null)(body[key])));
    }
    messages = messages.concat(rules[key](body[key]));
  });
  return messages;
}

module.exports = validateInput;
