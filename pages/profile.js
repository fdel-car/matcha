import withLayout from '../components/layout';
import ProfileCard from '../components/profile_card';
import Field from '../components/field';
import Select from '../components/select';
import axios from 'axios';
import countryList from '../public/other/country-list';
const {
  checkName,
  checkEmail,
  // checkPassword,
  // confirmPassword,
  checkBio
} = require('../components/verification');

const rules = {
  last_name: checkName,
  first_name: checkName,
  email: checkEmail,
  bio: checkBio,
  gender: null,
  sexuality: null
};

class EditableImage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.fileChange = this.fileChange.bind(this);
    this.uploadImage = this.uploadImage.bind(this);
    this.imageClick = this.imageClick.bind(this);
    this.displayPreview = this.displayPreview.bind(this);
    this.cancelImageSelection = this.cancelImageSelection.bind(this);
    this.fileInput = React.createRef();
  }

  componentDidMount() {
    this.reader = new FileReader();
    this.reader.addEventListener('load', this.displayPreview);
  }

  componentWillUnmount() {
    this.reader.removeEventListener('load', this.displayPreview);
  }

  displayPreview(event) {
    if (event.isTrusted) {
      if (event.total > 1024 * 1024 * 10)
        this.setState({
          file: null,
          error:
            'The file you choose to upload is too large, the maximum size is 10MB.'
        });
      else this.setState({ base64: event.target.result, error: null });
    }
  }

  fileChange(event) {
    const allowedTypes = ['png', 'jpg', 'jpeg', 'gif', 'ico'];
    const file = event.target.files[0];
    if (!file) return;
    let fileType = file.name.split('.');
    fileType = fileType[fileType.length - 1];
    if (allowedTypes.indexOf(fileType) >= 0) {
      this.reader.readAsDataURL(file);
      this.setState({ file, error: null });
    }
  }

  imageClick() {
    if (!this.props.disable) this.fileInput.current.click();
  }

  cancelImageSelection() {
    this.fileInput.current.value = '';
    this.setState({ file: null, base64: null, error: null });
  }

  async uploadImage(event) {
    event.preventDefault();
    const formData = new FormData();
    formData.set('position', this.props.position);
    formData.set('image', this.state.file);
    axios(`/api/images/${this.props.userId}`, {
      method: 'POST',
      headers: {
        'x-xsrf-token': window.localStorage.getItem('xsrfToken')
      },
      onUploadProgress: event => {
        this.setState({
          file: null,
          progress: { loaded: event.loaded, total: event.total }
        });
      },
      data: formData
    })
      .then(res => {
        this.props.update().then(() => {
          this.setState({
            file: null,
            error: null,
            progress: null,
            base64: null
          });
        });
      })
      .catch(err => {
        this.setState({ error: err.response.data, progress: null });
      });
  }

  render() {
    return (
      <form onSubmit={this.uploadImage}>
        <figure className="image is-square" style={{ position: 'relative' }}>
          <img
            className={
              'profile-picture' + (this.props.disable ? ' upload-disabled' : '')
            }
            onClick={this.imageClick}
            src={
              this.state.base64 ||
              (this.props.img.filename
                ? `/api/file/protected/${this.props.img.filename}`
                : `/file/${
                this.props.position === 1
                  ? 'default.jpg'
                  : `${this.props.position}.png`
                }`)
            }
          />
          <input
            ref={this.fileInput}
            type="file"
            onChange={this.fileChange}
            hidden
          />
          {this.state.progress ? (
            <progress
              className="progress is-info"
              value={this.state.progress.loaded}
              max={this.state.progress.total}
            />
          ) : null}
          {this.state.file ? (
            <div className="centered-div">
              <p className="buttons">
                <button
                  type="button"
                  className="button is-rounded"
                  onClick={this.cancelImageSelection}
                >
                  <span className="icon is-small has-text-danger">
                    <i className="fas fa-times" />
                  </span>
                </button>
                <button className="button is-rounded" type="submit">
                  <span className="icon is-small has-text-success">
                    <i className="fas fa-check" />
                  </span>
                </button>
              </p>
            </div>
          ) : this.props.swap &&
            !this.state.progress &&
            this.props.img.filename ? (
                <button
                  type="button"
                  className="button is-rounded star-button"
                  onClick={() => this.props.swap(this.props.position - 1, 0)}
                >
                  <i className="has-text-warning fas fa-star" />
                </button>
              ) : null}
        </figure>
        {this.state.error ? (
          <div
            className="notification is-danger"
            style={{ padding: '0.25rem 1rem 0.25rem 1rem', borderRadius: '0' }}
          >
            {this.state.error}
          </div>
        ) : null}
      </form>
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
    this.state = {
      images,
      bio: { value: '', messages: [] },
      gender: {
        value: '',
        messages: [
          'You must select a gender in order to be displayed to other people.'
        ]
      },
      sexuality: { value: 3, messages: [] },
      country: {
        value: '',
        messages: []
      },
      first_name: { value: props.user.first_name, messages: [] },
      last_name: { value: props.user.last_name, messages: [] },
      email: { value: props.user.email, messages: [] }
    };
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
      const profile = await res.json();
      this.setState({ bio: { value: profile.bio, messages: [] }, gender: { value: profile.gender, messages: [] }, sexuality: { value: profile.sexuality, messages: [] }, country: { value: profile.country, messages: [] } })
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
      if (res.status === 200)
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
    if (rules[target.name]) {
      if (target.name === 'confirm_password')
        messages = rules[target.name](this.state.password.value)(target.value);
      else if (target.name === 'password') {
        messages = rules[target.name](this.state.list)(target.value);
        this.setState(prevState => {
          return {
            confirm_password: {
              ...prevState.confirm_password,
              messages: rules['confirm_password'](target.value)(
                prevState.confirm_password.value
              )
            }
          };
        });
      } else messages = rules[target.name](target.value);
    }
    this.setState({ [target.name]: { value: target.value, messages } });
  }

  selectChange(event) {
    const target = event.target;
    this.setState({ [target.name]: { value: target.value, messages: [] } });
  }

  submitProfile(event) {
    event.preventDefault();
    if (Object.keys(rules).some(
      key =>
        !this.state[key].value ||
        this.state[key].messages.length > 0
    ) || this.state.noSubmit) return;
    this.setState({ noSubmit: true })
    fetch(`/api/profile/${this.props.user.id}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'x-xsrf-token': window.localStorage.getItem('xsrfToken')
      },
      body: JSON.stringify({ gender: this.state.gender.value, sexuality: this.state.sexuality.value, country: this.state.country.value, bio: this.state.bio.value, email: this.state.email.value, first_name: this.state.first_name.value, last_name: this.state.last_name.value })
    }).then(res => {
      this.setState({ noSubmit: false })
    })
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
                  </div>
                </div>
                <div className="field is-horizontal">
                  <div className="field-body">
                    <Field
                      iconLeft="envelope"
                      placeholder="e.g. caroline.gilbert@example.com"
                      label="Email"
                      type="text"
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
                  textarea={true}
                  placeholder="What did you do study? Where are you from? Don't be shy people will be more inclined to trust you! 😊"
                  label="Bio (tell us about you)"
                  name="bio"
                  type="text"
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
                    Object.keys(rules).some(
                      key =>
                        !this.state[key].value ||
                        this.state[key].messages.length > 0
                    ) || this.state.noSubmit
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
