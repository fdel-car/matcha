import Link from 'next/link';
import Layout from '../components/layout';

const Index = () => (
  <Layout>
    <Link href="/register">
      <a>Register Page</a>
    </Link>
    <p>You're supposed to be connected</p>
  </Layout>
);

export default Index;
