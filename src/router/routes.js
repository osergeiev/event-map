const routes = [
  {
    path: '/',
    component: () => import('pages/MapPage.vue'),
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
