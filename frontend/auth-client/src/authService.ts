import { AuthenticationDetails, CognitoUser } from "amazon-cognito-identity-js";
import { userPool } from "./cognitoConfig";

export function loginUser(username:string, password:string, callbacks:any) {
  const authDetails = new AuthenticationDetails({
    Username: username,
    Password: password,
  });

  const user = new CognitoUser({
    Username: username,
    Pool: userPool,
  });

  user.authenticateUser(authDetails, {
    onSuccess: (result) => {
      callbacks.onSuccess({
        idToken: result.getIdToken().getJwtToken(),
        accessToken: result.getAccessToken().getJwtToken(),
        refreshToken: result.getRefreshToken().getToken(),
      });
    },

    newPasswordRequired: () => {
      callbacks.onNewPasswordRequired(user);
    },

    onFailure: (error) => {
      callbacks.onFailure(error);
    },
  });
}

export function completeNewPassword(user:CognitoUser, newPassword:string, callbacks:any) {
  user.completeNewPasswordChallenge(
    newPassword,
    {},
    {
      onSuccess: (result) => {
        callbacks.onSuccess({
          idToken: result.getIdToken().getJwtToken(),
          accessToken: result.getAccessToken().getJwtToken(),
          refreshToken: result.getRefreshToken().getToken(),
        });
      },
      onFailure: callbacks.onFailure,
    }
  );
}
