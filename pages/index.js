import withInitialProps from '../components/initial_props';
import ProfileCard from '../components/profile_card';
import Loading from '../components/loading';
import Select from '../components/select';
import Field from '../components/field';
import RangeSlider from '../components/range_slider';
import Link from 'next/link';
import { throttle } from 'throttle-debounce';
import getConfig from 'next/config';
const { validateInterest } = require('../components/helpers/validation');

const { publicRuntimeConfig } = getConfig();

// function toAge(dateString) {
//   let birthday = new Date(dateString).getTime();
//   return (Date.now() - birthday) / 31557600000; // No bitwise operator here in order to keep the precision
// }

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
      scope: {
        minDist: 0,
        maxDist: 100,
        minAge: 20,
        maxAge: 60,
        minPopularity: 0,
        maxPopularity: 100
      },
      limits: {},
      tagFilter: { value: '', errors: [] },
      lists: {}
    };
    this.controller = new AbortController();
    this.updateUserList = this.updateUserList.bind(this);
    this.locateUser = this.locateUser.bind(this);
    this.likeProfile = this.likeProfile.bind(this);
    this.selectChange = this.selectChange.bind(this);
    this.sortBy = this.sortBy.bind(this);
    this.filterBy = throttle(300, this.filterBy);
    this.onRangeChange = this.onRangeChange.bind(this);
    this.tagFilterChange = this.tagFilterChange.bind(this);
  }

  updateUserList() {
    fetch(`/api/users`, {
      method: 'GET',
      signal: this.controller.signal,
      credentials: 'same-origin'
    })
      .then(async res => {
        if (res.status === 400) {
          const json = await res.json();
          if (
            json.error ===
            'Missing latitude and longitude, could not process the request.'
          )
            this.setState({
              loading: false,
              unauthorized: true,
              locationMissing: true
            });
        }
        if (res.status === 200) {
          const obj = await res.json();
          this.state.scope.minDist = Math.floor(obj.limits.min_distance) || 0;
          this.state.scope.maxDist = Math.ceil(obj.limits.max_distance) || 100;
          this.state.scope.minPopularity = obj.limits.min_popularity || 0;
          this.state.scope.maxPopularity = obj.limits.max_popularity || 100;
          this.state.scope.minAge = Math.floor(obj.limits.min_age) || 20;
          this.state.scope.maxAge = Math.ceil(obj.limits.max_age) || 60;
          const deepClone = JSON.parse(JSON.stringify(obj.users));
          const orderedByAge = JSON.parse(JSON.stringify(obj.users));
          orderedByAge.sort(
            (a, b) =>
              Math.abs(a.age - this.state.profile.age) >
                Math.abs(b.age - this.state.profile.age)
                ? 1
                : -1
          );
          const orderedByDistance = JSON.parse(JSON.stringify(obj.users));
          orderedByDistance.sort((a, b) => (a.distance > b.distance ? 1 : -1));
          const orderedByPopularity = JSON.parse(JSON.stringify(obj.users));
          orderedByPopularity.sort(
            (a, b) => (a.popularity < b.popularity ? 1 : -1)
          );
          this.setState({
            users: obj.users,
            lists: {
              default: deepClone,
              age: orderedByAge,
              distance: orderedByDistance,
              popularity: orderedByPopularity
            },
            loading: false
          });
        }
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
      });
  }

  locateUser() {
    this.setState({ loading: true });
    const storeLocation = (lat, long) => {
      fetch(`/api/profile/location`, {
        method: 'POST',
        credentials: 'same-origin',
        signal: this.controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-xsrf-token': window.localStorage.getItem('xsrfToken')
        },
        body: JSON.stringify({ lat, long })
      })
        .then(res => {
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
        })
        .catch(err => {
          if (err.name === 'AbortError') return;
        });
    };
    const locateByIp = async () => {
      try {
        const res = await fetch(
          `https://ipinfo.io?token=${publicRuntimeConfig.ip_info_access_token}`,
          { headers: { Accept: 'application/json' } }
        );
        if (res && res.status === 200) {
          const json = await res.json();
          const loc = json.loc.split(',');
          storeLocation(loc[0], loc[1]);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    };
    const geoSuccess = function(position) {
      storeLocation(position.coords.latitude, position.coords.longitude);
    };
    const geoError = error => {
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
      signal: this.controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-xsrf-token': window.localStorage.getItem('xsrfToken')
      }
    })
      .then(res => {
        const index = this.state.users.findIndex(user => user.id === id);
        if (res.status === 204) {
          this.state.users[index].liked = false;
          this.forceUpdate();
        }
        if (res.status === 201) {
          this.state.users[index].liked = true;
          this.forceUpdate();
        }
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
      });
  }

  async componentDidMount() {
    const urls = [
      `/api/profile/${this.props.user.id}`,
      `/api/profile/interests/${this.props.user.id}`
    ];
    const promises = urls.map(url =>
      fetch(url, {
        method: 'GET',
        signal: this.controller.signal,
        credentials: 'same-origin'
      }).catch(err => {
        if (err.name === 'AbortError') return;
      })
    );
    const results = await Promise.all(promises);
    if (results.every(res => res && res.status === 200)) {
      const profile = await results[0].json();
      const interests = await results[1].json();
      if (Object.keys(profile).length > 0) {
        this.setState({ profile, interests }, () => this.updateUserList());
      } else this.setState({ loading: false, unauthorized: true });
    }
  }

  componentWillUnmount() {
    this.controller.abort();
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
        this.state.users.sort((a, b) => (a.score < b.score ? 1 : -1));
        break;
    }
    this.setState({ sort_by: parameter, users: this.state.users });
  }

  filterBy = limits => {
    let regex;
    if (this.state.tagFilter.value) {
      if (this.state.tagFilter.errors.length !== 0) return;
      regex = new RegExp(`^${this.state.tagFilter.value}`);
    }
    const list = this.state.lists[this.state.sort_by];
    if (!list) return;
    const users = list.filter(user => {
      if (user.distance < limits.lowerDist) return null;
      if (user.distance >= limits.upperDist) return null;
      if (user.age <= limits.lowerAge) return null;
      if (user.age >= limits.upperAge) return null;
      if (user.popularity < limits.lowerPopularity) return null;
      if (user.popularity > limits.upperPopularity) return null;
      if (regex) {
        for (let i = 0; i < user.interests.length; i++) {
          if (regex.test(user.interests[i].label)) return user;
        }
        return null;
      }
      return user;
    });
    if (!this.isUnmounted) this.setState({ users });
  };

  onRangeChange(event) {
    const target = event.target;
    let valueToStore = Number(target.value);
    if (/^upper/.test(target.name)) {
      const lowerEquivalent = target.name.replace('upper', 'lower');
      const minEquivalent = target.name.replace('upper', 'min');
      if (target.dataset.inclusive) {
        if (this.state.limits[lowerEquivalent] > valueToStore)
          valueToStore = this.state.limits[lowerEquivalent];
        if (this.state.scope[minEquivalent] > valueToStore)
          valueToStore = this.state.scope[minEquivalent];
      } else {
        if (this.state.limits[lowerEquivalent] >= valueToStore)
          valueToStore = this.state.limits[lowerEquivalent] + 1;
        if (this.state.scope[minEquivalent] >= valueToStore)
          valueToStore = this.state.scope[minEquivalent] + 1;
      }
    }
    if (/^lower/.test(target.name)) {
      const upperEquivalent = target.name.replace('lower', 'upper');
      const maxEquivalent = target.name.replace('lower', 'max');
      if (target.dataset.inclusive) {
        if (this.state.limits[upperEquivalent] < valueToStore)
          valueToStore = this.state.limits[upperEquivalent];
        if (this.state.scope[maxEquivalent] < valueToStore)
          valueToStore = this.state.scope[maxEquivalent];
      } else {
        if (this.state.limits[upperEquivalent] <= valueToStore)
          valueToStore = this.state.limits[upperEquivalent] - 1;
        if (this.state.scope[maxEquivalent] <= valueToStore)
          valueToStore = this.state.scope[maxEquivalent] - 1;
      }
    }
    this.state.limits[target.name] = valueToStore;
    this.setState({ limits: this.state.limits }, () =>
      this.filterBy(this.state.limits)
    );
  }

  tagFilterChange(event) {
    const value = event.target.value
      .toLowerCase()
      .replace(/^[0-9]*\w/, c => c.toUpperCase());
    this.setState(
      {
        [event.target.name]: { value, errors: validateInterest(value) }
      },
      () => this.filterBy(this.state.limits)
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
            <Field
              iconLeft="search"
              placeholder="e.g. Astronomy"
              label="Interest search"
              type="text"
              name="tagFilter"
              autoComplete="off"
              onChange={this.tagFilterChange}
              value={this.state.tagFilter.value}
              errors={this.state.tagFilter.errors}
            />
          </div>
        </div>
        <div className="columns">
          <div className="column">
            <RangeSlider
              label="Distance limits"
              names={['lowerDist', 'upperDist']}
              values={[
                this.state.limits.lowerDist || this.state.scope.minDist,
                this.state.limits.upperDist || this.state.scope.maxDist
              ]}
              min={this.state.scope.minDist}
              max={this.state.scope.maxDist}
              step="1"
              onChange={this.onRangeChange}
              unit="km"
            />
          </div>
          <div className="column">
            <RangeSlider
              label="Age limits"
              names={['lowerAge', 'upperAge']}
              values={[
                this.state.limits.lowerAge || this.state.scope.minAge,
                this.state.limits.upperAge || this.state.scope.maxAge
              ]}
              min={this.state.scope.minAge}
              max={this.state.scope.maxAge}
              step="1"
              onChange={this.onRangeChange}
              unit="years"
            />
          </div>
          <div className="column">
            <RangeSlider
              label="Popularity limits (inclusives)"
              names={['lowerPopularity', 'upperPopularity']}
              values={[
                this.state.limits.lowerPopularity ||
                this.state.scope.minPopularity,
                this.state.limits.upperPopularity == undefined ? this.state.scope.maxPopularity :
                  this.state.limits.upperPopularity
              ]}
              min={this.state.scope.minPopularity}
              max={this.state.scope.maxPopularity}
              step="1"
              onChange={this.onRangeChange}
              unit={null}
              inclusive={true}
            />
          </div>
          {/* <a className="button"><i className="fas fa-exchange-alt"></i></a> */}
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

export default withInitialProps(Home, true);
