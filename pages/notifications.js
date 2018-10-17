import withInitialProps from '../components/initial_props';

class Notifications extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  // Need to load the notifications, set them as seen and then display them in a standard list format
  render() {
    return <div />;
  }
}

export default withInitialProps(Notifications, true);
