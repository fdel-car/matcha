import Link from 'next/link';
import Layout from '../components/layout';
import RedirectDelayed from '../components/redirect_delayed';
import fetch from 'isomorphic-fetch';

const assignClass = (statusCode) => {
  switch (statusCode) {
    case 200:
      return 'is-success';
    case 403:
      return 'is-warning';
    default:
      return 'is-danger';
  }
}

class Verify extends React.Component {
  static async getInitialProps({ req, query }) {
    if (!query || !query.email || !query.token) return {};
    const baseUrl = req ? `${req.protocol}://${'localhost:3000'/* req.get('Host') */}` : ''; // See 'Host header attack'
    const res = await fetch(baseUrl + '/api/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(query)
    })
    if (res.status === 200) return { statusCode: res.status };
    if (res.status === 400 || res.status === 403) {
      const json = await res.json();
      return { error: json.error, statusCode: res.status, email: query.email }
    }
    return {} // error 500 in this case, check server logs
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
      body: JSON.stringify({ email: this.props.email })
    })
    if (res.status === 200) this.setState({ emailSentAgain: true })
    if (res.status === 400 || res.status === 403) {
      const json = await res.json();
      console.error(json);
    } // else error 500, check server logs
  }

  render() {
    return (
      <Layout anon={true}>
        <div className="card">
          <div className="card-content">
            <div style={{ display: 'flex' }} >
              <figure style={{ marginRight: '10px' }} className="image is-64x64">
                <img src="/file/logo.gif" />
              </figure>
              <div>
                <h1 className="title">Hey there 👋</h1>
                <h1 className="subtitle">
                  {this.props.statusCode === 200 ?
                    <span>Your email address is now verified! <i className="fas fa-check"></i> </span> : <span>We could not verify this email...</span>}
                </h1>
              </div>
            </div>
            {/* Add a display when nothing is in the url, AKA no props */}
            <div className={`bordered-notification ${assignClass(this.props.statusCode)}`}>
              {this.props.statusCode === 200 ?
                <div>
                  <p>It's all good, you are ready to go. You can now <Link href="/login"><a>login here</a></Link> without any further step.</p>
                  <RedirectDelayed
                    delay={10000}
                    url={'/login'}
                  />
                </div> : <p>{this.props.error}<br />{this.props.error.includes('invalid') ?
                  this.state.emailSentAgain ? <span>Another email with a new token has been sent to {this.props.email}</span>
                    : <span>If you feel the need to, you can <a onClick={this.sendEmail.bind(this)}>resend the confirmation email.</a> But be sure to check your spam folder first!</span>
                  : <span>You can try to <Link href="/login"><a>login here</a></Link>.</span>}</p>}
            </div>
          </div>
        </div>
      </Layout>
    );
  }
}

export default Verify;
