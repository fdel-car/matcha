// import Link from 'next/link';
import withLayout from '../components/layout';

class Register extends React.Component {
  render() {
    return (
      <div className="container">
        <p>Hi {this.props.user.username}</p>
      </div>
    );
  }
}

export default withLayout(Register, true);
