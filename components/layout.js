import Head from 'next/head';
import '../public/scss/style.scss';
import Router from 'next/router';
import Loading from '../components/loading';
import NavigationBar from '../components/navigation_bar';

async function validateUser(protectedPage, pathname) {
  if (!window.localStorage.getItem('xsrfToken')) {
    if (protectedPage) Router.push('/login');
    return null;
  }
  const res = await fetch('/api/user', {
    method: 'GET',
    credentials: 'same-origin'
  });
  if (res.status === 200) {
    const user = await res.json();
    if (!user.verified && pathname !== '/verify') Router.push('/verify');
    else if (
      ['/login', '/register'].includes(pathname)
      // || (pathname === '/verify' && user.verified)
    )
      Router.push('/');
    return user;
  } else if (protectedPage) Router.push('/login');
  return null;
}

function withLayout(Child, protectedPage = false) {
  return class extends React.PureComponent {
    // Keep an eye on that, if children do not update correctly it can be because of that 'PureComponent'
    static async getInitialProps(ctx) {
      let user = null;
      let authVerified = false;
      if (!ctx.req) {
        user = await validateUser(protectedPage, ctx.pathname);
        authVerified = true;
      }
      if (Child.getInitialProps) {
        return { user, ...(await Child.getInitialProps(ctx)), authVerified };
      }
      return { user, authVerified };
    }

    constructor(props) {
      super(props);
      this.state = {
        user: this.props.user,
        loadingPage: false,
        authVerified: false
      };
      this.handleRouteChange.bind(this);
    }

    handleRouteChange(url) {
      console.debug(`Starting to load ${url}...`);
      this.setState({
        loadingPage:
          !this.props.authVerified && !this.state.authVerified ? true : false
      });
    }

    async componentDidMount() {
      Router.onRouteChangeStart = url => this.handleRouteChange(url);
      Router.onRouteChangeComplete = () =>
        this.setState({ loadingPage: false });
      Router.onRouteChangeError = err => {
        if (err) console.log(err.message);
        this.setState({ loadingPage: false });
      };
      if (!this.props.authVerified) {
        const user = await validateUser(protectedPage, Router.pathname);
        this.setState({ user, authVerified: true });
      }
      window.addEventListener(
        'storage',
        function(event) {
          if (event.isTrusted && event.key === 'xsrfToken') {
            if (event.newValue === null) Router.push('/login');
            if (event.newValue !== null) Router.push('/');
          }
        },
        false
      );
    }

    render() {
      const user = this.props.user || this.state.user;
      const authVerified = this.props.authVerified || this.state.authVerified;
      return (
        <>
          <Head>
            <meta charSet="utf-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
            <title>Matcha</title>
            <link rel="icon" type="image/png" href="/file/favicon.png" />
            <link href="file/flags.min.css" rel="stylesheet" type="text/css" />
            <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.3.1/css/all.css" integrity="sha384-mzrmE5qonljUremFsqc01SB46JvROS7bZs3IO2EmfFsd15uHvIt+Y8vEf7N7fWAU" crossOrigin="anonymous" />
            <link rel="stylesheet" href="/_next/static/style.css" />
          </Head>
          {(!!user || (authVerified && !protectedPage)) &&
            !this.state.loadingPage ? (
              <>
                {protectedPage ? <NavigationBar /> : null}
                <section
                  className={
                    'section' +
                    (!protectedPage ? ' anon-layout' : ' has-navbar-fixed-top')
                  }
                >
                  <Child {...this.props} {...this.state} />
                </section>
              </>
            ) : (
              <Loading />
            )}
        </>
      );
    }
  };
}

export default withLayout;
