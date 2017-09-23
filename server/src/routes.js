import fs from 'fs';
import Path from 'path';
import Boom from 'boom';
import { getTree, createFolder, removeFiles } from 'helpers/tree';
import { ROUTES, TEXT } from 'konstants';

const resolve = file => Path.resolve(__dirname, file);
const root = Path.resolve(process.env.npm_package_config_ROOT_DIR);
const staticPath = process.env.npm_package_config_STATIC_PATH || '/static';

const routes = [
  {
    method: 'GET',
    path: ROUTES.FILES.ALL,
    handler: (request, reply) => {
      getTree(root).then(reply);
    }
  },
  {
    method: 'POST',
    path: ROUTES.FILES.UPLOAD,
    config: {
      payload: {
        maxBytes: 10 * 1024 * 1024,
        output: 'stream',
        allow: 'multipart/form-data',
        parse: true
      }
    },
    handler: (request, reply) => {
      const { id, name, file, directory } = request.payload;
      if (file) {
        const path = `${root}/${directory}/${name}`;
        const fileStream = fs.createWriteStream(path);

        file.pipe(fileStream);
        file.on('error', err => console.error);
        file.on('end', err => {
          reply({ id, name });
        });
      }
    }
  },
  {
    method: 'PATCH',
    path: ROUTES.FILES.REMOVE,
    handler: (request, reply) => {
      const message = TEXT.API.MESSAGES.FILE.REMOVED;
      const folder = Path.join(root, request.payload.folder);

      removeFiles(folder, request.payload.files)
        .then(() => getTree(root))
        .then(tree => reply({ tree, message }));
    }
  },
  {
    method: 'POST',
    path: ROUTES.FOLDER.CREATE,
    handler: (request, reply) => {
      const dir = Path.join(root, request.payload.path);
      const message = TEXT.API.MESSAGES.FOLDER.CREATED;
      return createFolder(dir)
        .then(res => reply({ id: res.id, message }))
        .catch(err => reply(Boom.notAcceptable(err.message)));
    }
  },
  {
    method: 'GET',
    path: '/',
    handler: (request, reply) => {
      reply.file(resolve('../examples/index.html'));
    }
  },
  {
    method: 'GET',
    path: `${staticPath}/{p*}`,
    handler: {
      directory: {
        path: [
          resolve('../examples'),
          resolve('../examples/_uploads'),
          resolve('../dist')
        ]
      }
    }
  }
];

const router = {
  register: (server, options, next) => {
    server.route(routes);
    next();
  }
};

router.register.attributes = { name: 'routes' };

export default router;