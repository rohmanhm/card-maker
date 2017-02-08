/**
 * Card Maker
 *
 * Author: M Habib Rohman <mhrohman@live.com>
 *
 * @class CardMaker
 */

import {
  makeElement,
  makeImage,
  colorNameToHex,
  isColor
} from './utils';

Promise.each = function(arr, fn) { // take an array and a function
  // invalid input
  if(!arr || !arr.length) return Promise.reject(new Error("Non array passed to each"));
  // empty case
  if(arr.length === 0) return Promise.resolve();
  return arr.reduce(function(prev, cur) {
    return prev.then(() => fn(cur))
  }, Promise.resolve());
}

const _config = new WeakMap();

export default class CardMaker {

  constructor(configs = {}) {

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
    });

    // set default config to global
    this.setConfig(configs);

    // put canvas to DOM
    this.putCanvas();

    // init app automatically
    this.render();

    // enable download button
    this.enableDownload();

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
  changeBackground(type, props) {
    const config = this.getConfig(['width', 'height']);
    let ctx = this.getContext();

    ctx.beginPath();

    switch(type) {
      case 'image':
        if (props.img == undefined) throw new Error('Make sure you set the background image')

        ctx.drawImage(props.img, 0, 0, config['width'], config['height']);

        break;
      case 'color':
        if (props.color == undefined) throw new Error('Make sure you set the background color')

        ctx.fillStyle = props.color;
        ctx.rect(0, 0, config['width'], config['height']);
        ctx.fill();

        break;
    }

    ctx.closePath();

    return ctx;
  }

  /**
   * Enable download
   *
   * @memberOf CardMaker
   */
  enableDownload() {
    const download = this.getConfig('download');

    // download image
    if (download.length > 0) { // Means defined
      let downloadButton = document.querySelector(download);
      if (downloadButton) {
        downloadButton.addEventListener('click', (e)=> {
          e.preventDefault();

          window.location.href = this.getImage();
        });
      } else {
        throw new Error(`Element ${ download } can't found in your DOM. Please check again, maybe you make a typo`);
      }
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
  getConfig(key) {
    let config = _config.get(this);

    if (key) {
      if (typeof key == 'object') {
        let result = {};

        for (let k = 0; k < key.length; k++) {
          result[key[k]] = config[key[k]];
        }

        return result;
      } else if (typeof key == 'string') {
        if (config[key] == '') throw new Error(`Config with key '${ key }' undefined, please check your key again`);

        return config[key];
      }
    } else {
      return config;
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
    if (this.getConfig('canvas')) return this.getConfig('canvas').getContext('2d');
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
  getImage(format = 'jpeg', quality = 1.0) {
    return this.getConfig('canvas').toDataURL(`image/${ format }`, quality);
  }

  /**
   * Make canvas element
   *
   * @param {object} props
   * @returns
   *
   * @memberOf CardMaker
   */
  makeCanvas(props = {}) {
    if (this.getConfig('canvas') != undefined) throw new Error('Cannot create canvas, You\'ve already set the canvas');

    let canvas = makeElement('canvas', props);
    this.setConfig('canvas', canvas);

    return canvas;
  }

  /**
   * Put canvas to el root
   *
   * @return {object}
   *
   * @memberOf CardMaker
   */
  putCanvas() {
    const config = this.getConfig(['el', 'width', 'height']);
    let elem, newCanvas;

    newCanvas = this.makeCanvas({
      width: config['width'],
      height: config['height']
    });

    elem = document.querySelector(config['el']);

    if (elem != null || elem != undefined) {
      return elem.appendChild(newCanvas);
    } else {
      throw new Error(`Cannot find ${ elem } element in your DOM`);
    }
  }

  /**
   * Render the app
   *
   * @returns {promises}
   *
   * @memberOf CardMaker
   */
  render() {
    let config = this.getConfig(['background', 'template']);

    // just check if background set from template
    if (!config['background'] && config['template']['background'].length > 0) this.setConfig('background', config['template']['background']);

    let actionRender = [this.renderBackground(), this.renderImage()];
    return Promise.all(actionRender).then(() => {
      this.renderText();
    });

  }


  /**
   * Render background from template
   *
   *
   * @memberOf CardMaker
   */
  renderBackground() {
    let background = this.getConfig('background');

    if (isColor(background)) {
      this.changeBackground('color', {
        color: background
      });
    } else if (background != undefined && background != '') {
      makeImage(background).then((img) => {
        this.changeBackground('image', {
          img
        });
      })
    } else {
      this.changeBackground('color', {
        color: colorNameToHex('black')
      });
      console.warn(`You don't specified background image or color, so .. we give you black background`);
    }

  }

  /**
   * Render image from template
   *
   * @memberOf CardMaker
   */
  renderImage() {
    let images = this.getConfig('template')['images'];

    // let Promise = require('bluebird');
    return Promise.each(images, (image) => {
      return makeImage(image.value).then((img) => {

        let ctx = this.getContext();
        let prop = image.props;

        setTimeout(() => {
          ctx.drawImage(img, prop.sx || 0, prop.sy || 0, prop.swidth || img.width, prop.sheight || img.height, prop.x || 0, prop.y || 0, prop.width || img.width, prop.height || img.height);
        }, 0)
      })
    }).then(() => {
      return true;
    })

  }

  /**
   * Render text from template
   *
   * @memberOf CardMaker
   */
  renderText = () => {
    let text = this.getConfig('template')['text'];

    return Promise.each(text, (val, key) => {
      setTimeout(() => {
        this.writeText(val.value, val.props);
      }, 0)
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
  setConfig(...params) {
    let config = this.getConfig();

    if (params) {
      if (typeof params[0] == 'object') {
        let newConfig = params[0];
        let keys = [];

        for (let [key, val] of Object.entries(newConfig)) {
          config[key] = val;
          keys.push(key);
        }

        return this.getConfig(keys);
      } else {
        config[params[0]] = params[1];

        return this.getConfig([params[0]]);
      }
    }
  }

  /**
   * Write some text to canvas
   *
   * @return {object}
   *
   * @memberOf CardMaker
   */
  writeText(text, props = {}) {
    let ctx = this.getContext();
    let config = this.getConfig(['color', 'align']);

    if (text == '' || text == undefined ) console.warn('We\'ve found you insert an empty text, please make sure you make it valuable.');

    ctx.fillStyle = props.color || config['color'];
    ctx.textAlign = props.align || config['align'];
    ctx.font = `${ props.size || 20 }px ${ props.family || 'Arial' }`;
    ctx.fillText( text, props.x || 0 , props.y || 0 );

    return ctx;
  }

}
