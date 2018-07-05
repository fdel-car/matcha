class Field extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: '', className: '', error: false, messages: [] };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    const value = event.target.value;
    this.setState({ value });
    if (!this.props.validate) return;
    const { isValid, messages } = this.props.validate(value);
    if (value && !isValid)
      this.setState({
        messages,
        className: ' is-danger',
        error: true
      });
    else
      this.setState({
        messages: value ? messages : [],
        className: value ? ' is-success' : '',
        error: false
      });
  }

  render() {
    const iconLeft = this.props.iconLeft;
    const iconRight =
      this.props.validate &&
      this.state.value &&
      (this.state.error ? '-exclamation-triangle' : '-check');
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
            className={'input' + this.state.className}
            type={this.props.type}
            placeholder={this.props.placeholder}
            value={this.state.value}
            onChange={this.handleChange}
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
        {this.state.messages.length > 0 ? (
          <p className={'help' + this.state.className}>
            {this.state.messages.map(message => <p>{message}</p>)}
          </p>
        ) : null}
      </div>
    );
  }
}

export default Field;
