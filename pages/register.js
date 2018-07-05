import Link from 'next/link';
import Layout from '../components/layout';
import Field from '../components/field';
import {
  nameValidator,
  usernameValidator,
  emailValidator,
  passwordValidator
} from '../components/validators';

class Register extends React.Component {
  render() {
    return (
      <Layout anon={true}>
        <div className="card">
          <div className="card-content">
            <form>
              <p className="subtitle" style={{ textAlign: 'center' }}>
                Create your account
                <br />
                <small>Don't drink your green tea alone anymore.</small>
              </p>
              <div className="field is-horizontal">
                <div className="field-body">
                  <Field
                    placeholder="e.g. Caroline"
                    label="First Name"
                    type="text"
                    validate={nameValidator}
                  />
                  <Field
                    placeholder="e.g. Gilbert"
                    label="Last Name"
                    type="text"
                    validate={nameValidator}
                  />
                </div>
              </div>
              <Field
                iconLeft="user"
                placeholder="e.g. cgilbert"
                label="Username"
                type="text"
                validate={usernameValidator}
              />
              <Field
                iconLeft="envelope"
                placeholder="e.g. caroline.gilbert@example.com"
                label="Email"
                type="email"
                validate={emailValidator}
              />
              <Field
                iconLeft="lock"
                placeholder="e.g. 2YtGAbO7qXnvFjX2"
                label="Password"
                type="password"
                validate={passwordValidator}
              />
              <div className="control">
                <input
                  className="button is-primary"
                  type="submit"
                  value="Submit"
                />
              </div>
            </form>
          </div>
        </div>
      </Layout>
    );
  }
}

export default Register;
