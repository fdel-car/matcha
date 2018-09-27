function withInitialProps(Child, protectedPage = false) {
  return class extends React.PureComponent {
    static async getInitialProps(ctx) {
      let props = {};
      if (Child.getInitialProps) props = await Child.getInitialProps(ctx);
      return { ...props, protectedPage };
    }

    render() {
      return <Child {...this.props} />;
    }
  };
}

export default withInitialProps;
