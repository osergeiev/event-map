<template>
  <div>
    <q-btn @click="login">Log in</q-btn>
  </div>
</template>
<script>
import { useAuth0 } from '@auth0/auth0-vue'

export default {
  setup() {
    const { loginWithRedirect } = useAuth0()

    return {
      login: () => {
        loginWithRedirect()
      },
    }
  },
}
</script>
