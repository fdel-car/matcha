const formState = rules => {
  let state = {};
  Object.keys(rules).forEach(key => {
    state[key] = {
      value: rules[key].default || '',
      messages: rules[key].warnings || []
    };
  });
  return state;
};

const formReady = (rules, state) => {
  return Object.keys(rules).some(
    key =>
      (!state[key].value && rules[key].required) ||
      state[key].messages.length > 0
  );
};

export { formState, formReady };
