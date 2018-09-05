const {
  validateName,
  validateUsername,
  validateEmail,
  validatePassword,
  validateDate,
  validateBio
} = require('../components/helpers/validation');

const rules = {
  last_name: validateName,
  first_name: validateName,
  username: validateUsername,
  email: validateEmail,
  password: validatePassword,
  birthday: validateDate,
  bio: validateBio
};

function validateInput(body) {
  let errors = [];
  Object.keys(body).forEach(key => {
    if (!body[key]) return errors.push(`The field ${key} can't be blank.`);
    if (rules[key] === validatePassword) {
      return (errors = errors.concat(validatePassword(null)(body[key])));
    }
    errors = errors.concat(rules[key](body[key]));
  });
  return errors;
}

module.exports = validateInput;
