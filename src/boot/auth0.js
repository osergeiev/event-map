import { createAuth0 } from '@auth0/auth0-vue'

export default async ({ app }) => {
  app.use(
    createAuth0({
      domain: process.env.VUE_APP_AUTH0_DOMAIN,
      clientId: process.env.VUE_APP_AUTH0_CLIENT_ID,
      authorizationParams: {
        redirect_uri: window.location.origin,
      },
    }),
  )
}
