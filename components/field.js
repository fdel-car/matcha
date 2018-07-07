class Field extends React.Component {
  render() {
    const isValid = (this.props.messages || []).length === 0;
    const iconLeft = this.props.iconLeft;
    const iconRight =
      this.props.value && (isValid ? '-check' : '-exclamation-triangle');
    const className = this.props.value
      ? isValid
        ? ' is-success'
        : ' is-danger'
      : '';
    return (
      <div className="field">
        <label className="label">{this.props.label}</label>
        <div
          className={
            'control' +
            (iconLeft ? ' has-icons-left' : '') +
            (iconRight ? ' has-icons-right' : '')
          }
        >
          <input
            className={'input' + className}
            type={this.props.type}
            placeholder={this.props.placeholder}
            value={this.props.value}
            onChange={this.props.onChange}
            name={this.props.name}
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
        {this.props.value && !isValid ? (
          <div className={'help' + className}>
            {this.props.messages.map((message, i) => <p key={i}>{message}</p>)}
          </div>
        ) : null}
      </div>
    );
  }
}

export default Field;
