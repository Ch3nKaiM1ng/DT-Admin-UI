import { login, logout, getInfo } from '@/api/user'
import { getToken, setToken, getID, setID, removeToken, removeID } from '@/utils/auth'
import router, { resetRouter } from '@/router'

const state = {
  token: getToken(),
  name: '',
  avatar: '',
  id: getID()
}

const mutations = {
  SET_TOKEN: (state, token) => {
    state.token = token
  },
  SET_NAME: (state, name) => {
    state.name = name
  },
  SET_AVATAR: (state, avatar) => {
    state.avatar = avatar
  },
  SET_ID: (state, id) => {
    state.id = id
  }
}

const actions = {
  // user login
  login({ commit }, userInfo) {
    const { user, password } = userInfo
    return new Promise((resolve, reject) => {
      login({ user: user.trim(), password: password }).then(response => {
        const { data } = response
        commit('SET_TOKEN', data.sessionName)
        setToken(data.sessionName)
        setID(data.obj.id)
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },

  // get user info
  getInfo({ commit, state }) {
    return new Promise((resolve, reject) => {
      getInfo().then(response => {
        const { data } = response
        if (!response) {
          reject('Verification failed, please Login again.')
        }
        const { realName, headImg } = data
        commit('SET_NAME', realName)
        // 用户头像不需要
        commit('SET_AVATAR', headImg)
        commit('SET_ID', data.id)
        setID(data.id)
        resolve(data)
      }).catch(error => {
        reject(error)
      })
    })
  },

  // user logout
  logout({ commit, state }) {
    return new Promise((resolve, reject) => {
      logout().then(() => {
        commit('SET_TOKEN', '')
        commit('SET_ID', '')
        removeToken()
        removeID()
        resetRouter()
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },

  // remove token
  resetToken({ commit }) {
    return new Promise(resolve => {
      commit('SET_TOKEN', '')
      commit('SET_ID', '')
      removeToken()
      removeID()
      resolve()
    })
  },

  // dynamically modify permissions
  changeRoles({ commit, dispatch }, role) {
    return new Promise(async resolve => {
      const token = role + '-token'

      commit('SET_TOKEN', token)
      setToken(token)
      const { roles } = await dispatch('getInfo')

      resetRouter()

      // generate accessible routes map based on roles
      const accessRoutes = await dispatch('permission/generateRoutes', roles, { root: true })

      // dynamically add accessible routes
      router.addRoutes(accessRoutes)

      // reset visited views and cached views
      dispatch('tagsView/delAllViews', null, { root: true })

      resolve()
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}

