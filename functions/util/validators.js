const isEmail = email => {
  const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regex)) return true;
  return false;
};

const isEmpty = string => {
  if (string.trim() === "") return true;
  return false;
};

exports.validateSignUpData = newUser => {
  let errors = {};

  if (isEmpty(newUser.email)) {
    errors.email = "must not be empty";
  } else if (!isEmail(newUser.email)) {
    errors.email = "must be a valid email address";
  }

  if (isEmpty(newUser.password)) errors.password = "must not be empty";
  if (newUser.password !== newUser.confirmPassword)
    errors.confirmPassword = "passwords must match";
  if (isEmpty(newUser.handle)) errors.handle = "must not be empty";

  return errors;
};

exports.validateLoginData = user => {
  let errors = {};
  if (isEmpty(user.email)) errors.email = "must not be empty";
  if (isEmpty(user.password)) errors.password = "must not be empty";
  return errors;
};
