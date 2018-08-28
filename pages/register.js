import Link from 'next/link';
import withLayout from '../components/layout';
import Field from '../components/field';
import RedirectDelayed from '../components/redirect_delayed';
const {
  checkName,
  checkUsername,
  checkEmail,
  checkPassword,
  confirmPassword
} = require('../components/verification');
const sjcl = require('../sjcl');

const rules = {
  last_name: checkName,
  first_name: checkName,
  username: checkUsername,
  email: checkEmail,
  password: checkPassword,
  confirm_password: confirmPassword
};

class Register extends React.Component {
  static async getInitialProps({ req }) {
    const baseUrl = req
      ? `${req.protocol}://${'localhost:3000' /* req.get('Host') */}`
      : ''; // See 'Host header attack'
    return { baseUrl };
  }

  constructor(props) {
    super(props);
    let obj = {};
    Object.keys(rules).forEach(key => {
      obj[key] = { value: '', messages: [] };
    });
    this.state = obj;
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    console.log('Password list is loading...');
    fetch(this.props.baseUrl + '/file/breached.txt').then(async response => {
      if (this.isUnmounted) return console.log('Fetch of the list aborted.');
      const list = await response.text();
      if (this.isUnmounted) return console.log('Fetch of the list aborted.');
      this.setState({ list });
      console.log('File loaded and stored.');
    });
  }

  componentWillUnmount() {
    this.isUnmounted = true;
  }

  handleSubmit(event) {
    event.preventDefault();
    if (
      Object.keys(rules).some(
        key => !this.state[key].value || this.state[key].messages.length > 0
      )
    )
      return;
    const bitArray = sjcl.hash.sha256.hash(this.state.password.value);
    const payload = {
      first_name: this.state.first_name.value,
      last_name: this.state.last_name.value,
      username: this.state.username.value,
      email: this.state.email.value,
      password: sjcl.codec.hex.fromBits(bitArray)
    };
    this.setState({ noSubmit: true });
    fetch('/api/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).then(async response => {
      const contentType = response.headers.get('Content-Type').split(' ')[0];
      if (response.status === 200) {
        const message = await response.text();
        this.setState({
          redirectUser: { url: '/login', delay: 5000, message }
        });
      } else if (contentType === 'application/json;') {
        const json = await response.json();
        if (!json.fieldName) return console.error(json.error);
        const clone = this.state[json.fieldName].messages;
        if (!clone.includes(json.error)) clone.push(json.error);
        this.setState(prevState => {
          return {
            [json.fieldName]: { ...prevState[json.fieldName], messages: clone },
            noSubmit: false
          };
        });
      }
    });
  }

  handleChange(event) {
    const target = event.target;
    let messages = [];
    // Need to review this else if mess
    if (rules[target.name]) {
      if (target.name === 'confirm_password')
        messages = rules[target.name](this.state.password.value)(target.value);
      else if (target.name === 'password') {
        messages = rules[target.name](this.state.list)(target.value);
        this.setState(prevState => {
          return {
            confirm_password: {
              ...prevState.confirm_password,
              messages: rules['confirm_password'](target.value)(
                prevState.confirm_password.value
              )
            }
          };
        });
      } else messages = rules[target.name](target.value);
    }
    this.setState({ [target.name]: { value: target.value, messages } });
  }

  render() {
    if (this.props.user) return null;
    return (
      <div className="card">
        <div className="card-content">
          <form onSubmit={this.handleSubmit}>
            <p className="subtitle" style={{ textAlign: 'center' }}>
              Create your account
              <br />
              <small>It's your time to shine.</small>
            </p>
            <div className="fields">
              <div className="field is-horizontal">
                <div className="field-body">
                  <Field
                    placeholder="e.g. Caroline"
                    label="First Name"
                    type="text"
                    name="first_name"
                    autoComplete="given-name"
                    onChange={this.handleChange}
                    value={this.state.first_name.value}
                    messages={this.state.first_name.messages}
                  />
                  <Field
                    placeholder="e.g. Gilbert"
                    label="Last Name"
                    type="text"
                    name="last_name"
                    autoComplete="family-name"
                    onChange={this.handleChange}
                    value={this.state.last_name.value}
                    messages={this.state.last_name.messages}
                  />
                </div>
              </div>
              <Field
                iconLeft="user"
                placeholder="e.g. cgilbert"
                label="Username"
                autoComplete="username"
                name="username"
                type="text"
                onChange={this.handleChange}
                value={this.state.username.value}
                messages={this.state.username.messages}
              />
              <Field
                iconLeft="envelope"
                placeholder="e.g. caroline.gilbert@example.com"
                label="Email"
                name="email"
                autoComplete="email"
                type="email"
                onChange={this.handleChange}
                value={this.state.email.value}
                messages={this.state.email.messages}
              />
              <Field
                iconLeft="lock"
                placeholder="e.g. 2YtGAbO7qXnvFjX2"
                label="Password"
                name="password"
                autoComplete="new-password"
                type="password"
                onChange={this.handleChange}
                value={this.state.password.value}
                messages={this.state.password.messages}
              />
              <Field
                iconLeft="lock"
                placeholder="e.g. 2YtGAbO7qXnvFjX2"
                label="Confirm your password"
                name="confirm_password"
                autoComplete="new-password"
                type="password"
                onChange={this.handleChange}
                value={this.state.confirm_password.value}
                messages={this.state.confirm_password.messages}
              />
            </div>
            {this.state.redirectUser ? (
              <div
                style={{ padding: '0.375rem .75rem' }}
                className="notification is-success"
              >
                <p>{this.state.redirectUser.message}</p>
                <RedirectDelayed
                  delay={this.state.redirectUser.delay}
                  url={this.state.redirectUser.url}
                />
              </div>
            ) : (
              <input
                className="button is-info"
                type="submit"
                value="Sign up!"
                disabled={
                  Object.keys(rules).some(
                    key =>
                      !this.state[key].value ||
                      this.state[key].messages.length > 0
                  ) || this.state.noSubmit
                    ? true
                    : null
                }
              />
            )}
          </form>
          <hr style={{ margin: '0.75rem 0' }} />
          <div style={{ textAlign: 'right' }}>
            Already got an account?{' '}
            <Link href="/login">
              <a>Login here.</a>
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export default withLayout(Register);
