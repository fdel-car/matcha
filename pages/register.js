import Link from 'next/link';
import withLayout from '../components/layout';
import Field from '../components/field';
import RedirectDelayed from '../components/redirect_delayed';
import { formState, formReady } from '../components/helpers/form_handler';
const {
  validateName,
  validateUsername,
  validateEmail,
  validatePassword,
  confirmPassword
} = require('../components/helpers/validation');
const sjcl = require('../sjcl');

const rules = {
  first_name: { validation: validateName, required: true },
  last_name: { validation: validateName, required: true },
  email: { validation: validateEmail, required: true },
  username: { validation: validateUsername, required: true },
  password: { validation: validatePassword, required: true },
  confirm_password: { validation: confirmPassword, required: true }
};

class Register extends React.Component {
  constructor(props) {
    super(props);
    this.state = formState(rules);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    console.log('Password list is loading...');
    fetch('/file/breached.txt').then(async response => {
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
    if (formReady(rules, this.state) || this.state.noSubmit) return;
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
        const clone = this.state[json.fieldName].errors.slice();
        if (!clone.includes(json.error)) clone.push(json.error);
        this.setState(prevState => {
          return {
            [json.fieldName]: { ...prevState[json.fieldName], errors: clone },
            noSubmit: false
          };
        });
      }
    });
  }

  handleChange(event) {
    const target = event.target;
    let errors = [];
    // Need to review this else if mess
    if (rules[target.name].validation) {
      const validate = rules[target.name].validation;
      if (target.name === 'confirm_password')
        errors = validate(this.state.password.value)(target.value);
      else if (target.name === 'password') {
        errors = validate(this.state.list)(target.value);
        this.setState(prevState => {
          return {
            confirm_password: {
              ...prevState.confirm_password,
              errors: rules['confirm_password'].validation(target.value)(
                prevState.confirm_password.value
              )
            }
          };
        });
      } else errors = validate(target.value);
    }
    this.setState({ [target.name]: { value: target.value, errors } });
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
                    errors={this.state.first_name.errors}
                  />
                  <Field
                    placeholder="e.g. Gilbert"
                    label="Last Name"
                    type="text"
                    name="last_name"
                    autoComplete="family-name"
                    onChange={this.handleChange}
                    value={this.state.last_name.value}
                    errors={this.state.last_name.errors}
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
                errors={this.state.username.errors}
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
                errors={this.state.email.errors}
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
                errors={this.state.password.errors}
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
                errors={this.state.confirm_password.errors}
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
                  formReady(rules, this.state) || this.state.noSubmit
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
