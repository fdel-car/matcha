import withLayout from '../components/layout';
import axios from 'axios';

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
    this.state = { images };
    this.swapImagePosition = this.swapImagePosition.bind(this);
    this.updateAllFilename = this.updateAllFilename.bind(this);
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

  componentDidMount() {
    this.updateAllFilename();
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

  render() {
    return (
      <div className="container">
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
    );
  }
}

export default withLayout(Profile, true);
