import withLayout from '../components/layout';
import ProfileCard from '../components/profile_card';
import Loading from '../components/loading';
import Link from 'next/link';

const getTargetedGenders = (gender, sexuality) => {
  if (sexuality === 1) {
    return gender === 1 ? [2] : [1];
  } else if (sexuality === 2) {
    return [gender];
  } else return [1, 2];
};

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loading: true, users: [], profile: {}, interests: [] };
    this.updateUserList = this.updateUserList.bind(this);
  }

  updateUserList(offset) {
    fetch(
      `/api/users?genders=${getTargetedGenders(
        this.state.profile.gender,
        this.state.profile.sexuality
      )}&lat=${this.state.profile.lat}&long=${this.state.profile.long}`,
      {
        method: 'GET',
        credentials: 'same-origin'
      }
    ).then(async res => {
      if (res.status === 200) {
        const users = await res.json();
        let minDist = Infinity;
        let maxDist = 0;
        for (let i = 0; i < users.length; i++) {
          if (users[i].distance > maxDist) maxDist = users[i].distance;
          if (users[i].distance < minDist) minDist = users[i].distance;
        }
        const level = (maxDist / 10);
        users.sort((a, b) => {
          let scoreA = -Math.round((a.distance - minDist) / level) * 10;
          let scoreB = -Math.round((b.distance - minDist) / level) * 10;
          a.interests.forEach(interest => {
            for (let i = 0; i < this.state.interests.length; i++) {
              if (this.state.interests[i].id === interest.id) scoreA += 20;
            }
          })
          b.interests.forEach(interest => {
            for (let i = 0; i < this.state.interests.length; i++) {
              if (this.state.interests[i].id === interest.id) scoreB += 20;
            }
          })
          a.distance > b.distance ? scoreB++ : scoreA++;
          return scoreB - scoreA;
        });
        this.setState({ users, loading: false });
      }
    });
  }

  async componentDidMount() {
    const urls = [`/api/profile/${this.props.user.id}`, `/api/profile/interests/${this.props.user.id}`];
    const promises = urls.map(url => fetch(url, { method: 'GET', credentials: 'same-origin' }));
    const results = await Promise.all(promises);
    if (results.every(res => res.status === 200)) {
      const profile = await results[0].json();
      const interests = await results[1].json();
      if (Object.keys(profile).length > 0)
        this.setState({ profile, interests }, () => this.updateUserList(0));
      else this.setState({ unauthorized: true })
    }
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
        {!this.state.loading && !this.state.unauthorized ?
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
                />
              </div>
            ))}
          </div>
          : this.state.unauthorized ?
            <div>Hi {this.props.user.username} 👋, in order to see the other users on the app you first need to give some informations about you <Link href="/profile"><a>here</a></Link></div>
            : <Loading />}
      </div>
    );
  }
}

export default withLayout(Home, true);
