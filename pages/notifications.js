import withInitialProps from '../components/initial_props';
import Link from 'next/link';

function timeSince(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + ` year${interval > 1 ? 's' : ''}`;
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + ` month${interval > 1 ? 's' : ''}`;
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + ` day${interval > 1 ? 's' : ''}`;
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + ` hour${interval > 1 ? 's' : ''}`;
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + ` minute${interval > 1 ? 's' : ''}`;
  return Math.floor(seconds) + ` second${seconds > 1 ? 's' : ''}`;
}

class Notifications extends React.Component {
  constructor(props) {
    super(props);
    this.state = { notifications: [] };
  }

  fetchNotifications = () => {
    fetch('/api/profile/notifications', {
      method: 'GET',
      credentials: 'same-origin'
    }).then(async res => {
      if (res.status == 200) {
        const notifications = await res.json();
        this.setState({ notifications });
      }
    });
  };

  componentDidMount() {
    this.fetchNotifications();
    this.props.socket.on('new-notification', () => {
      this.fetchNotifications();
    });
  }

  render() {
    return (
      <div className="container">
        {this.state.notifications.length > 0 ? (
          this.state.notifications.map(notification => {
            const image = (
              <div style={{ width: '7rem' }} className="column is-narrow">
                <figure className="image is-1by1">
                  <Link href={`/user/${notification.src_uid}`}>
                    <a>
                      <img
                        className="is-rounded"
                        src={
                          '/api/file/protected/' +
                          notification.src_user.filename
                        }
                      />
                    </a>
                  </Link>
                </figure>
              </div>
            );
            const timeAgo = (
              <small style={{ padding: '0.5rem' }} className="is-pulled-right">
                {timeSince(new Date(notification.created_at))} ago.
              </small>
            );
            switch (notification.type) {
              case 'visit':
                return (
                  <div className="columns is-mobile" key={notification.id}>
                    {image}
                    <div className="column" style={{ margin: 'auto' }}>
                      You got visited for the first time by{' '}
                      <Link href={`/user/${notification.src_uid}`}>
                        <a>{notification.src_user.username}</a>
                      </Link>
                      .{timeAgo}
                    </div>
                  </div>
                );
              case 'like':
                return (
                  <div className="columns is-mobile" key={notification.id}>
                    {image}
                    <div className="column" style={{ margin: 'auto' }}>
                      The user{' '}
                      <Link href={`/user/${notification.src_uid}`}>
                        <a>{notification.src_user.username}</a>
                      </Link>{' '}
                      just liked you! Could be interesting don't you think?
                      {timeAgo}
                    </div>
                  </div>
                );
              case 'unlike':
                return (
                  <div className="columns is-mobile" key={notification.id}>
                    {image}
                    <div className="column" style={{ margin: 'auto' }}>
                      You got unliked by{' '}
                      <Link href={`/user/${notification.src_uid}`}>
                        <a>{notification.src_user.username}</a>
                      </Link>
                      , what a loss! No just kidding, who cares?
                      {timeAgo}
                    </div>
                  </div>
                );
              case 'match':
                return (
                  <div className="columns is-mobile" key={notification.id}>
                    {image}
                    <div className="column" style={{ margin: 'auto' }}>
                      It's a match! You and{' '}
                      <Link href={`/user/${notification.src_uid}`}>
                        <a>{notification.src_user.username}</a>
                      </Link>{' '}
                      liked each other :)
                      {timeAgo}
                    </div>
                  </div>
                );
            }
          })
        ) : (
            <div>Nothing worth mentioning happened to your profile :/.</div>
          )}
      </div>
    );
  }
}

export default withInitialProps(Notifications, true);
