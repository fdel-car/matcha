import Head from 'next/head';
import '../public/scss/style.scss';
import Router from 'next/router';
import Loading from '../components/loading';

async function validateUser(protectedPage, pathname) {
  const res = await fetch('/api/user/validate', {
    method: 'GET',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'x-xsrf-token': window.localStorage.xsrfToken
    }
  })
  if (res.status === 200) {
    const user = await res.json();
    if (protectedPage && !user.verified && pathname !== '/verify') Router.push('/verify');
    else if (['/login', '/register'].includes(pathname) || (pathname === '/verify' && user.verified)) Router.push('/');
    return user;
  } else if (protectedPage) Router.push('/login');
  return null;
}

function withLayout(Child, protectedPage = false) {
  return class extends React.Component {
    static async getInitialProps(ctx) {
      let user = null;
      let authVerified = false;
      if (!ctx.req) {
        user = await validateUser(protectedPage, ctx.pathname);
        authVerified = true;
      }
      if (Child.getInitialProps) {
        return { user, ...await Child.getInitialProps(ctx), authVerified };
      }
      return { user, authVerified }
    }

    constructor(props) {
      super(props);
      this.state = {};
    }

    async componentDidMount() {
      if (!this.props.authVerified) {
        const user = await validateUser(protectedPage, Router.pathname);
        this.setState({ user, authVerified: true });
      }
    }

    render() {
      const user = this.props.user || this.state.user;
      const authVerified = this.props.authVerified || this.state.authVerified;
      return (
        <div>
          <Head>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Matcha</title>
            <link rel="icon"
              type="image/png"
              href="/file/logo.png" />
            <link
              rel="stylesheet"
              href="https://use.fontawesome.com/releases/v5.1.0/css/all.css"
              integrity="sha384-lKuwvrZot6UHsBSfcMvOkWwlCMgc0TaWr+30HWe3a4ltaBwTZhyTEggF5tJv8tbt"
              crossOrigin="anonymous"
            />
            <link rel="stylesheet" href="/_next/static/style.css" />
          </Head>
          {(user || (authVerified && !protectedPage))
            ?
            <section className={'section' + (!protectedPage ? ' anon-layout' : '')}>
              <Child {...this.props} {...this.state}></Child>
            </section>
            : <Loading></Loading>}
        </div>
      )
    }
  };
}

export default withLayout;
