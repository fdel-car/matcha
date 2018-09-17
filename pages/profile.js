import withLayout from '../components/layout';
import ProfileCard from '../components/profile_card';
import EditableImage from '../components/editable_image';
import Field from '../components/field';
import Select from '../components/select';
import countryList from '../public/other/country-list';
import { formState, formReady } from '../components/helpers/form_handler';
const {
  validateName,
  validateEmail,
  // validatePassword,
  // confirmPassword,
  validateDate,
  validateBio,
  validateInterest
} = require('../components/helpers/validation');

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
      fetch(`/api/profile/interest/${this.props.user.id}`, {
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
    fetch(`/api/profile/interest/${this.props.user.id}`, {
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
    this.state = { images, ...formState(rules), interests: [] };
    this.swapImagePosition = this.swapImagePosition.bind(this);
    this.updateAllFilename = this.updateAllFilename.bind(this);
    this.updateInterests = this.updateInterests.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.selectChange = this.selectChange.bind(this);
    this.submitProfile = this.submitProfile.bind(this);
  }

  async updateAllFilename() {
    const res = await fetch(`/api/images/${this.props.user.id}`, {
      method: 'GET'
    });
    if (!this.isUnmounted && res.status === 200) {
      const images = await res.json();
      this.setState(prevState => {
        return {
          images: prevState.images.map((img, index) => images[index] || img)
        };
      });
    }
  }

  async updateInterests() {
    fetch(`/api/profile/interests/${this.props.user.id}`, {
      method: 'GET'
    }).then(async res => {
      if (!this.isUnmounted && res.status === 200) {
        const interests = await res.json();
        this.setState({ interests });
      }
    });
  }

  async componentDidMount() {
    this.updateAllFilename();
    fetch(`/api/profile/${this.props.user.id}`, {
      method: 'GET'
    }).then(async res => {
      if (!this.isUnmounted && res.status === 200) {
        const json = await res.json();
        if (!this.isUnmounted && Object.keys(json).length > 0)
          this.setState({
            bio: { value: json.bio, errors: [] },
            gender: { value: json.gender, errors: [] },
            sexuality: { value: json.sexuality, errors: [] },
            birthday: { value: json.birthday, errors: [] },
            country: { value: json.country, errors: [] }
          });
      }
    });
    this.updateInterests();
  }

  componentWillUnmount() {
    this.isUnmounted = true;
  }

  swapImagePosition(a, b) {
    fetch(`/api/images/${this.props.user.id}/swap`, {
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

  handleChange(event) {
    const target = event.target;
    let errors = [];
    // Need to review this else if mess
    if (rules[target.name].validation) {
      const validate = rules[target.name].validation;
      if (target.name === 'confirm_password')
        errors = validate(this.state.password.value)(target.value);
      else if (target.name === 'password') {
        errors = validate(this.state.list)(target.value);
        this.setState(prevState => {
          return {
            confirm_password: {
              ...prevState.confirm_password,
              errors: rules['confirm_password'].validation(target.value)(
                prevState.confirm_password.value
              )
            }
          };
        });
      } else errors = validate(target.value);
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
    fetch(`/api/profile/${this.props.user.id}`, {
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
              <div style={{ textAlign: 'right' }}>
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
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default withLayout(Profile, true);
