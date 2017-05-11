// @flow

/**
 * Card Maker
 *
 * Author: M Habib Rohman <mhrohman@live.com>
 *
 * @class CardMaker
 */
import pick from 'lodash/pick'
import {
  makeElement,
  makeImage,
  colorNameToHex,
  isColor,
  packageConfig,
  PromiseEach
} from './utils'

const _config = new WeakMap()

export default class CardMaker {
  __name__: string
  __version__: string

  constructor(configs: any = {}) {

    this.__name__ = packageConfig.name
    this.__version__ = packageConfig.version

    // default config
    _config.set(this, {
      /*
       * Default align text for canvas
       */ 
      align: 'left',

      /*
       * Default canvas background
       */ 
      background: undefined,

      /*
       * Default canvas element
       */ 
      canvas: undefined,

      /*
       * Default text canvas color
       */ 
      color: 'black',

      /*
       * Default element to enabling download
       */ 
      download: '',

      /*
       * Default root card maker element
       */ 
      el: '#cardmaker',

      /*
       * When it set to true, your element will be set default value with template value
       */
      enableSetToElement: true,

      /*
       * Default Width for card maker.
       */ 
      width: 400,

      /*
       * Default Height for card maker
       */ 
      height: 250,

      /*
       * Template config card maker
       */ 
      template: {},

      /*
       * Template will update if element related changed
       */ 
      streamElemTemplate: true
    })

    // set default config to global
    this.setConfig(configs)

    // put canvas to DOM
    this.putCanvas()

    // init app automatically
    this.render()

    // enable download button
    this.enableDownload()

  }

  /**
   * Change background of canvas
   *
   * @param {string} type
   * @param {object} props
   * @returns {object}
   *
   * @memberOf CardMaker
   */
  changeBackground(type: string, props: any): any {
    const config: any = this.getConfig(['width', 'height'])
    const ctx: any = this.getContext()
    const { img, color } = props

    ctx.beginPath()

    switch(type) {
      case 'image':
        if (img == undefined) throw new Error('Make sure you set the background image')

        ctx.drawImage(img, 0, 0, config['width'], config['height'])

        break
      case 'color':
        if (color == undefined) throw new Error('Make sure you set the background color')

        ctx.fillStyle = color
        ctx.rect(0, 0, config['width'], config['height'])
        ctx.fill()

        break
    }

    ctx.closePath()

    return ctx
  }

  /**
   * Enable download
   *
   * @memberOf CardMaker
   */
  enableDownload() {
    const download: any = this.getConfig('download')

    // download image
    if (download.length > 0) { // Means defined
      let downloadButton: any = document.querySelector(download)
      if (!downloadButton) throw new Error(`Element ${ download } can't found in your DOM. Please check again, maybe you make a typo`)

      downloadButton.addEventListener('click', (e: any) => {
        e.preventDefault()
        window.location.href = this.getImage()
      })
    }
  }

  /**
   * Get config
   *
   * @param {string} key
   * @returns {object}
   *
   * @memberOf CardMaker
   */
  getConfig(key: void | string | Array<string>): any {
    const config: any = _config.get(this)

    if (!key) return config

    if (typeof key == 'object') {
      let result = {}

      for (let k = 0; k < key.length; k++) {
        result[key[k]] = config[key[k]]
      }

      return result
    } else if (typeof key == 'string') {
      if (config[key] == '') throw new Error(`Config with key '${ key }' undefined, please check your key again`)

      return config[key]
    }
  }

  /**
   * Get context 2d from canvas
   *
   * @returns
   *
   * @memberOf CardMaker
   */
  getContext() {
    if (this.getConfig('canvas')) return this.getConfig('canvas').getContext('2d')
  }

  /**
   * Get image from canvas
   *
   * @param {string} format
   * @param {float} quality
   * @returns
   *
   * @memberOf CardMaker
   */
  getImage(format: string = 'jpeg', quality: number = 1.0): string {
    return this.getConfig('canvas').toDataURL(`image/${ format }`, quality)
  }

  /**
   * Make canvas element
   *
   * @param {object} props
   * @returns
   *
   * @memberOf CardMaker
   */
  makeCanvas(props: any = {}): any {
    if (this.getConfig('canvas') != undefined) throw new Error('Cannot create canvas, You\'ve already set the canvas')

    let canvas = makeElement('canvas', props)
    this.setConfig('canvas', canvas)

    return canvas
  }

  /**
   * Put canvas to el root
   *
   * @return {object}
   *
   * @memberOf CardMaker
   */
  putCanvas() {
    const config = this.getConfig(['el', 'width', 'height'])
    let elem: any

    const newCanvas: any = this.makeCanvas({
      width: config['width'],
      height: config['height']
    })

    elem = document.querySelector(config['el'])
    if (elem) {
      return elem.appendChild(newCanvas)
    }

    throw new Error(`Cannot find ${ config['el'] } element in your DOM`)
  }

