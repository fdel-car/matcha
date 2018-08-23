import Link from 'next/link';
import Router from 'next/router';

const NavigationItem = props => (
  <Link
    href={props.pathname}
    shallow={Router.pathname === props.pathname ? true : false}
  >
    <a
      className={
        'navbar-item' + (Router.pathname === props.pathname ? ' is-active' : '')
      }
    >
      {props.label}
    </a>
  </Link>
);

class NavigationBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = { mobileMenuOpen: false };
    this.openMobileMenu = this.openMobileMenu.bind(this);
    this.logout = this.logout.bind(this);
  }

  openMobileMenu() {
    this.setState(prevState => {
      return {
        mobileMenuOpen: prevState.mobileMenuOpen ? false : true
      };
    });
  }

  logout() {
    fetch('/api/logout', { method: 'GET' }).then(res => {
      window.localStorage.removeItem('xsrfToken');
      Router.push('/login');
    });
  }

  render() {
    return (
      <div className="navbar is-transparent is-fixed-top">
        <div className="container">
          <div className="navbar-brand">
            <Link href="/">
              <a className="navbar-item">
                <img
                  src="/file/logo.png"
                  alt="Matcha: your love is awaiting."
                  width="112"
                  height="28"
                />
              </a>
            </Link>
            <a
              role="button"
              className={
                'navbar-burger' +
                (this.state.mobileMenuOpen ? ' is-active' : '')
              }
              aria-label="menu"
              aria-expanded="false"
              onClick={this.openMobileMenu}
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </a>
          </div>
          <div
            className={
              'navbar-menu' + (this.state.mobileMenuOpen ? ' is-active' : '')
            }
          >
            <div className="navbar-start">
              <NavigationItem label="Browse" pathname="/" />
            </div>
            <div className="navbar-end">
              <div className="navbar-item">
                <div className="field is-grouped">
                  <p className="control">
                    <a className="button" onClick={this.logout}>
                      <span className="icon">
                        <i className="fas fa-sign-out-alt" aria-hidden="true" />
                      </span>
                      <span>Logout</span>
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default NavigationBar;
