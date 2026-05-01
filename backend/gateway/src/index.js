const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
app.use(cors());

/** Route the requests coming from frontends to the respective services */
app.use('/identity', createProxyMiddleware({ 
  target: 'http://localhost:4001',
  changeOrigin: true,
  pathRewrite: { '^/identity': '' }
}));

app.use('/catalog', createProxyMiddleware({ 
  target: 'http://localhost:4002',
  changeOrigin: true,
  pathRewrite: { '^/catalog': '' }
}));

app.use('/circulation', createProxyMiddleware({ 
  target: 'http://localhost:4003',
  changeOrigin: true,
  pathRewrite: { '^/circulation': '' }
}));

app.use('/ai', createProxyMiddleware({ 
  target: 'http://localhost:4004',
  changeOrigin: true,
  pathRewrite: { '^/ai': '' }
}));

app.listen(4000, () => {
  console.log('Gateway proxy running on http://localhost:4000');
  console.log('Routes:');
  console.log('  - http://localhost:4000/identity → Identity Service');
  console.log('  - http://localhost:4000/catalog → Catalog Service');
  console.log('  - http://localhost:4000/circulation → Circulation Service');
  console.log('  - http://localhost:4000/ai → AI Service');
});