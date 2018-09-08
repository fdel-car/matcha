import withLayout from '../components/layout';
import ProfileCard from '../components/profile_card';
import Loading from '../components/loading';

const getTargetedGenders = (gender, sexuality) => {
  if (sexuality === 1) {
    return gender === 1 ? [2] : [1];
  } else if (sexuality === 2) {
    return [gender];
  } else return [1, 2];
};

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loading: true, users: [], profile: {} };
    this.updateUserList = this.updateUserList.bind(this);
  }

  updateUserList(offset) {
    fetch(
      `/api/users?genders=${getTargetedGenders(
        this.state.profile.gender,
        this.state.profile.sexuality
      )}&lat=${this.state.profile.lat}&long=${this.state.profile.long}`,
      {
        method: 'GET',
        credentials: 'same-origin'
      }
    ).then(async res => {
      if (res.status === 200) {
        const users = await res.json();
        users.sort(function(a, b) {
          return a.distance - b.distance; // Need an algo here to order the users...
        });
        console.log(users);
        this.setState({ users, loading: false });
      }
    });
  }

  async componentDidMount() {
    const res = await fetch(`/api/profile/${this.props.user.id}`, {
      method: 'GET',
      credentials: 'same-origin'
    });
    if (res.status === 200) {
      const profile = await res.json();
      this.setState({ profile }, () => this.updateUserList(0));
    }
  }

  render() {
    return (
      <div className="container">
        {!this.state.loading ? (
          <div className="columns is-mobile is-multiline">
            {this.state.users.map(user => (
              <div
                key={user.id}
                className="column is-full-tiny is-half-mobile is-one-third-tablet is-one-quarter-widescreen"
              >
                <ProfileCard
                  img={{ filename: user.filename }}
                  user={{
                    ...user
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <Loading />
        )}
      </div>
    );
  }
}

export default withLayout(Home, true);
