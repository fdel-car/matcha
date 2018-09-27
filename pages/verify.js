import Link from 'next/link';
import withInitialProps from '../components/initial_props';
import RedirectDelayed from '../components/redirect_delayed';
import nodeFetch from 'node-fetch';
import Router from 'next/router';

const assignClass = statusCode => {
  switch (statusCode) {
    case 204:
      return 'is-success';
    case 403:
      return 'is-warning';
    default:
      return 'is-danger';
  }
};

const ResendEmailBox = props =>
  props.emailSentAgain ? (
    <span>Another email with a new token has been sent to {props.email}</span>
  ) : (
    <span>
      If you feel the need to, you can{' '}
      <a onClick={props.sendEmail}>resend the confirmation email.</a> But be
      sure to check your spam folder first!
    </span>
  );

class Verify extends React.Component {
  static async getInitialProps({ req, query }) {
    if (!query || !query.email || !query.token)
      return {
        error:
          'You received a link in your mailbox (if you registered of course), it will allow us to verify your account.'
      };
    const baseUrl = req ? `${req.protocol}://${req.get('Host')}` : ''; // See 'Host header attack'
    const res = await (baseUrl ? nodeFetch : fetch)(baseUrl + '/api/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(query)
    });
    if (res.status === 204) return { statusCode: res.status };
    if (res.status === 400 || res.status === 403) {
      const json = await res.json();
      return { error: json.error, statusCode: res.status };
    }
    return {
      error: "There seem to be an error coming from the server, we're on it!"
    }; // error 500 in this case, check server logs
  }

  constructor(props) {
    super(props);
    this.state = {};
  }

  async sendEmail(e) {
    e.preventDefault();
    const res = await fetch('/api/verify/resend_email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: this.props.user.email })
    });
    if (res.status === 204) this.setState({ emailSentAgain: true });
    if (res.status === 400 || res.status === 403) {
      const json = await res.json();
      console.error(json);
    } // else error 500, check server logs
  }

  componentWillMount() {
    if (
      this.props.user &&
      this.props.user.verified &&
      this.props.statusCode !== 204
    )
      Router.push('/');
  }

  render() {
    return (
      <div className="card">
        <div className="card-content">
          <div style={{ display: 'flex' }}>
            <figure style={{ marginRight: '10px' }} className="image is-64x64">
              <img src="/file/logo.gif" />
            </figure>
            <div>
              <h1 className="title">Hey there 👋</h1>
              <h1 className="subtitle">
                {this.props.statusCode === 204 ? (
                  <>
                    Your email address is now verified!{' '}
                    <i className="fas fa-check" />{' '}
                  </>
                ) : (
                  <>We could not verify this email...</>
                )}
              </h1>
            </div>
          </div>
          <div
            className={`bordered-notification ${assignClass(
              this.props.statusCode
            )}`}
          >
            {this.props.statusCode === 204 ? (
              <div>
                <p>
                  It's all good, you are ready to go.{' '}
                  {!this.props.user ? (
                    <>
                      You can now{' '}
                      <Link href="/login">
                        <a>login here</a>
                      </Link>{' '}
                      without any further step.
                    </>
                  ) : null}
                </p>
                <RedirectDelayed
                  delay={5000}
                  url={this.props.user ? '/' : '/login'}
                />
              </div>
            ) : (
              <p>
                {this.props.error}
                <br />
                {this.props.user && !this.props.user.verified ? (
                  <ResendEmailBox
                    email={this.props.user.email}
                    emailSentAgain={this.state.emailSentAgain}
                    sendEmail={this.sendEmail.bind(this)}
                  />
                ) : (
                  <>
                    You can try to{' '}
                    <Link href="/login">
                      <a>login here</a>
                    </Link>
                    .
                  </>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default withInitialProps(Verify);
