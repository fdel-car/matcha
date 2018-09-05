import Link from 'next/link';
import withLayout from '../components/layout';
import Field from '../components/field';
import Router from 'next/router';
import { formState, formReady } from '../components/helpers/form_handler';
const {
  validateUsername,
  validatePassword
} = require('../components/helpers/validation');
const sjcl = require('../sjcl');

const rules = {
  username: { validation: validateUsername, required: true },
  password: { validation: validatePassword, required: true }
};

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = formState(rules);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleSubmit(event) {
    event.preventDefault();
    if (formReady(rules, this.state) || this.state.noSubmit) return;
    const bitArray = sjcl.hash.sha256.hash(this.state.password.value);
    const payload = {
      username: this.state.username.value,
      password: sjcl.codec.hex.fromBits(bitArray)
    };
    this.setState({ noSubmit: true });
    fetch('/api/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).then(async response => {
      const contentType = response.headers.get('Content-Type').split(' ')[0];
      if (contentType === 'application/json;') {
        const json = await response.json();
        if (response.status === 200) {
          try {
            window.localStorage.setItem('xsrfToken', json.xsrfToken);
            Router.push('/');
          } catch (err) {
            console.warning(err.message); // localStorage is most probably full, highly unlikely
          }
        } else {
          const fieldName = json.error.includes('username')
            ? 'username'
            : 'password';
          this.setState(prevState => {
            return {
              noSubmit: false,
              [fieldName]: { ...prevState[fieldName], errors: [json.error] }
            };
          });
        }
      }
    });
  }

  handleChange(event) {
    const target = event.target;
    let errors = [];
    if (rules[target.name].validation) {
      const validate = rules[target.name].validation;
      if (target.name === 'password') {
        errors = validate(null)(target.value);
      } else errors = validate(target.value);
    }
    this.setState({
      [target.name]: { value: target.value, errors }
    });
  }

  render() {
    if (this.props.user) return null;
    return (
      <div className="card">
        <div className="card-content">
          <form onSubmit={this.handleSubmit}>
            <p className="subtitle" style={{ textAlign: 'center' }}>
              Login to your account
              <br />
              <small>What are you waiting for?</small>
            </p>
            <div className="fields">
              <Field
                iconLeft="user"
                placeholder="e.g. cgilbert"
                label="Username"
                name="username"
                autoComplete="username"
                type="text"
                onChange={this.handleChange}
                value={this.state.username.value}
                errors={this.state.username.errors}
              />
              <Field
                iconLeft="lock"
                placeholder="e.g. 2YtGAbO7qXnvFjX2"
                label="Password"
                name="password"
                autoComplete="current-password"
                type="password"
                onChange={this.handleChange}
                value={this.state.password.value}
                errors={this.state.password.errors}
              />
            </div>
            <input
              className="button is-info"
              type="submit"
              value="Sign in"
              disabled={
                formReady(rules, this.state) || this.state.noSubmit
                  ? true
                  : null
              }
            />
          </form>
          <hr style={{ margin: '0.75rem 0' }} />
          <div style={{ textAlign: 'right' }}>
            Not registered already?{' '}
            <Link href="/register">
              <a>Do it here.</a>
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export default withLayout(Login);
