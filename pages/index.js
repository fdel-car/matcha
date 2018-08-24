import withLayout from '../components/layout';

class Home extends React.Component {
  render() {
    return (
      <div className="container">
        <p>Hi {this.props.user.username}</p>
      </div>
    );
  }
}

export default withLayout(Home, true);
