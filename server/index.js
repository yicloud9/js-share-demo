const Koa = require('koa')
const router = require('koa-router')()
const nunjucks = require('nunjucks')
const sessionInit = require('./session')
const koaJwt = require('koa-jwt')
const jwt = require('jwt-simple')
const bodyParser = require('koa-bodyparser')

const args = process.argv.slice(2) 
let PORT = 3000
if(args && args[0]) { // 只支持简单端口参数
    PORT = args[0]
}

const app = new Koa()

const env = new nunjucks.Environment(
    new nunjucks.FileSystemLoader('client', {
        noCache: false,
        watch: true,
    }), {
        autoescape: true,
        throwOnUndefined: true
    }
)

/** session */
sessionInit(app)

router.get('/', async(ctx, next) => {
    ctx.response.body = 'test'
})

/** cookie + session相关 */
router.get('/sign/:id', async (ctx, next) => {
    if(ctx.session && ctx.session.userId) {
        ctx.response.redirect('/user')
        return
    }
    ctx.session = {
        userId: ctx.params.id
    }
    ctx.response.body = ctx.response.body = '<h1>当前注册用户ID: '+ ctx.params.id + '</h1>'
})
router.get('/user', async (ctx, next) => {
    // if(ctx.params.id !== ctx.session.userId) {
    //     ctx.response.body = '<h2>未登录</h2>'
    // } else {
    //     ctx.response.body = '<h1>'+ ctx.session.userId + '</h1>'
    // }
    ctx.response.body = '<h1>当前登录用户ID: '+ ctx.session.userId + '</h1>'
})


/** token */
//秘钥
const jwtSecret = 'shareDemo'
const tokenExpiresTime = 5 * 60 * 1000

app.use(bodyParser());
app.use(async (ctx, next) => {
    try {
        next()
    } catch(err) {
        if (401 == err.status) {
            ctx.status = 401;
            ctx.response.body = '权限校验失败';
        } else {
            throw err;
        }
    }
})

router.get('/login', async (ctx, next) => {
    const res = env.render('auth/login.html')
    ctx.response.body = res
})
router.get('/userInfo', async (ctx, next) => {
    const token = ctx.header.token
    const payload = jwt.decode(token, jwtSecret);
    ctx.response.type = 'json'
    if(payload.exp < +new Date()) {
        const interval = Math.floor((+new Date() - payload.exp) / 1000 / 60)
        ctx.response.body = {errorMessage: '用户信息已经过期' + interval + '分钟'}
        return
    }
    ctx.response.body = {
        name: payload.name,
        expireTime: new Date(payload.exp)
    }
})
router.post('/user/login', async (ctx, next) => {
    const params = ctx.request.body
    const name = params.username
    const password = params.password
    if(password !== '123') {
        // 模拟密码校验
        ctx.response.type = 'json'
        ctx.response.body = {
            errorMessage: '密码输入错误'
        }
        return
    }

    const payload = {
        exp: Date.now() + tokenExpiresTime,
        name: name
    }
    const token = jwt.encode(payload, jwtSecret)
    ctx.response.type = 'json'
    ctx.response.body = {
        code: 100,
        token
    }
})


router.get('/cache', async (ctx, next) => {
    ctx.response.body = '<h1>cache</h1>'
})


/** 安全 */
router.get('/xsspage', async (ctx, next) => {
    const res = env.render('security/index.html')
    ctx.response.body = res
})
router.get('/xss', async (ctx, next) => {
    ctx.response.type = 'json'
    ctx.response.body = {
        content: '<img src="https://open.kdzs.com/static/logo-footer.f7830a86.png" onload="alert(1);this.parentNode.removeChild(this);" />'
    }
})


app.use(router.routes())

app.listen(PORT)
console.log('app started at port ' + PORT)

