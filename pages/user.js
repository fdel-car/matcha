import withLayout from '../components/layout';
import { withRouter } from 'next/router'
import countryList from '../public/other/country-list';

const sexualities = ['Heterosexual', 'Homosexual', "Bisexual"];

function toAge(dateString) {
  let birthday = new Date(dateString).getTime();
  return ~~((Date.now() - birthday) / 31557600000);
}

class User extends React.Component {
  constructor(props) {
    super(props);
    this.state = { user: {}, profile: {}, interests: [], images: [], liked: false }
    this.likeProfile = this.likeProfile.bind(this);
  }

  async componentDidMount() {
    const id = this.props.router.query.id;
    const urls = [`/api/user/${id}`, `/api/profile/${id}`, `/api/profile/interests/${id}`, `/api/images/${id}`, `/api/like/${id}`];
    let promises = urls.map(url => fetch(url, { method: 'GET', credentials: 'same-origin' }));
    const results = await Promise.all(promises);
    if (results.every(res => res.status === 200)) {
      promises = results.map(res => res.json())
      const array = await Promise.all(promises)
      this.setState({ user: array[0], profile: array[1], interests: array[2], images: array[3], ...array[4] });
    }
  }

  likeProfile() {
    fetch(`/api/like/${this.state.user.id}`,
      { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'x-xsrf-token': window.localStorage.getItem('xsrfToken') } })
      .then(res => {
        if (!this.isUnmounted && res.status === 204) {
          this.setState({ liked: false });
        }
        if (!this.isUnmounted && res.status === 201) {
          this.setState({ liked: true });
        }
      })
  }

  componentWillUnmount() {
    this.isUnmounted = true;
  }

  render() {
    return (
      <div className="container">
        <div className="field has-addons is-pulled-right">
          <p className="control">
            <a className="button" onClick={this.likeProfile}>
              <span className="icon is-small">
                <i className={`fa${this.state.liked ? 's' : 'r'} fa-heart has-text-danger`}></i>
              </span>
            </a>
          </p>
          <p className="control">
            <a className="button" disabled>
              <span className="icon is-small">
                <i className="far fa-comment"></i>
              </span>
            </a>
          </p>
        </div>
        <p className="title is-4">{this.state.profile.country ? (
          <>
            <img
              style={{ marginBottom: '-0.25rem' }}
              src="/file/blank.gif"
              className={'flag flag-' + this.state.profile.country.toLowerCase()}
              alt={countryList[this.state.profile.country]}
            />{' '}
          </>
        ) : null}{this.state.user.first_name} {this.state.user.last_name}<small> - {toAge(this.state.profile.birthday)}</small></p>
        <p className="subtitle is-6">@{this.state.user.username}</p>
        <div className="columns is-mobile is-multiline">
          {this.state.images.map((img, index) =>
            <div
              key={index}
              className="column is-full-tiny is-half-mobile is-one-third-tablet is-one-quarter-widescreen"
            >
              <figure className="image is-square">
                <img
                  style={{ cursor: 'pointer' }}
                  src={`/api/file/protected/${img.filename}`}
                  alt="Large img"
                />
              </figure>
            </div>
          )}
        </div>
        <div className="content">
          <p className="title is-4">
            <span className="icon">
              <i className="fas fa-info-circle" />
            </span>{' '}
            Everything {this.state.profile.gender === 1 ? 'he' : 'she'} told us
            </p>
          <p className="subtitle is-6">
            Like {this.state.profile.gender === 1 ? 'him' : 'her'} to get a chance to know each other further 😉.
            </p>
          <p style={{ whiteSpace: 'pre-line' }}><b>Bio:</b> {this.state.profile.bio}</p>
          <p><b>Birthday:</b> {new Date(this.state.profile.birthday).toDateString()} 🎂</p>
          <p><b>Sexuality</b>: {sexualities[this.state.profile.sexuality - 1]}</p>
        </div>
      </div>
    );
  }
}

export default withLayout(withRouter(User), true);
