import countryList from '../public/other/country-list';

function toAge(dateString) {
  let birthday = new Date(dateString).getTime();
  return ~~((Date.now() - birthday) / 31557600000);
}

const ProfileCard = props => (
  <div className="card">
    <div className="card-image">
      <figure className="image is-square">
        <img
          src={
            props.img.filename
              ? `/api/file/protected/${props.img.filename}`
              : '/file/default.jpg'
          }
          alt="Large img"
        />
      </figure>
    </div>
    <div className="card-content">
      <div className="media">
        <div className="media-content">
          <p className="title is-4">
            {props.user.country ? (
              <>
                <img
                  style={{ marginBottom: '-0.2rem' }}
                  src="file/blank.gif"
                  className={'flag flag-' + props.user.country.toLowerCase()}
                  alt={countryList[props.user.country]}
                />{' '}
              </>
            ) : null}
            {props.user.first_name + ' ' + props.user.last_name}
            {props.user.birthday ? (
              <small style={{ fontWeight: 500 }}>
                , {toAge(props.user.birthday)}
              </small>
            ) : null}
          </p>
          <p className="subtitle is-6">@{props.user.username}</p>
        </div>
      </div>
      <div
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 3,
          lineHeight: '1.5rem',
          maxHeight: '4.5rem',
          whiteSpace: 'pre-line',
          fontWeight: 500
        }}
      >
        {props.user.bio ||
          "I sexually Identify as an Attack Helicopter.\nEver since I was a boy I dreamed of soaring over the oilfields dropping hot sticky loads on disgusting foreigners.\nPeople say to me that a person being a helicopter is Impossible and I'm fucking retarded but I don't care, I'm beautiful. I'm having a plastic surgeon install rotary blades, 30 mm cannons and AMG-114 Hellfire missiles on my body. From now on I want you guys to call me \"Apache\" and respect my right to kill from above and kill needlessly. If you can't accept me you're a heliphobe and need to check your vehicle privilege.\nThank you for being so understanding."}
      </div>
      {props.user.interests.length > 0 ? (
        <div>
          {props.user.interests.map((interest, i) => (
            <span key={interest.id}>
              <a>#{interest.label}</a>
              {props.user.interests.length === i + 1 ? '' : ', '}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  </div>
);

export default ProfileCard;
