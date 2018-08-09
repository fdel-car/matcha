import Link from 'next/link';
import Layout from '../components/layout';
import RedirectDelayed from '../components/redirect_delayed';
import fetch from 'isomorphic-fetch';

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
    if (res.status === 200) return { emailVerified: true, class: 'is-success' };
    if (res.status === 403) return { emailVerified: false, class: 'is-warning' };
    if (res.status === 400) {
      const json = await res.json();
      return { emailVerified: false, error: json.error }
    }
    return {} // error 500 in this case, check server logs
  }

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    console.log(this.props)

    return (
      <Layout anon={true}>
        <div className="card">
          <div className="card-content">
            <div style={{ display: 'flex' }} >
              <figure style={{ marginRight: '10px' }} className="image is-64x64">
                <img src="/file/logo.gif" />
              </figure>
              <div>
                <h1 className="title is-4">Hi there ✋</h1>
                <h1 className="subtitle is-6">
                  {this.props.emailVerified ?
                    <span>Email verified! <i class="fas fa-check"></i> </span> : <span>
                      Failed to verify the email... <i style={{ verticalAlign: 'text-bottom' }} class="fas fa-times"></i>
                    </span>}
                </h1>
              </div>
            </div>
            <div className={`bordered-notification ${this.props.class || 'is-danger'}`}>
              {/* Use the props to choose the correct message to display */}
              {this.props.emailVerified.toString()}
            </div>
          </div>
        </div>
      </Layout>
    );
  }
}

export default Verify;
