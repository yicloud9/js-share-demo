const path = require('path')
const fs = require('fs')
const session = require('koa-session')

const store = {
    get(key, maxAge, {ctx}) {
      const sessionDir = path.resolve(__dirname, './session');
      const files = fs.readdirSync(sessionDir);
      for (let i = 0; i < files.length; i++) {
        if (files[i].indexOf(key) > -1) {
          const filepath = path.resolve(sessionDir, files[i]);
          delete require.cache[require.resolve(filepath)];
          const result = require(filepath);
          return result;
        }
      }
    },
    set(key, session) {
      const filePath = path.resolve(__dirname, './session', `${key}.js`);
      const content = `module.exports = ${JSON.stringify(session)};`;
      fs.writeFileSync(filePath, content);
    },
  
    destroy(key){
      const filePath = path.resolve(__dirname, './session', `${key}.js`);
      fs.unlinkSync(filePath);
    }
}

module.exports = function (app) {
    app.keys = ['demo']

    const CONFIG = {
        key: 'koa', /** (string) cookie key (default is koa:sess) */
        /** (number || 'session') maxAge in ms (default is 1 days) */
        /** 'session' will result in a cookie that expires when session/browser is closed */
        /** Warning: If a session cookie is stolen, this cookie will never expire */
        maxAge: 5 * 60 * 1000,
        overwrite: true, /** (boolean) can overwrite or not (default true) */
        httpOnly: false, /** (boolean) httpOnly or not (default true) */
        signed: false, /** (boolean) signed or not (default true) */
        rolling: false, /** (boolean) Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown. default is false **/
        store
    }
    app.use(session(CONFIG, app));
}