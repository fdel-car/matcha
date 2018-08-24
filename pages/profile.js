import withLayout from '../components/layout';
import { METHODS } from 'http';

const CarouselButton = props => (
  <button
    style={props.step === -1 ? { top: 0 } : { bottom: 0 }}
    className="button is-rounded carousel-button"
    onClick={() => props.moveCarousel(props.step)}
  >
    <i className={'fas fa-angle-' + (props.step === -1 ? 'up' : 'down')} />
  </button>
);

const EditablePicture = props => {
  const fileInput = React.createRef();

  function clickOnHiddenField() {
    fileInput.current.click();
  }

  function uploadImageHandler(event) {
    event.preventDefault();
    console.log('uploadImageHandler called!');
  }

  return (
    <div
      className={'profile-image' + (props.primary ? '' : ' secondary-picture')}
      style={{ position: 'relative' }}
    >
      <figure onClick={clickOnHiddenField} className="image is-square">
        <img
          src={
            props.picture
              ? !!props.picture.base64
                ? props.picture.base64
                : `/file/private/${props.picture.filename}`
              : `/file/${props.index}.png`
          }
        />
      </figure>
      <form onSubmit={uploadImageHandler}>
        <input
          ref={fileInput}
          type="file"
          onChange={event => props.handleChange(event, props.index)}
          hidden
        />
        {props.picture && props.picture.file ? (
          <button
            className="button is-rounded"
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              width: 0,
              margin: 'auto'
            }}
            type="submit"
          >
            <i className="fas fa-check" />
          </button>
        ) : null}
      </form>
    </div>
  );
};

class Profile extends React.Component {
  constructor(props) {
    super(props);
    this.state = { carouselStart: 2, pictures: [] };
    this.fileChangeHandler = this.fileChangeHandler.bind(this);
    this.moveCarousel = this.moveCarousel.bind(this);
    this.carouselPictures = this.carouselPictures.bind(this);
  }

  async componentDidMount() {
    const res = await fetch(`/api/pictures/${this.props.user.id}`, {
      method: 'GET'
    });
    if (res.status === 200) {
      const pictures = await res.json();
      this.setState({ pictures });
    }
  }

  fileChangeHandler(event, position) {
    const file = event.target.files[0];
    var reader = new FileReader();
    const allowedTypes = ['png', 'jpg', 'jpeg', 'gif', '.ico'];
    let imgType = file.name.split('.');
    imgType = imgType[imgType.length - 1];
    if (imgType.indexOf(allowedTypes)) {
      reader.addEventListener('load', () => {
        this.setState(prevState => {
          const picture = { file, base64: reader.result, position };
          const index = prevState.pictures.findIndex(
            pic => pic.position === position
          );
          if (index >= 0) prevState.pictures[index] = picture;
          else prevState.pictures.push(picture);
          return { pictures: prevState.pictures };
        });
      });
      reader.readAsDataURL(file);
    }
  }

  carouselPictures() {
    const children = [];
    for (
      let index = this.state.carouselStart;
      index <= this.state.carouselStart + 1;
      index++
    ) {
      children.push(
        <EditablePicture
          primary={false}
          key={index}
          index={index}
          handleChange={this.fileChangeHandler}
          picture={this.state.pictures.find(pic => pic.position === index)}
        />
      );
    }
    return children;
  }

  moveCarousel(step) {
    const currentStart = this.state.carouselStart;
    if ((currentStart <= 2 && step === -1) || (currentStart >= 4 && step === 1))
      return;
    this.setState(prevState => {
      return { carouselStart: prevState.carouselStart + step };
    });
  }

  render() {
    return (
      <div className="container">
        <div className="columns">
          <div className="column is-two-thirds">
            <div className="columns is-mobile">
              <div className="column is-two-thirds">
                <EditablePicture
                  primary={true}
                  index={1}
                  handleChange={this.fileChangeHandler}
                  picture={this.state.pictures.find(pic => pic.position === 1)}
                />
              </div>
              <div
                className="column is-one-third"
                style={{ position: 'relative' }}
              >
                <CarouselButton moveCarousel={this.moveCarousel} step={-1} />
                <div>{this.carouselPictures()}</div>
                <CarouselButton moveCarousel={this.moveCarousel} step={1} />
              </div>
            </div>
          </div>
          <div className="column">
            <h4>{this.props.user.username}</h4>
          </div>
        </div>
      </div>
    );
  }
}

export default withLayout(Profile, true);
