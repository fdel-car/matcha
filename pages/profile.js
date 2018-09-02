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
  validateBio
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
    this.state = { images, ...formState(rules) };
    this.swapImagePosition = this.swapImagePosition.bind(this);
    this.updateAllFilename = this.updateAllFilename.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.selectChange = this.selectChange.bind(this);
    this.submitProfile = this.submitProfile.bind(this);
  }

  async updateAllFilename() {
    const res = await fetch(`/api/images/${this.props.user.id}`, {
      method: 'GET'
    });
    if (res.status === 200) {
      const images = await res.json();
      this.setState(prevState => {
        return {
          images: prevState.images.map((img, index) => images[index] || img)
        };
      });
    }
  }

  async componentDidMount() {
    this.updateAllFilename();
    const res = await fetch(`/api/profile/${this.props.user.id}`, {
      method: 'GET'
    });
    if (res.status === 200) {
      const json = await res.json();
      if (Object.keys(json).length > 0)
        this.setState({
          bio: { value: json.bio, messages: [] },
          gender: { value: json.gender, messages: [] },
          sexuality: { value: json.sexuality, messages: [] },
          birthday: { value: json.birthday, messages: [] },
          country: { value: json.country, messages: [] }
        });
    }
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
    let messages = [];
    // Need to review this else if mess
    if (rules[target.name].validation) {
      const validate = rules[target.name].validation;
      if (target.name === 'confirm_password')
        messages = validate(this.state.password.value)(target.value);
      else if (target.name === 'password') {
        messages = validate(this.state.list)(target.value);
        this.setState(prevState => {
          return {
            confirm_password: {
              ...prevState.confirm_password,
              messages: rules['confirm_password'].validation(target.value)(
                prevState.confirm_password.value
              )
            }
          };
        });
      } else messages = validate(target.value);
    }
    this.setState({ [target.name]: { value: target.value, messages } });
  }

  selectChange(event) {
    const target = event.target;
    this.setState({ [target.name]: { value: target.value, messages: [] } });
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
    }).then(res => {
      this.setState({ noSubmit: false });
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
                country: this.state.country.value
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
                      messages={this.state.first_name.messages}
                    />
                    <Field
                      placeholder="e.g. Gilbert"
                      label="Last Name"
                      type="text"
                      name="last_name"
                      autoComplete="family-name"
                      onChange={this.handleChange}
                      value={this.state.last_name.value}
                      messages={this.state.last_name.messages}
                    />
                    <Field
                      iconLeft="birthday-cake"
                      label="Birthday"
                      type="date"
                      name="birthday"
                      onChange={this.handleChange}
                      value={this.state.birthday.value}
                      messages={this.state.birthday.messages}
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
                      messages={this.state.email.messages}
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
                      messages={this.state.gender.messages}
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
                  messages={this.state.bio.messages}
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
