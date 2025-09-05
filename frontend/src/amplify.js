import { Amplify } from "aws-amplify";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "us-east-1_0T8LoEjmQ",
      userPoolClientId: "13nv4ai8cbg027cksfn4651qn9", // SPA client (no secret)
      loginWith: {
        oauth: {
          domain: "us-east-10t8loejmq.auth.us-east-1.amazoncognito.com",
          scopes: ["openid", "email", "profile"],
          redirectSignIn: ["http://localhost:3000/callback"],
          redirectSignOut: ["http://localhost:3000/"],
          responseType: "code", // Authorization Code + PKCE
        },
      },
    },
  },
});
