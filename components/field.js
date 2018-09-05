const Field = props => {
  const isValid = (props.errors || []).length === 0;
  const iconLeft = !props.textarea && props.iconLeft;
  const iconRight =
    props.value &&
    props.type !== 'textarea' &&
    props.type !== 'date' &&
    (isValid ? '-check' : '-exclamation-triangle');
  const className = props.value ? (isValid ? ' is-success' : ' is-danger') : '';
  const FieldTag = props.type === 'textarea' ? 'textarea' : 'input';
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
          className={
            (props.type === 'textarea' ? 'textarea' : 'input') + className
          }
          type={props.type === 'textarea' ? null : props.type}
          placeholder={props.placeholder}
          value={props.value}
          onChange={props.onChange}
          onKeyPress={props.onKeyPress}
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
          {props.errors.map((message, i) => (
            <p key={i}>{message}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default Field;
