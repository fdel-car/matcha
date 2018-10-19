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
      <i
        className={'icon fas ' + props.icon}
        style={{
          marginRight: '0.25rem',
          position: !props.has_overlay || 'relative'
        }}
      >
        {props.has_overlay ? (
          <div
            className={`circle ${
              props.socket && props.socket.connected
                ? 'is-success'
                : 'is-danger'
              } ${props.label.toLowerCase()}`}
          >
            {props.overlay_count || null}
          </div>
        ) : null}
      </i>
      {props.label}
    </a>
  </Link>
);

class NavigationBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = { mobileMenuOpen: false, notification_count: 0 };
    this.toggleMobileMenu = this.toggleMobileMenu.bind(this);
    this.logout = this.logout.bind(this);
  }

  toggleMobileMenu() {
    this.setState(prevState => {
      return {
        mobileMenuOpen: prevState.mobileMenuOpen ? false : true
      };
    });
  }

  logout() {
    fetch('/api/logout', { method: 'GET', credentials: 'same-origin' }).then(
      res => {
        window.localStorage.removeItem('xsrfToken');
        this.props.disconnectUser();
      }
    );
  }

  getNotificationCount = () => {
    fetch('/api/notification_count', {
      method: 'GET',
      credentials: 'same-origin'
    }).then(async res => {
      if (res.status == 200 && !this.isUnmounted) {
        const json = await res.json();
        this.setState({ notification_count: json.count });
      }
    });
  };

  componentDidMount() {
    this.getNotificationCount();
    this.props.socket.on('reset-notification-count', () => {
      this.setState({ notification_count: 0 });
    });
    this.props.socket.on('new-notification', () => {
      if (Router.pathname !== '/notifications' && !this.isUnmounted) this.getNotificationCount();
    });
  }

  componentWillUnmount() {
    this.isUnmounted = true;
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
                  alt="Matcha logo"
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
              onClick={this.toggleMobileMenu}
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
              <NavigationItem icon="fa-home" label="Home" pathname="/" />
              <NavigationItem
                icon="fa-user-alt"
                label="Profile"
                pathname="/profile"
                has_overlay={true}
                socket={this.props.socket}
              />
              <NavigationItem
                icon="fas fa-bell"
                label="Notifications"
                pathname="/notifications"
                has_overlay={this.state.notification_count > 0 ? true : false}
                overlay_count={this.state.notification_count}
              />
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
