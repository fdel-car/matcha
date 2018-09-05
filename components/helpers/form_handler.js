const formState = rules => {
  let state = {};
  Object.keys(rules).forEach(key => {
    state[key] = {
      value: rules[key].default || '',
      errors: rules[key].warnings || []
    };
  });
  return state;
};

const formReady = (rules, state) => {
  return Object.keys(rules).some(
    key =>
      (!state[key].value && rules[key].required) ||
      state[key].errors.length > 0
  );
};

export { formState, formReady };
