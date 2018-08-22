const {
  checkName,
  checkUsername,
  checkEmail,
  checkPassword
} = require('../components/verification');

const rules = {
  last_name: checkName,
  first_name: checkName,
  username: checkUsername,
  email: checkEmail,
  password: checkPassword
};

function validateInput(body) {
  let messages = [];
  Object.keys(body).forEach(key => {
    if (!body[key]) return messages.push(`The field ${key} can't be blank.`);
    if (rules[key] === checkPassword) {
      return (messages = messages.concat(checkPassword(null)(body[key])));
    }
    messages = messages.concat(rules[key](body[key]));
  });
  return messages;
}

module.exports = validateInput;
