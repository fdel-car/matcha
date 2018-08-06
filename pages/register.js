import Link from 'next/link';
import Layout from '../components/layout';
import Field from '../components/field';
import RedirectDelayed from '../components/redirect_delayed';
import {
  checkName,
  checkUsername,
  checkEmail,
  checkPassword,
  confirmPassword
} from '../components/verification';
const sjcl = require('../sjcl');

const rules = {
  last_name: checkName,
  first_name: checkName,
  username: checkUsername,
  email: checkEmail,
  password: checkPassword,
  confirm_pwd: confirmPassword
};

class Register extends React.Component {
  static async getInitialProps({ req }) {
    const baseUrl = req ? `${req.protocol}://${req.get('Host')}` : '';
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

  async componentDidMount() {
    console.log('Password list is loading...');
    const response = await fetch(this.props.baseUrl + '/breached');
    const list = await response.text();
    console.log('File loaded and stored.');
    this.setState({ list });
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
    fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).then(async response => {
      const contentType = response.headers.get('Content-Type').split(' ')[0];
      if (response.status === 200) {
        response.text().then(text => {
          this.setState({
            redirectUser: { url: '/', delay: 5000, message: text }
          });
        });
      } else if (contentType === 'application/json;')
        response.json().then(json => {
          if (!json.fieldName) return console.error(json.error);
          const clone = this.state[json.fieldName].messages;
          if (!clone.includes(json.error)) clone.push(json.error);
          this.setState({
            [json.fieldName]: {
              ...this.state[json.fieldName],
              messages: clone
            },
            noSubmit: false
          });
        });
    });
  }

  handleChange(event) {
    const target = event.target;
    let messages = [];
    // Need to review this else if mess
    if (rules[target.name]) {
      if (target.name === 'confirm_pwd')
        messages = rules[target.name](this.state.password.value)(target.value);
      else if (target.name === 'password') {
        messages = rules[target.name](this.state.list)(target.value);
        const confirm_pwd = this.state.confirm_pwd;
        this.setState({
          confirm_pwd: {
            ...confirm_pwd,
            messages: rules['confirm_pwd'](target.value)(confirm_pwd.value)
          }
        });
      } else messages = rules[target.name](target.value);
    }
    this.setState({
      [target.name]: { value: target.value, messages }
    });
  }

  render() {
    return (
      <Layout anon={true}>
        <div className="card">
          <div className="card-content">
            <form onSubmit={this.handleSubmit}>
              <p className="subtitle" style={{ textAlign: 'center' }}>
                Create your account
                <br />
                <small>Don't drink your green tea alone anymore.</small>
              </p>
              <div className="fields">
                <div className="field is-horizontal">
                  <div className="field-body">
                    <Field
                      placeholder="e.g. Caroline"
                      label="First Name"
                      type="text"
                      name="first_name"
                      onChange={this.handleChange}
                      value={this.state.first_name.value}
                      messages={this.state.first_name.messages}
                    />
                    <Field
                      placeholder="e.g. Gilbert"
                      label="Last Name"
                      type="text"
                      name="last_name"
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
                  type="password"
                  onChange={this.handleChange}
                  value={this.state.password.value}
                  messages={this.state.password.messages}
                />
                <Field
                  iconLeft="lock"
                  placeholder="e.g. 2YtGAbO7qXnvFjX2"
                  label="Confirm your password"
                  name="confirm_pwd"
                  type="password"
                  onChange={this.handleChange}
                  value={this.state.confirm_pwd.value}
                  messages={this.state.confirm_pwd.messages}
                />
              </div>
              {this.state.redirectUser ? (
                <div
                  style={{ padding: '0.375rem .75rem' }}
                  className="notification is-success"
                >
                  {this.state.redirectUser.message}
                  <RedirectDelayed
                    delay={this.state.redirectUser.delay}
                    url={this.state.redirectUser.url}
                  />
                </div>
              ) : (
                <input
                  className="button is-info"
                  type="submit"
                  value="Let's go!"
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
              <Link href="/">
                <a>Login here.</a>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
}

export default Register;
