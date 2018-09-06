import withLayout from '../components/layout';

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    fetch(`/api/users`, { method: 'GET', credentials: 'same-origin' }).then(
      async res => {
        console.log(res);
        if (res.status === 200) {
          const users = await res.json();
          console.log(users);
        }
      }
    );
  }

  render() {
    return (
      <div className="container">
        <p>Hi {this.props.user.username}</p>
      </div>
    );
  }
}

export default withLayout(Home, true);
