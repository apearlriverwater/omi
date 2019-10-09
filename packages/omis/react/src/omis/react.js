import * as React from 'react'
import { obaa } from './obaa'
import { getPath, needUpdate, fixPath } from './path'

let isSelf = false
let currentComponent = null
let isMultiStore = false

export function $(options) {
  if (options.store) {
    $.store = options.store
    if ($.store.data) {
      observe($.store)
    } else {
      isMultiStore = true
      for (let key in $.store) {
        if ($.store[key].data) {
          observe($.store[key], key)
        }
      }
    }

  }


  return class extends React.Component {
    state = {
      __$id_: 0
    }

    static css = options.css

    constructor(props) {
      super(props)


      if (isMultiStore) {

        if (options.use) {
          let updatePath = {}
          for (let storeName in options.use) {
            getPath(options.use[storeName], updatePath, storeName)
            $.store[storeName].components.push(this)
          }
          this.__$updatePath_ = updatePath


        }

        if (options.useSelf) {
          let updateSelfPath = {}
          for (let storeName in options.useSelf) {
            getPath(options.useSelf[storeName], updateSelfPath, storeName)
            $.store[storeName].updateSelfComponents.push(this)
          }
          this.__$updateSelfPath_ = updateSelfPath
        }


      } else {
        if (options.use) {
          $.store.components.push(this)
          this.__$updatePath_ = getPath(options.use)
        }
        if (options.useSelf) {
          $.store.updateSelfComponents.push(this)
          this.__$updateSelfPath_ = getPath(options.useSelf)
        }
      }

    }

    shouldComponentUpdate() {
      if (currentComponent === this) return true
      return !isSelf
    }

    componentWillUnmount() {
      removeItem(this, $.store.components)
      removeItem(this, $.store.updateSelfComponents)
    }

    render() {
      return options.render.apply(this, arguments)
    }
  }
}

function removeItem(item, arr) {
  for (let i = 0, len = arr.length; i < len; i++) {
    if (arr[i] === item) {
      arr.splice(i, 1)
      break
    }
  }
}

function observe(store, storeName) {

  store.components = []
  store.updateSelfComponents = []
  obaa(store.data, (prop, val, old, path) => {
    const patch = {}

    patch[fixPath(path + '-' + prop)] = true
    store.components.forEach(component => {
      if (
        component.__$updatePath_ &&
        needUpdate(patch, component.__$updatePath_)
      ) {
        component.setState({ __$id_: component.state.__$id_++ })

        isSelf = false
      }
    })

    store.updateSelfComponents.forEach(component => {
      if (
        component.__$updateSelfPath_ &&
        needUpdate(patch, component.__$updateSelfPath_)
      ) {
        component.setState({ __$id_: component.state.__$id_++ })
        isSelf = true
        currentComponent = component
      }
    })
  })
}