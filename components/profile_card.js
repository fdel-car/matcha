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
        <div className="media-left">
          <figure className="image is-48x48">
            <img
              className="is-rounded"
              src={
                props.img.filename
                  ? `/api/file/protected/${props.img.filename}`
                  : '/file/default.jpg'
              }
              alt="Small img"
            />
          </figure>
        </div>
        <div className="media-content">
          <p className="title is-4">
            {props.user.first_name + ' ' + props.user.last_name}
          </p>
          <p className="subtitle is-6">@{props.user.username}</p>
        </div>
      </div>

      <div className="content">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus nec
        iaculis mauris.
      </div>
    </div>
  </div>
);

export default ProfileCard;
