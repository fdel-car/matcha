// Function available here: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// Accept char with accents, don't forget
const checkName = name => {
  let messages = [];
  const regex = /^[a-zA-Z \-]+$/;
  if (name.length > 32)
    messages.push("Your name can't be more than 32 characters long.");
  if (!regex.test(name))
    messages.push('Only alphabetic characters are allowed.');
  return messages;
};

const checkUsername = username => {
  let messages = [];
  const regex = /^[a-zA-Z0-9\-]+$/;
  if (!regex.test(username))
    messages.push(
      "Your username must only contain alphanumeric characters or '-'."
    );
  return messages;
};

const checkEmail = email => {
  let messages = [];
  const regex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  if (!regex.test(email))
    messages.push('This email address is not well formatted.');
  return messages;
};

const checkPassword = list => password => {
  let messages = [];
  const regex = new RegExp(`^${escapeRegExp(password)}$`, 'm');
  if (list && regex.test(list))
    messages.push(
      "This password has been breached multiple times, you shouldn't use it anymore."
    );
  if (password.length < 8)
    messages.push('Your password must be at least 8 characters long.');
  return messages;
};

const confirmPassword = toConfirm => password => {
  let messages = [];
  if (password !== toConfirm)
    messages.push('This password does not match the previous one.');
  return messages;
};

const checkBio = bio => {
  let messages = [];
  if (bio.length > 512)
    messages.push("Your bio can't be more than 512 characters long.");
  return messages;
};

module.exports = {
  checkName,
  checkUsername,
  checkEmail,
  checkPassword,
  confirmPassword,
  checkBio
};
