import withLayout from '../components/layout';
import ProfileCard from '../components/profile_card';
import EditableImage from '../components/editable_image';
import Field from '../components/field';
import Select from '../components/select';
import PasswordChangeModal from '../components/password_change';
import Link from 'next/link';
import countryList from '../public/other/country-list';
import { formState, formReady } from '../components/helpers/form_handler';
import getConfig from 'next/config';
import Loading from '../components/loading';
const {
  validateName,
  validateEmail,
  validateDate,
  validateBio,
  validateInterest
} = require('../components/helpers/validation');

const { publicRuntimeConfig } = getConfig();

const rules = {
  first_name: { validation: validateName, required: true },
  last_name: { validation: validateName, required: true },
  birthday: { validation: validateDate, required: true },
  email: { validation: validateEmail, required: true },
  bio: { validation: validateBio, required: true },
  gender: {
    required: true,
    warnings: [
      'You must select a gender in order to be displayed to other people.'
    ]
  },
  sexuality: { required: true, default: 3 },
  country: {}
};

class InterestsInput extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = { interest: { value: '', errors: [] } };
    this.handleChange = this.handleChange.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.deleteInterest = this.deleteInterest.bind(this);
  }

  handleChange(event) {
    const value = event.target.value
      .toLowerCase()
      .replace(/^[0-9]*\w/, c => c.toUpperCase());
    this.setState({
      [event.target.name]: { value, errors: validateInterest(value) }
    });
  }

  handleKeyPress(event) {
    if (
      event.key === 'Enter' &&
      this.state.interest.value &&
      this.state.interest.errors.length === 0
    ) {
      if (
        this.props.interests
          .map(interest => interest.label)
          .includes(this.state.interest.value)
      ) {
        return this.setState(prevState => {
          const clone = prevState.interest.errors.concat(
            'This interest is already mentioned on your profile.'
          );
          return {
            interest: { value: prevState.interest.value, errors: clone }
          };
        });
      }
      fetch(`/api/profile/interest`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'x-xsrf-token': window.localStorage.getItem('xsrfToken')
        },
        body: JSON.stringify({ interest: this.state.interest.value })
      }).then(res => {
        if (res.status === 204) {
          this.props.updateInterests();
          this.setState({ interest: { value: '', errors: [] } });
        }
      });
    }
  }

  deleteInterest(id) {
    fetch(`/api/profile/interest`, {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'x-xsrf-token': window.localStorage.getItem('xsrfToken')
      },
      body: JSON.stringify({ id })
    }).then(res => {
      if (res.status === 204) this.props.updateInterests();
    });
  }

  render() {
    return (
      <>
        <Field
          placeholder="Css, Skate..."
          label="Interests"
          type="text"
          name="interest"
          onChange={this.handleChange}
          value={this.state.interest.value}
          errors={this.state.interest.errors}
          onKeyPress={this.handleKeyPress}
          autoComplete="off"
        />
        <small>
          For everything related to this field you don't need to click 'Update'
          below, it's saved instantaneously.
        </small>
        {this.props.interests.length > 0 ? (
          <div
            className="field is-grouped is-grouped-multiline"
            style={{ marginTop: '0.75rem' }}
          >
            {this.props.interests.map(interest => (
              <div key={interest.id} className="control">
                <div className="tags has-addons">
                  <span className="tag is-primary has-text-weight-bold">
                    {interest.label}
                  </span>
                  <a
                    onClick={() => this.deleteInterest(interest.id)}
                    className="tag is-delete"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </>
    );
  }
}

const RoundUserPreview = props => (
  <Link as={`/user/${props.user.id}`} href={`/user?id=${props.user.id}`}>
    <a className="card-image">
      <figure className="image is-1by1">
        <img
          title={props.user.username}
          className="is-rounded"
          src={
            props.user.filename
              ? `/api/file/protected/${props.user.filename}`
              : '/file/default.jpg'
          }
        />
      </figure>
    </a>
  </Link>
);

class Profile extends React.Component {
  constructor(props) {
    super(props);
    const images = [];
    for (let index = 0; index < 4; index++) {
      const img = {};
      images.push(img);
    }
    rules.first_name.default = props.user.first_name;
    rules.last_name.default = props.user.last_name;
    rules.email.default = props.user.email;
    this.state = {
      images,
      ...formState(rules),
      interests: [],
      visitors: [],
      likers: [],
      loading: true
    };
    this.swapImagePosition = this.swapImagePosition.bind(this);
    this.updateAllFilename = this.updateAllFilename.bind(this);
    this.updateInterests = this.updateInterests.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.selectChange = this.selectChange.bind(this);
    this.submitProfile = this.submitProfile.bind(this);
    this.initGoogleMap = this.initGoogleMap.bind(this);
    this.locateUser = this.locateUser.bind(this);
    this.controller = new AbortController();
  }

  async updateAllFilename() {
    try {
      const res = await fetch(`/api/images/${this.props.user.id}`, {
        method: 'GET',
        signal: this.controller.signal
      });
      if (res.status === 200) {
        const images = await res.json();
        this.setState(prevState => {
          return {
            images: prevState.images.map((img, index) => images[index] || img)
          };
        });
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }

  updateInterests() {
    fetch(`/api/profile/interests/${this.props.user.id}`, {
      method: 'GET',
      signal: this.controller.signal
    })
      .then(async res => {
        if (res.status === 200) {
          const interests = await res.json();
          this.setState({ interests });
        }
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
      });
  }

  storeLocation = (lat, long) => {
    return fetch(`/api/profile/location`, {
      method: 'POST',
      credentials: 'same-origin',
      signal: this.controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-xsrf-token': window.localStorage.getItem('xsrfToken')
      },
      body: JSON.stringify({ lat, long })
    });
  };

  initGoogleMap() {
    // See why I get two errors instead of just only one
    const { lat, long } = this.state.coords;
    if (!lat || !long) return;
    let latLng = new google.maps.LatLng(lat, long);
    let mapOptions = {
      zoom: 8,
      center: latLng,
      gestureHandling: 'cooperative'
      // mapTypeId: 'hybrid'
    };
    let map = new google.maps.Map(
      document.getElementById('google-map'),
      mapOptions
    );
    const handleEvent = event => {
      const lat = event.latLng.lat();
      const long = event.latLng.lng();
      if (Math.abs(lat) > 85.05115) return;
      this.storeLocation(lat, long)
        .then(res => {
          if (res.status === 200) this.setState({ coords: { lat, long } });
        })
        .catch(err => {
          if (err.name === 'AbortError') return;
        });
    };
    let marker = new google.maps.Marker({
      position: latLng,
      map: map,
      draggable: true,
      title: 'Your position.'
    });
    marker.addListener('dragend', handleEvent);
    let lastValidCenter = map.getCenter();
    google.maps.event.addListener(map, 'dragend', function() {
      if (Math.abs(map.getCenter().lat()) < 85.05115) {
        lastValidCenter = map.getCenter();
        return;
      }
      map.panTo(lastValidCenter);
    });
  }

  isScriptLoaded(url) {
    if (!url) url = 'http://xxx.co.uk/xxx/script.js';
    let scripts = document.getElementsByTagName('script');
    for (let i = scripts.length; i--; ) {
      if (scripts[i].src == url) return true;
    }
    return false;
  }

  loadGoogleMapScript() {
    const url = `https://maps.googleapis.com/maps/api/js?key=${
      publicRuntimeConfig.google_maps_access_token
    }`;
    if (!this.isScriptLoaded(url)) {
      let script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.addEventListener('load', () => {
        this.initGoogleMap();
      });
      document.body.appendChild(script);
    } else this.initGoogleMap();
  }

  async componentDidMount() {
    this.updateAllFilename();
    this.updateInterests();
    const urls = [
      `/api/profile/${this.props.user.id}`,
      '/api/profile/visitors',
      '/api/profile/likers'
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
      const json = await results[0].json();
      const visitors = await results[1].json();
      const likers = await results[2].json();
      if (Object.keys(json).length > 0) {
        this.setState(
          {
            bio: { value: json.bio, errors: [] },
            gender: { value: json.gender, errors: [] },
            sexuality: { value: json.sexuality, errors: [] },
            birthday: { value: json.birthday, errors: [] },
            country: { value: json.country, errors: [] },
            coords: { lat: json.lat, long: json.long },
            visitors,
            likers,
            loading: false,
            locationMissing: !json.lat || !json.long
          },
          () => this.loadGoogleMapScript()
        );
      }
    }
  }

  componentWillUnmount() {
    this.controller.abort();
  }

  swapImagePosition(a, b) {
    fetch(`/api/images/swap`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'x-xsrf-token': window.localStorage.getItem('xsrfToken')
      },
      body: JSON.stringify({ a: a + 1, b: b + 1 })
    }).then(res => {
      if (res.status === 204)
        this.setState(prevState => {
          const swappedImgArray = prevState.images.map(
            (img, index) =>
              index !== a
                ? index !== b
                  ? img
                  : prevState.images[a]
                : prevState.images[b]
          );
          return { images: swappedImgArray };
        });
    });
  }

  locateUser() {
    this.setState({ loading: true });
    const localStoreLocation = (lat, long) =>
      this.storeLocation(lat, long)
        .then(res => {
          if (res.status === 204) {
            this.setState(
              {
                coords: { lat, long },
                locationMissing: false,
                loading: false
              },
              () => this.initGoogleMap()
            );
          }
        })
        .catch(err => {
          if (err.name === 'AbortError') return;
        });
    const locateByIp = async () => {
      try {
        const res = await fetch(
          `https://ipinfo.io?token=${publicRuntimeConfig.ip_info_access_token}`,
          { headers: { Accept: 'application/json' } }
        );
        if (res && res.status === 200) {
          const json = await res.json();
          const loc = json.loc.split(',');
          localStoreLocation(loc[0], loc[1]);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    };
    const geoSuccess = function(position) {
      localStoreLocation(position.coords.latitude, position.coords.longitude);
    };
    const geoError = error => {
      console.debug(error);
      locateByIp();
    };
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
    else locateByIp();
  }

  handleChange(event) {
    const target = event.target;
    let errors = [];
    if (rules[target.name].validation) {
      const validate = rules[target.name].validation;
      errors = validate(target.value);
    }
    this.setState({ [target.name]: { value: target.value, errors } });
  }

  selectChange(event) {
    const target = event.target;
    this.setState({ [target.name]: { value: target.value, errors: [] } });
  }

  submitProfile(event) {
    event.preventDefault();
    if (formReady(rules, this.state) || this.state.noSubmit) return;
    this.setState({ noSubmit: true });
    fetch(`/api/profile`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'x-xsrf-token': window.localStorage.getItem('xsrfToken')
      },
      body: JSON.stringify({
        gender: this.state.gender.value,
        sexuality: this.state.sexuality.value,
        birthday: this.state.birthday.value,
        country: this.state.country.value,
        bio: this.state.bio.value,
        email: this.state.email.value,
        first_name: this.state.first_name.value,
        last_name: this.state.last_name.value
      })
    }).then(async res => {
      this.setState({ noSubmit: false });
      if (res.status === 400) {
        const json = await res.json();
        if (json.fieldName) {
          this.setState({
            [json.fieldName]: {
              value: this.state[json.fieldName].value,
              errors: [json.error]
            }
          });
        }
      }
    });
  }

  render() {
    return (
      <div className="container">
        <div className="columns">
          <div className="column is-two-thirds">
            <p className="title is-4">
              <span className="icon">
                <i className="far fa-images" />
              </span>{' '}
              Pictures selection
            </p>
            <p className="subtitle is-6">
              Select the images that will be displayed on your profile page,
              don't hesitate to play with the order.
            </p>
            <div className="columns">
              <div className="column is-9">
                <EditableImage
                  img={this.state.images[0]}
                  position={1}
                  userId={this.props.user.id}
                  update={this.updateAllFilename}
                />
              </div>
              <div className="column">
                {this.state.images
                  .filter((img, index) => index !== 0)
                  .map((img, index) => (
                    <div key={index} className="secondary-picture">
                      <EditableImage
                        img={img}
                        position={index + 2}
                        userId={this.props.user.id}
                        swap={this.swapImagePosition}
                        update={this.updateAllFilename}
                        disable={!this.state.images[index].filename}
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <div className="column">
            <p className="title is-4">
              <span className="icon">
                <i className="far fa-address-card" />
              </span>{' '}
              Card preview
            </p>
            <p className="subtitle is-6">
              This is how other people will see you on the app!
            </p>
            <ProfileCard
              img={this.state.images[0]}
              user={{
                ...this.props.user,
                first_name: this.state.first_name.value,
                last_name: this.state.last_name.value,
                bio: this.state.bio.value,
                birthday: this.state.birthday.value,
                country: this.state.country.value,
                interests: this.state.interests
              }}
            />
          </div>
        </div>

        <div className="columns">
          <div className="column">
            <p className="title is-4">
              <span className="icon">
                <i className="far fa-eye" />
              </span>{' '}
              Last visits
            </p>
            <p className="subtitle is-6">
              They checked you out! It's your turn now 😏
            </p>
            <div className="columns is-gapless is-mobile">
              {this.state.visitors.length > 0 ? (
                this.state.visitors.map(visitor => (
                  <div key={visitor.id} className="column is-one-fifth">
                    <RoundUserPreview user={visitor} />
                  </div>
                ))
              ) : (
                <p>Hmm, no one... don't cry, time will come.</p>
              )}
            </div>
          </div>
          <div className="column">
            <p className="title is-4">
              <span className="icon">
                <i className="fas fa-grin-hearts" />
              </span>{' '}
              Last likes
            </p>
            <p className="subtitle is-6">
              Those people liked you, don't hesitate, give a look at their
              pages!
            </p>
            <div className="columns is-gapless is-mobile">
              {this.state.likers.length > 0 ? (
                this.state.likers.map(liker => (
                  <div key={liker.id} className="column is-one-fifth">
                    <RoundUserPreview user={liker} />
                  </div>
                ))
              ) : (
                <p>Oups, no one likes you... yet!</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <p className="title is-4">
            <span className="icon">
              <i className="fas fa-globe" />
            </span>{' '}
            Localisation
          </p>
          <p className="subtitle is-6">
            Drag the marker on the map in order to update your localisation.
          </p>
          {this.state.loading ? (
            <Loading />
          ) : this.state.locationMissing ? (
            <div style={{ marginBottom: '1.5rem' }}>
              Hey {this.props.user.username} 😊, we first need to{' '}
              <a onClick={this.locateUser}>locate you</a> in order to display
              the map with your location.
            </div>
          ) : (
            <div id="google-map" />
          )}
        </div>

        <div>
          <p className="title is-4">
            <span className="icon">
              <i className="fas fa-info-circle" />
            </span>{' '}
            Informations
          </p>
          <p className="subtitle is-6">
            Everything you think that people should know about you.
          </p>
          <div className="card">
            <div className="card-content">
              <InterestsInput
                user={this.props.user}
                interests={this.state.interests}
                updateInterests={this.updateInterests}
              />
              <hr />
              <form onSubmit={this.submitProfile}>
                <div className="fields">
                  <div className="field is-horizontal">
                    <div className="field-body">
                      <Field
                        placeholder="e.g. Caroline"
                        label="First Name"
                        type="text"
                        name="first_name"
                        autoComplete="given-name"
                        onChange={this.handleChange}
                        value={this.state.first_name.value}
                        errors={this.state.first_name.errors}
                      />
                      <Field
                        placeholder="e.g. Gilbert"
                        label="Last Name"
                        type="text"
                        name="last_name"
                        autoComplete="family-name"
                        onChange={this.handleChange}
                        value={this.state.last_name.value}
                        errors={this.state.last_name.errors}
                      />
                      <Field
                        iconLeft="birthday-cake"
                        label="Birthday"
                        type="date"
                        name="birthday"
                        onChange={this.handleChange}
                        value={this.state.birthday.value}
                        errors={this.state.birthday.errors}
                      />
                    </div>
                  </div>
                  <div className="field is-horizontal">
                    <div className="field-body">
                      <Field
                        iconLeft="envelope"
                        placeholder="e.g. caroline.gilbert@example.com"
                        label="Email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        onChange={this.handleChange}
                        value={this.state.email.value}
                        errors={this.state.email.errors}
                      />
                      <Select
                        label="Country"
                        name="country"
                        expanded={true}
                        selected={this.state.country.value}
                        errors={this.state.country.errors}
                        onChange={this.selectChange}
                        iconLeft="globe"
                        list={Object.keys(countryList).map(key => {
                          return {
                            label: countryList[key],
                            value: key
                          };
                        })}
                      />
                    </div>
                  </div>
                  <div className="field is-horizontal">
                    <div className="field-body">
                      <Select
                        label="Gender"
                        name="gender"
                        expanded={true}
                        selected={this.state.gender.value}
                        errors={this.state.gender.errors}
                        onChange={this.selectChange}
                        list={[
                          { label: 'Male', value: 1 },
                          { label: 'Female', value: 2 }
                        ]}
                      />
                      <Select
                        label="Sexuality"
                        name="sexuality"
                        expanded={true}
                        selected={this.state.sexuality.value}
                        errors={this.state.sexuality.errors}
                        onChange={this.selectChange}
                        list={[
                          { label: 'Heterosexual', value: 1 },
                          { label: 'Homosexual', value: 2 },
                          { label: 'Bisexual', value: 3 }
                        ]}
                      />
                    </div>
                  </div>
                  <Field
                    placeholder="What did you do study? Where are you from? Don't be shy people will be more inclined to trust you! 😊"
                    label="Bio (tell us about you)"
                    name="bio"
                    type="textarea"
                    onChange={this.handleChange}
                    value={this.state.bio.value}
                    errors={this.state.bio.errors}
                  />
                </div>
                <input
                  className="button is-info"
                  type="submit"
                  value="Update"
                  disabled={
                    formReady(rules, this.state) || this.state.noSubmit
                      ? true
                      : null
                  }
                />
              </form>
              <PasswordChangeModal user={this.props.user} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withLayout(Profile, true);
