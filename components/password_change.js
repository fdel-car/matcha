import Field from '../components/field';
import { formState, formReady } from '../components/helpers/form_handler';
const {
  validatePassword,
  confirmPassword
} = require('../components/helpers/validation');
const sjcl = require('../sjcl');

const rules = {
  current_password: { validation: validatePassword, required: true },
  new_password: { validation: validatePassword, required: true },
  confirm_password: { validation: confirmPassword, required: true }
};

class PasswordChangeModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { list: null, modalIsActive: false, ...formState(rules) };
    this.openPasswordModal = this.openPasswordModal.bind(this);
    this.closePasswordModal = this.closePasswordModal.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.submitChange = this.submitChange.bind(this);
  }

  componentWillUnmount() {
    this.isUnmounted = true;
  }

  closePasswordModal() {
    this.setState({ modalIsActive: false });
  }

  openPasswordModal() {
    if (!this.state.list) {
      console.log('Password list is loading...');
      fetch('/file/breached.txt').then(async response => {
        if (this.isUnmounted) return console.log('Fetch of the list aborted.');
        const list = await response.text();
        if (this.isUnmounted) return console.log('Fetch of the list aborted.');
        this.setState({ list });
        console.log('File loaded and stored.');
      });
    }
    this.setState({ modalIsActive: true });
  }

  handleChange(event) {
    const target = event.target;
    let errors = [];
    if (rules[target.name].validation) {
      const validate = rules[target.name].validation;
      if (target.name === 'confirm_password')
        errors = validate(this.state.new_password.value)(target.value);
      else {
        errors = validate(
          target.name === 'new_password' ? this.state.list : null
        )(target.value);
        if (target.name === 'new_password')
          this.setState(prevState => {
            return {
              confirm_password: {
                ...prevState.confirm_password,
                errors: rules['confirm_password'].validation(target.value)(
                  prevState.confirm_password.value
                )
              }
            };
          });
      }
    }
    this.setState({ [target.name]: { value: target.value, errors } });
  }

  submitChange() {
    if (formReady(rules, this.state) || this.state.noSubmit) return;
    const oldBitArray = sjcl.hash.sha256.hash(
      this.state.current_password.value
    );
    const newBitArray = sjcl.hash.sha256.hash(this.state.new_password.value);
    const payload = {
      old_password: sjcl.codec.hex.fromBits(oldBitArray),
      new_password: sjcl.codec.hex.fromBits(newBitArray)
    };
    this.setState({ noSubmit: true });
    fetch('/api/user/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-xsrf-token': window.localStorage.getItem('xsrfToken')
      },
      body: JSON.stringify(payload)
    }).then(async res => {
      const contentType = (res.headers.get('Content-Type') || '').split(' ')[0];
      if (res.status === 401 && contentType === 'application/json;') {
        const json = await res.json();
        this.setState(prevState => {
          return {
            current_password: {
              value: prevState.current_password.value,
              errors: [json.error]
            },
            noSubmit: false
          };
        });
      } else if (res.status === 204)
        this.setState({ noSubmit: false, modalIsActive: false });
    });
  }

  render() {
    return (
      <>
        <div
          className={'modal' + (this.state.modalIsActive ? ' is-active' : '')}
        >
          <div className="modal-background" onClick={this.closePasswordModal} />
          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title">Change your password</p>
              <button
                className="delete"
                aria-label="close"
                onClick={this.closePasswordModal}
              />
            </header>
            <section className="modal-card-body">
              <form>
                <input
                  hidden
                  name="username"
                  value={this.props.user.username}
                  autoComplete="off"
                  readOnly
                />
                <Field
                  iconLeft="lock"
                  placeholder="e.g. 2YtGAbO7qXnvFjX2"
                  label="Current password"
                  type="password"
                  name="current_password"
                  autoComplete="current-password"
                  onChange={this.handleChange}
                  value={this.state.current_password.value}
                  errors={this.state.current_password.errors}
                />
                <Field
                  iconLeft="lock"
                  placeholder="e.g. 7gRBTwOh3JovFl56"
                  label="New password"
                  name="new_password"
                  autoComplete="new-password"
                  type="password"
                  onChange={this.handleChange}
                  value={this.state.new_password.value}
                  errors={this.state.new_password.errors}
                />
                <Field
                  iconLeft="lock"
                  placeholder="e.g. 7gRBTwOh3JovFl56"
                  label="Confirm password"
                  name="confirm_password"
                  autoComplete="new-password"
                  type="password"
                  onChange={this.handleChange}
                  value={this.state.confirm_password.value}
                  errors={this.state.confirm_password.errors}
                />
              </form>
            </section>
            <footer className="modal-card-foot">
              <button
                className="button is-info"
                onClick={this.submitChange}
                disabled={
                  formReady(rules, this.state) || this.state.noSubmit
                    ? true
                    : null
                }
              >
                Save
              </button>
              <button className="button" onClick={this.closePasswordModal}>
                Cancel
              </button>
            </footer>
          </div>
        </div>
        <hr style={{ margin: '0.75rem 0' }} />
        <div className="has-text-right">
          If you need to change your password it's{' '}
          <a onClick={this.openPasswordModal}>here</a>.
        </div>
      </>
    );
  }
}

export default PasswordChangeModal;
