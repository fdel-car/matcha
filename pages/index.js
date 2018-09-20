import withLayout from '../components/layout';
import ProfileCard from '../components/profile_card';
import Loading from '../components/loading';
import Select from '../components/select';
import RangeSlider from '../components/range_slider';
import Link from 'next/link';
import { throttle } from 'throttle-debounce';

function toAge(dateString) {
  let birthday = new Date(dateString).getTime();
  return (Date.now() - birthday) / 31557600000; // No bitwise operator here in order to keep the precision
}

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      users: [],
      profile: {},
      interests: [],
      unauthorized: false,
      locationMissing: false,
      sort_by: 'default',
      scope: {},
      limits: {}
    };
    this.updateUserList = this.updateUserList.bind(this);
    this.locateUser = this.locateUser.bind(this);
    this.likeProfile = this.likeProfile.bind(this);
    this.defaultSort = this.defaultSort.bind(this);
    this.selectChange = this.selectChange.bind(this);
    this.sortBy = this.sortBy.bind(this);
    this.filterBy = throttle(300, this.filterBy);
    this.onRangeChange = this.onRangeChange.bind(this);
  }

  defaultSort() {
    const levelDist =
      (this.state.limits.upperDist || this.state.scope.maxDist) / 10;
    const levelPopularity =
      (this.state.limits.upperPopularity || this.state.scope.maxPopularity) /
      10;
    this.state.users.sort((a, b) => {
      let scoreA =
        -Math.round(
          (a.distance -
            (this.state.limits.lowerDist || this.state.scope.minDist)) /
            levelDist
        ) * 10;
      let scoreB =
        -Math.round(
          (b.distance -
            (this.state.limits.lowerDist || this.state.scope.minDist)) /
            levelDist
        ) * 10;
      if (levelPopularity) {
        scoreA +=
          Math.round(
            (a.popularity -
              (this.state.limits.lowerPopularity ||
                this.state.scope.minPopularity)) /
              levelPopularity
          ) * 2;
        scoreB +=
          Math.round(
            (b.popularity -
              (this.state.limits.lowerPopularity ||
                this.state.scope.minPopularity)) /
              levelPopularity
          ) * 2;
      }
      a.interests.forEach(interest => {
        for (let i = 0; i < this.state.interests.length; i++) {
          if (this.state.interests[i].id === interest.id) scoreA += 15;
        }
      });
      b.interests.forEach(interest => {
        for (let i = 0; i < this.state.interests.length; i++) {
          if (this.state.interests[i].id === interest.id) scoreB += 15;
        }
      });
      scoreA -= Math.abs(a.age - this.state.profile.age);
      scoreB -= Math.abs(b.age - this.state.profile.age);
      if (a.distance !== b.distance)
        a.distance < b.distance ? scoreA++ : scoreB++;
      if (a.popularity !== b.popularity)
        a.popularity > b.popularity ? scoreA++ : scoreB++;
      return scoreA < scoreB ? 1 : -1;
    });
    if (this.state.loading) {
      const deepClone = JSON.parse(JSON.stringify(this.state.users));
      const orderedByAge = JSON.parse(JSON.stringify(this.state.users));
      orderedByAge.sort(
        (a, b) =>
          Math.abs(a.age - this.state.profile.age) >
          Math.abs(b.age - this.state.profile.age)
            ? 1
            : -1
      );
      const orderedByDistance = JSON.parse(JSON.stringify(this.state.users));
      orderedByDistance.sort((a, b) => (a.distance > b.distance ? 1 : -1));
      const orderedByPopularity = JSON.parse(JSON.stringify(this.state.users));
      orderedByPopularity.sort(
        (a, b) => (a.popularity < b.popularity ? 1 : -1)
      );

      return this.setState({
        users: this.state.users,
        lists: {
          default: deepClone,
          age: orderedByAge,
          distance: orderedByDistance,
          popularity: orderedByPopularity
        },
        loading: false
      });
    }
  }

  updateUserList() {
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
        this.state.scope.minDist = Infinity;
        this.state.scope.maxDist = 0;
        this.state.scope.minPopularity = Infinity;
        this.state.scope.maxPopularity = 0;
        this.state.scope.minAge = Infinity;
        this.state.scope.maxAge = 0;
        users.forEach(user => {
          user.age = toAge(user.birthday);
          if (user.popularity > this.state.scope.maxPopularity)
            this.state.scope.maxPopularity = user.popularity;
          if (user.popularity < this.state.scope.minPopularity)
            this.state.scope.minPopularity = user.popularity;
          if (user.distance > this.state.scope.maxDist)
            this.state.scope.maxDist = ~~user.distance;
          if (user.distance < this.state.scope.minDist)
            this.state.scope.minDist = ~~user.distance;
          if (user.age > this.state.scope.maxAge)
            this.state.scope.maxAge = ~~user.age;
          if (user.age < this.state.scope.minAge)
            this.state.scope.minAge = ~~user.age;
        });
        if (!this.isUnmounted)
          this.setState({ users, scope: this.state.scope }, this.defaultSort);
      }
    });
  }

  locateUser() {
    this.setState({ loading: true });
    const storeLocation = (lat, long) => {
      fetch(`/api/profile/location`, {
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
            () => this.updateUserList()
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
      if (Object.keys(profile).length > 0) {
        profile.age = toAge(profile.birthday);
        this.setState({ profile, interests }, () => this.updateUserList());
      } else this.setState({ loading: false, unauthorized: true });
    }
  }

  componentWillUnmount() {
    this.isUnmounted = true;
  }

  selectChange(event) {
    const target = event.target;
    this.sortBy(target.value);
  }

  sortBy(parameter) {
    switch (parameter) {
      case 'distance':
        this.state.users.sort((a, b) => (a[parameter] > b[parameter] ? 1 : -1));
        break;
      case 'popularity':
        this.state.users.sort((a, b) => (a[parameter] < b[parameter] ? 1 : -1));
        break;
      case 'age':
        this.state.users.sort(
          (a, b) =>
            Math.abs(a[parameter] - this.state.profile.age) >
            Math.abs(b[parameter] - this.state.profile.age)
              ? 1
              : -1
        );
        break;
      default:
        this.defaultSort();
        break;
    }
    this.setState({ sort_by: parameter, users: this.state.users });
  }

  filterBy = limits => {
    this.setState({
      users: this.state.lists[this.state.sort_by].filter(user => {
        if (~~user.distance < limits.lowerDist) return null;
        if (~~user.distance > limits.upperDist) return null;
        return user;
      })
    });
  };

  onRangeChange(event) {
    const target = event.target;
    let valueStored = Number(target.value);
    if (/^upper/.test(target.name)) {
      const lowerEquivalent = target.name.replace('upper', 'lower');
      if (this.state.limits[lowerEquivalent] >= valueStored)
        valueStored = this.state.limits[lowerEquivalent] + 1;
    }
    if (/^lower/.test(target.name)) {
      const upperEquivalent = target.name.replace('lower', 'upper');
      if (this.state.limits[upperEquivalent] <= valueStored)
        valueStored = this.state.limits[upperEquivalent] - 1;
    }
    this.state.limits[target.name] = valueStored;
    this.setState({ limits: this.state.limits }, () =>
      this.filterBy(this.state.limits)
    );
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
        <div className="columns">
          <div className="column is-narrow">
            <Select
              label="Sort by"
              name="sort_by"
              selected={this.state.sort_by}
              onChange={this.selectChange}
              list={[
                { label: 'Default', value: 'default' },
                { label: 'Popularity', value: 'popularity' },
                { label: 'Distance', value: 'distance' },
                { label: 'Age', value: 'age' }
              ]}
            />
          </div>
          <div className="column">
            <RangeSlider
              label="Distance range (km)"
              names={['lowerDist', 'upperDist']}
              values={[
                this.state.limits.lowerDist || this.state.scope.minDist || 0,
                this.state.limits.upperDist || this.state.scope.maxDist || 100
              ]}
              max={this.state.scope.maxDist || 100}
              min={this.state.scope.minDist || 0}
              step="1"
              onChange={this.onRangeChange}
            />
            {/* <a className="button"><i className="fas fa-exchange-alt"></i></a> */}
          </div>
        </div>
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
