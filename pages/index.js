import withLayout from '../components/layout';
import ProfileCard from '../components/profile_card';

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = { users: [] };
    this.updateUserList = this.updateUserList.bind(this);
  }

  updateUserList(offset) {
    fetch(`/api/users?offset=${offset}`, { method: 'GET', credentials: 'same-origin' }).then(
      async res => {
        if (res.status === 200) {
          const users = await res.json();
          this.setState({ users })
          console.log(users);
        }
      }
    );
  }

  componentDidMount() {
    this.updateUserList(0);
  }

  render() {
    return (
      <div className="container">
        <p>Hi {this.props.user.username}</p>
        {this.state.users.map((user, i) =>
          <ProfileCard
            user={{
              ...user,
            }}
          />
        )}
      </div>
    );
  }
}

export default withLayout(Home, true);
