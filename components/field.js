const Field = props => {
  const isValid = (props.messages || []).length === 0;
  const iconLeft = !props.textarea && props.iconLeft;
  const iconRight =
    !props.textarea &&
    props.value &&
    (isValid ? '-check' : '-exclamation-triangle');
  const className = props.value ? (isValid ? ' is-success' : ' is-danger') : '';
  const FieldTag = props.textarea ? 'textarea' : 'input';
  return (
    <div className="field">
      <label className="label">{props.label}</label>
      <div
        className={
          'control' +
          (iconLeft ? ' has-icons-left' : '') +
          (iconRight ? ' has-icons-right' : '')
        }
      >
        <FieldTag
          className={(props.textarea ? 'textarea' : 'input') + className}
          type={props.type}
          placeholder={props.placeholder}
          value={props.value}
          onChange={props.onChange}
          name={props.name}
          autoComplete={props.autoComplete}
        />
        {iconLeft && (
          <span className="icon is-small is-left">
            <i className={'fas fa-' + iconLeft} />
          </span>
        )}
        {iconRight && (
          <span className="icon is-small is-right">
            <i className={'fas fa' + iconRight} />
          </span>
        )}
      </div>
      {props.value && !isValid ? (
        <div className={'help is-danger'}>
          {props.messages.map((message, i) => (
            <p key={i}>{message}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default Field;
