import Head from 'next/head';
import '../static/scss/style.scss';

const Layout = props => (
  <section className={'section' + (props.anon ? ' anon-layout' : '')}>
    <Head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Matcha</title>
      <link
        rel="stylesheet"
        href="https://use.fontawesome.com/releases/v5.1.0/css/all.css"
        integrity="sha384-lKuwvrZot6UHsBSfcMvOkWwlCMgc0TaWr+30HWe3a4ltaBwTZhyTEggF5tJv8tbt"
        crossOrigin="anonymous"
      />
      <link rel="stylesheet" href="/static/bulma/bulma.min.css" />
      <link rel="stylesheet" href="/_next/static/style.css" />
    </Head>
    {props.children}
  </section>
);

export default Layout;
