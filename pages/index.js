import withLayout from '../components/layout';
import ProfileCard from '../components/profile_card';
import Loading from '../components/loading';
import Link from 'next/link';

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      users: [],
      profile: {},
      interests: [],
      unauthorized: false,
      locationMissing: false
    };
    this.updateUserList = this.updateUserList.bind(this);
    this.locateUser = this.locateUser.bind(this);
    this.likeProfile = this.likeProfile.bind(this);
  }

  updateUserList(offset) {
    fetch(
      `/api/users?lat=${this.state.profile.lat}&long=${
        this.state.profile.long
      }&gender=${this.state.profile.gender}&sexuality=${
        this.state.profile.sexuality
      }`,
      {
        method: 'GET',
        credentials: 'same-origin'
      }
    ).then(async res => {
      if (!this.isUnmounted && res.status === 400) {
        const json = await res.json();
        if (
          json.error ===
          'latitude and longitude are both mandatory query parameter.'
        )
          this.setState({
            loading: false,
            unauthorized: true,
            locationMissing: true
          });
      }
      if (!this.isUnmounted && res.status === 200) {
        const users = await res.json();
        let minDist = Infinity;
        let maxDist = 0;
        for (let i = 0; i < users.length; i++) {
          if (users[i].distance > maxDist) maxDist = users[i].distance;
          if (users[i].distance < minDist) minDist = users[i].distance;
        }
        const level = maxDist / 10;
        users.sort((a, b) => {
          let scoreA = -Math.round((a.distance - minDist) / level) * 10;
          let scoreB = -Math.round((b.distance - minDist) / level) * 10;
          a.interests.forEach(interest => {
            for (let i = 0; i < this.state.interests.length; i++) {
              if (this.state.interests[i].id === interest.id) scoreA += 20;
            }
          });
          b.interests.forEach(interest => {
            for (let i = 0; i < this.state.interests.length; i++) {
              if (this.state.interests[i].id === interest.id) scoreB += 20;
            }
          });
          if (a.distance !== b.distance)
            a.distance > b.distance ? scoreB++ : scoreA++;
          if (a.popularity !== b.popularity)
            a.popularity > b.popularity ? (scoreA += 5) : (scoreB += 5);
          return scoreB - scoreA;
        });
        if (!this.isUnmounted) this.setState({ users, loading: false });
      }
    });
  }

  locateUser() {
    this.setState({ loading: true });
    const storeLocation = (lat, long) => {
      fetch(`/api/profile/location/${this.props.user.id}`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'x-xsrf-token': window.localStorage.getItem('xsrfToken')
        },
        body: JSON.stringify({ lat, long })
      }).then(res => {
        if (res.status === 204) {
          this.state.profile.lat = lat;
          this.state.profile.long = long;
          this.setState(
            {
              profile: this.state.profile,
              unauthorized: false,
              locationMissing: false
            },
            () => this.updateUserList(0)
          );
        }
      });
    };
    const locateByIp = async () => {
      const res = await fetch(
        `https://ipinfo.io?token=${process.env.ACCESS_TOKEN}`,
        { headers: { Accept: 'application/json' } }
      );
      if (res.status === 200) {
        const json = await res.json();
        const loc = json.loc.split(',');
        storeLocation(loc[0], loc[1]);
      }
    };
    const geoSuccess = function(position) {
      storeLocation(position.coords.latitude, position.coords.longitude);
    };
    const geoError = function(error) {
      console.debug(error);
      locateByIp();
    };
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
    else locateByIp();
  }

  likeProfile(event, id) {
    event.preventDefault();
    fetch(`/api/like/${id}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'x-xsrf-token': window.localStorage.getItem('xsrfToken')
      }
    }).then(res => {
      const index = this.state.users.findIndex(user => user.id === id);
      if (!this.isUnmounted && res.status === 204) {
        this.state.users[index].liked = false;
        this.forceUpdate();
      }
      if (!this.isUnmounted && res.status === 201) {
        this.state.users[index].liked = true;
        this.forceUpdate();
      }
    });
  }

  async componentDidMount() {
    const urls = [
      `/api/profile/${this.props.user.id}`,
      `/api/profile/interests/${this.props.user.id}`
    ];
    const promises = urls.map(url =>
      fetch(url, { method: 'GET', credentials: 'same-origin' })
    );
    const results = await Promise.all(promises);
    if (!this.isUnmounted && results.every(res => res.status === 200)) {
      const profile = await results[0].json();
      const interests = await results[1].json();
      if (Object.keys(profile).length > 0)
        this.setState({ profile, interests }, () => this.updateUserList(0));
      else this.setState({ loading: false, unauthorized: true });
    }
  }

  componentWillUnmount() {
    this.isUnmounted = true;
  }

  render() {
    return (
      <div className="container">
        <p className="title is-4">
          <span className="icon">
            <i className="far fa-lightbulb" />
          </span>{' '}
          Suggestions
        </p>
        <p className="subtitle is-6">
          Some users who might interest you based on your location and hobbies.
        </p>
        {!this.state.loading && !this.state.unauthorized ? (
          this.state.users.length === 0 ? (
            <div>It seems that there is no one matching your criteria 😕.</div>
          ) : (
            <div className="columns is-mobile is-multiline">
              {this.state.users.map(user => (
                <div
                  key={user.id}
                  className="column is-full-tiny is-half-mobile is-one-third-tablet is-one-quarter-widescreen"
                >
                  <ProfileCard
                    img={{ filename: user.filename }}
                    user={{
                      ...user
                    }}
                    likeProfile={this.likeProfile}
                  />
                </div>
              ))}
            </div>
          )
        ) : !this.state.loading && this.state.unauthorized ? (
          this.state.locationMissing ? (
            <div>
              Hey {this.props.user.username} ✌️, in order to see the other
              users on the app you have to{' '}
              <a onClick={this.locateUser}>let us locate you</a>.
            </div>
          ) : (
            <div>
              Hi {this.props.user.username} 👋, in order to see the other users
              on the app you first need to give some informations about you{' '}
              <Link href="/profile">
                <a>here</a>
              </Link>
              .
            </div>
          )
        ) : (
          <Loading />
        )}
      </div>
    );
  }
}

export default withLayout(Home, true);
