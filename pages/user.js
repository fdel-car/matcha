import withLayout from '../components/layout';
import { withRouter } from 'next/router'
import countryList from '../public/other/country-list';

class User extends React.Component {
  constructor(props) {
    super(props);
    this.state = { user: {}, profile: {}, interests: [], images: [] }
  }

  async componentDidMount() {
    const id = this.props.router.query.id;
    const urls = [`/api/user/${id}`, `/api/profile/${id}`, `/api/profile/interests/${id}`, `/api/images/${id}`];
    let promises = urls.map(url => fetch(url, { method: 'GET', credentials: 'same-origin' }));
    const results = await Promise.all(promises);
    if (results.every(res => res.status === 200)) {
      promises = results.map(res => res.json())
      const array = await Promise.all(promises)
      this.setState({ user: array[0], profile: array[1], interests: array[2], images: array[3] });
    }
  }

  render() {
    console.log(this.state)
    return (
      <div className="container">
        <p className="title is-4">{this.state.profile.country ? (
          <>
            <img
              style={{ marginBottom: '-0.25rem' }}
              src="/file/blank.gif"
              className={'flag flag-' + this.state.profile.country.toLowerCase()}
              alt={countryList[this.state.profile.country]}
            />{' '}
          </>
        ) : null}{this.state.user.first_name} {this.state.user.last_name}</p>
        <p className="subtitle is-6">@{this.state.user.username}</p>
        <div className="columns is-mobile is-multiline">
          {this.state.images.map((img, index) =>
            <div
              key={index}
              className="column is-full-tiny is-half-mobile is-one-third-tablet is-one-quarter-widescreen"
            >
              <figure className="image is-square">
                <img
                  className="zoomable"
                  src={`/api/file/protected/${img.filename}`}
                  alt="Large img"
                />
              </figure>
            </div>
          )}
        </div>
        <p className="title is-5">About {this.state.profile.gender === 1 ? 'him' : 'her'}:</p>
        <p>{this.state.profile.bio}</p>
      </div>
    );
  }
}

export default withLayout(withRouter(User), true);
