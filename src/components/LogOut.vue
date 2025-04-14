<template>
  <div>
    <q-btn style="color: #1976d2; background-color: white" @click="logout">Log out</q-btn>
  </div>
</template>
<script>
import { useAuth0 } from '@auth0/auth0-vue'

export default {
  setup() {
    const { logout } = useAuth0()

    return {
      logout: () => {
        logout({ logoutParams: { returnTo: window.location.origin } })
      },
    }
  },
}
</script>
