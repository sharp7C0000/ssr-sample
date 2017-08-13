import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

// route-level code splitting
const Page1 = () => import('./components/page_a.vue')
const Page2 = () => import('./components/page_b.vue')
const Page3 = () => import('./components/page_c.vue')
const Login = () => import('./components/login.vue')

export function createRouter () {
  return new Router({
    mode: 'history',
    routes: [
      { path: '/page1', name: "p1", component: Page1 },
      { path: '/page2', name: "p2", component: Page2 },
      { path: '/page3', name: "p3", component: Page3 },
      { path: '/login', name: "login", component: Login},
      { path: '/'     , redirect: '/page1' }
    ]
  })
}