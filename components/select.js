const Select = props => {
  const isValid = (props.messages || []).length === 0;
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
            (isValid ? '' : ' is-danger')
          }
        >
          <select
            name={props.name}
            onChange={props.onChange}
            defaultValue={props.selected || ''}
          >
            {props.selected ? null : (
              <option hidden disabled value="">
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
          {props.messages.map((message, i) => (
            <p key={i}>{message}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default Select;
