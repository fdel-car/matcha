import React from 'react';
import App, { Container } from 'next/app';
import Head from 'next/head';
import Router from 'next/router';
import Loading from '../components/loading';
import NavigationBar from '../components/navigation_bar';
import '../public/scss/style.scss';
import io from 'socket.io-client';

export default class Matcha extends App {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      loadingPage: false,
      authVerified: false
    };
    this.validateUser = this.validateUser.bind(this);
    this.storageListener = this.storageListener.bind(this);
    this.socket = null;
  }

  async validateUser(protectedPage, pathname) {
    if (!window.localStorage.getItem('xsrfToken')) {
      if (protectedPage) Router.push('/login');
      return null;
    }
    const res = await fetch('/api/user', {
      method: 'GET',
      credentials: 'same-origin'
    });
    if (res.status === 200) return await res.json();
    return null;
  }

  handleRouteChange = url => {
    const loadingPage = !this.state.authVerified ? true : false;
    console.debug(`Starting to load ${url}...`);
    if (loadingPage !== this.state.loadingPage) this.setState({ loadingPage });
  };

  disconnectUser = async () => {
    this.socket.close();
    this.setState({ user: null });
  };

  connectUser = async () => {
    const user = await this.validateUser(
      this.props.pageProps.protectedPage,
      Router.pathname
    );
    this.socket.open();
    this.setState({ user });
  };

  storageListener(event) {
    if (event.isTrusted && event.key === 'xsrfToken') {
      if (event.newValue === null) this.disconnectUser();
      if (event.newValue !== null) this.connectUser();
    }
  }

  async componentDidMount() {
    Router.onRouteChangeStart = url => this.handleRouteChange(url);
    Router.onRouteChangeComplete = () => {
      if (this.state.loadingPage) this.setState({ loadingPage: false });
    };
    Router.onRouteChangeError = err => {
      if (err) console.log(err.message);
      if (this.state.loadingPage) this.setState({ loadingPage: false });
    };
    const user = await this.validateUser(
      this.props.pageProps.protectedPage,
      Router.pathname
    );
    this.socket = io({
      autoConnect: false
    });
    this.socket.on('connect', () => {
      console.debug(this.socket.id); // 'G5p5...'
      this.forceUpdate();
    });
    if (user) this.socket.open();
    this.setState({ user, authVerified: true });
    window.addEventListener('storage', this.storageListener, false);
  }

  componentWillUnmount() {
    window.removeEventListener('storage', this.storageListener, false);
  }

  render() {
    const { Component, pageProps } = this.props;
    const user = this.state.user;
    if (!this.state.loadingPage && this.state.authVerified) {
      if (!user && pageProps.protectedPage) Router.push('/login');
      if (user && !user.verified && Router.pathname !== '/verify')
        Router.push('/verify');
      if (user && ['/login', '/register'].includes(Router.pathname))
        Router.push('/');
    }
    return (
      <Container>
        <Head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Matcha</title>
          <link rel="icon" type="image/png" href="/file/favicon.png" />
          <link href="/file/flags.min.css" rel="stylesheet" type="text/css" />
          <link
            rel="stylesheet"
            href="https://use.fontawesome.com/releases/v5.3.1/css/all.css"
            integrity="sha384-mzrmE5qonljUremFsqc01SB46JvROS7bZs3IO2EmfFsd15uHvIt+Y8vEf7N7fWAU"
            crossOrigin="anonymous"
          />
        </Head>
        {(!!user || (this.state.authVerified && !pageProps.protectedPage)) &&
          !this.state.loadingPage ? (
            <>
              {pageProps.protectedPage ? (
                <NavigationBar
                  disconnectUser={this.disconnectUser}
                  socket={this.socket}
                />
              ) : null}
              <section
                className={
                  'section' +
                  (!pageProps.protectedPage
                    ? ' anon-layout'
                    : ' has-navbar-fixed-top')
                }
              >
                <Component
                  connectUser={this.connectUser}
                  {...pageProps}
                  user={user}
                  socket={this.socket}
                />
              </section>
            </>
          ) : (
            <Loading />
          )}
      </Container>
    );
  }
}
