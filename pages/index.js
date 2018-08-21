import Link from 'next/link';
import withLayout from '../components/layout';

class Register extends React.Component {
  render() {
    return (
      <div>
        <p>Hi {this.props.user.username}</p>
        <Link href="/"><a>Refresh</a></Link>
      </div>
    );
  }
}

export default withLayout(Register, true);
