const Select = props => {
  const isValid = (props.errors || []).length === 0;
  let className = isValid ? ' is-success' : ' is-danger';
  if (!props.errors) className = '';
  return (
    <div className="field">
      <label className="label">{props.label}</label>
      <div
        className={
          'control' +
          (props.expanded ? ' is-expanded' : '') +
          (props.iconLeft ? ' has-icons-left' : '')
        }
      >
        <div
          className={
            'select' +
            (props.expanded ? ' is-fullwidth' : '') +
            (isValid ? '' : ' is-danger') +
            (props.selected ? className : '')
          }
        >
          <select
            name={props.name}
            onChange={props.onChange}
            value={props.selected || ''}
          >
            {props.selected ? null : (
              <option disabled value="">
                None selected...
              </option>
            )}
            {props.list.map((elem, i) => (
              <option key={i} value={elem.value}>
                {elem.label}
              </option>
            ))}
          </select>
          {props.iconLeft ? (
            <span className="icon is-left">
              <i className={`fas fa-${props.iconLeft}`} />
            </span>
          ) : null}
        </div>
      </div>
      {!isValid ? (
        <div className={'help is-danger'}>
          {props.errors.map((message, i) => (
            <p key={i}>{message}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default Select;
