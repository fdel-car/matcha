import Link from 'next/link';
import Layout from '../components/layout';
import Field from '../components/field';
import Router from 'next/router';
const {
  checkUsername,
  checkPassword
} = require('../components/verification');
const sjcl = require('../sjcl');

const fields = ['username', 'password'];

const rules = {
  username: checkUsername,
  password: checkPassword
};

class Login extends React.Component {
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

  handleSubmit(event) {
    event.preventDefault();
    if (Object.keys(rules).some(key => !this.state[key].value || this.state[key].messages.length > 0)) return;
    const bitArray = sjcl.hash.sha256.hash(this.state.password.value);
    const payload = {
      username: this.state.username.value,
      password: sjcl.codec.hex.fromBits(bitArray)
    };
    this.setState({ noSubmit: true });
    fetch('/api/authentification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).then(async response => {
      const contentType = response.headers.get('Content-Type').split(' ')[0];
      if (contentType === 'application/json;') {
        const json = await response.json();
        if (response.status === 200) {
          window.localStorage.jwt = json.jwt;
          Router.push('/');
        }
        else {
          const fieldName = json.error.includes('username') ? 'username' : 'password';
          this.setState(prevState => { return { noSubmit: false, [fieldName]: { ...prevState[fieldName], messages: [json.error] } } });
        }
      }
    })
  }

  handleChange(event) {
    const target = event.target;
    let messages = [];
    if (rules[target.name]) {
      if (target.name === 'password') {
        messages = rules[target.name](null)(target.value);
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
                  type="text"
                  onChange={this.handleChange}
                  value={this.state.username.value}
                  messages={this.state.username.messages}
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
              </div>
              <input
                className="button is-info"
                type="submit"
                value="Sign in"
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
      </Layout>
    );
  }
}

export default Login;
