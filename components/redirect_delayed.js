import Router from 'next/router';

class RedirectDelayed extends React.Component {
  constructor(props) {
    super(props);
    this.state = { last: this.props.delay };
  }

  componentDidMount() {
    this.timer = setInterval(this.tick.bind(this), 100);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    console.log('Timer cleared.');
  }

  tick() {
    const remainingDelay = Math.max(this.state.last - 100, 0);
    this.setState({
      last: remainingDelay
    });
    if (remainingDelay === 0) Router.push(this.props.url);
  }

  render() {
    return (
      <p>
        You will be automatically redirected in <i>{(this.state.last / 1000).toFixed(1)}</i>{' '}
        seconds...
      </p>
    );
  }
}

export default RedirectDelayed;
