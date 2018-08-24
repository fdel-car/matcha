import withLayout from '../components/layout';

const Picture = props => (
  <div
    className={'profile-image' + (props.primary ? '' : ' secondary-picture')}
    onClick={() => props.handleClick(props.id)}
  >
    <figure className="image is-square">
      <img src="https://bulma.io/images/placeholders/480x480.png" />
    </figure>
    <input id={props.id} type="file" hidden />
  </div>
);

class Profile extends React.Component {
  constructor(props) {
    super(props);
    this.state = { carouselStart: 2 };
    this.openImgFile = this.openImgFile.bind(this);
    this.updateCarousel = this.updateCarousel.bind(this);
  }

  openImgFile(id) {
    console.log(id);
  }

  carouselPictures(start) {
    const pictures = [];
    for (let id = start; id <= start + 1; id++) {
      pictures.push(
        <Picture
          primary={false}
          key={id}
          id={id}
          handleClick={this.openImgFile}
        />
      );
    }
    return pictures;
  }

  updateCarousel(value) {
    const currentStart = this.state.carouselStart;
    if (
      (currentStart <= 2 && value === -1) ||
      (currentStart >= 4 && value === 1)
    )
      return;
    this.setState(prevState => {
      return { carouselStart: prevState.carouselStart + value };
    });
  }

  render() {
    return (
      <div className="container">
        <div className="columns">
          <div className="column is-two-thirds">
            <div className="columns is-mobile">
              <div className="column is-two-thirds">
                <Picture primary={true} id={1} handleClick={this.openImgFile} />
              </div>
              <div className="column is-one-third">
                <button onClick={() => this.updateCarousel(-1)}>-</button>
                {/* No more not(last-child) now, fix that issue */}
                {this.carouselPictures(this.state.carouselStart)}
                <button onClick={() => this.updateCarousel(1)}>+</button>
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