  /**
   * Render the app
   *
   * @returns {promises}
   *
   * @memberOf CardMaker
   */
  render() {
    const config = this.getConfig(['background', 'template', 'streamElemTemplate'])

    // just check if background set from template
    if (!config['background'] && config['template']['background'].length > 0) this.setConfig('background', config['template']['background'])

    let actionRender = [this.renderBackground()]
    return Promise.all(actionRender)
      .then(() => this.renderImage())
      .then(() => this.renderText())
      .then(() => {
        if (config['streamElemTemplate']) this.streamElemTemplate()
      })

  }


  /**
   * Render background from template
   *
   *
   * @memberOf CardMaker
   */
  renderBackground() {
    let background = this.getConfig('background')

    if (isColor(background)) {
      return this.changeBackground('color', { color: background })
    } else if (background != undefined && background != '') {
      return makeImage(background).then( img => this.changeBackground('image', { img }))
    } else {
      console.warn(`You don't specified background image or color, so .. we give you black background`)
      return this.changeBackground('color', { color: colorNameToHex('black') })
    }

  }

  /**
   * Render image from template
   *
   * @memberOf CardMaker
   */
  renderImage() {
    let images = this.getConfig('template')['images']

    return PromiseEach(images, (image: any) => {
      return makeImage(image.value).then((img: any) => {

        const ctx = this.getContext()
        const { name, value, description } = image
        const { sx, sy, swidth, sheight, x, y, width, height  } = image.props

        setTimeout(() => {
          this.setToElement(image.name, image.value, image.description)
          // $FlowIgnore: suppressing this error
          ctx.drawImage(img, sx || 0, sy || 0, swidth || img.width, sheight || img.height, x || 0, y || 0, width || img.width, height || img.height)
        }, 1)
      })
    }).then(() => {
      return true
    })

  }

  /**
   * Render text from template
   *
   * @memberOf CardMaker
   */
  renderText() {
    let text = this.getConfig('template')['text']

    return PromiseEach(text, (val, key) => {
      setTimeout(() => {
        this.setToElement(val.name, val.value, val.description)
        this.writeText(val.value, val.props)
      }, 1)
    })

  }

  /**
   * Set config
   *
   * @param {string|object} params[0]
   * @param {string} params[1]
   * @returns {object}
   *
   * @memberOf CardMaker
   */
  setConfig(...params: Array<any>) {
    const config: any = this.getConfig()
    if (!params) return false

    if (typeof params[0] == 'object') {
      let newConfig = params[0]
      let keys = []

      for (let [key, val] of Object.entries(newConfig)) {
        config[key] = val
        keys.push(key)
      }

      return this.getConfig(keys)
    } else {
      config[params[0]] = params[1]

      return this.getConfig([params[0]])
    }

  }

  
  /**
   * Stream and real time update your template config
   * it's stream from element attribute which have same name
   * with template name object
   * 
   * @memberOf CardMaker
   */
  streamElemTemplate () {
    const template = this.getConfig('template')
    const sorteredTemplate = pick(template, ['images', 'text'])

    for (let i in sorteredTemplate) {
      sorteredTemplate[i].forEach( obj => {
        let selector: any = document.querySelector(`[name=${ obj.name }]`)
        if (!selector) return false

        selector.addEventListener('keyup', ({ target: { value } }) => {
          obj.value = value
        })
      })
    }
  }

  
  /**
   * Set text from template to element
   * this function will be set element with the same name of element attribute
   * and template name object
   * 
   * @param {string} name
   * @param {string} value
   * @returns
   * 
   * @memberOf CardMaker
   */
  setToElement (name: string, value: string, desc: string = ''): string | boolean {
    let enableSetToElement: any = this.getConfig('enableSetToElement')
    if (!enableSetToElement) return false

    const el: any = document.querySelector(`[name=${ name }]`)
    if (!el) return false

    el.setAttribute('placeholder', desc)
    return el.value = value
  }

  /**
   * Write some text to canvas
   *
   * @return {object}
   *
   * @memberOf CardMaker
   */
  writeText(text: string, props: any = {}): any {
    const ctx: any = this.getContext()
    const config: any = this.getConfig(['color', 'align'])

    if (text == '' || text == undefined ) console.warn('We\'ve found you insert an empty text, please make sure you make it valuable.')

    const { align, color, family, size, x, y } = props

    ctx.fillStyle = color || config['color']
    ctx.textAlign = align || config['align']
    ctx.font = `${ size || 20 }px ${ family || 'Arial' }`
    ctx.fillText( text, x || 0 , y || 0 )

    return ctx
  }

}
