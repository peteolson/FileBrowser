/*!
 * FileBrowser - v1.3.0
 * A multi-purpose filebrowser.
 * https://github.com/jonataswalker/FileBrowser
 * Built: Sat Sep 23 2017 10:40:37 GMT-0300 (-03)
 */

'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = _interopDefault(require('path'));
var Hapi = _interopDefault(require('hapi'));
var Good = _interopDefault(require('good'));
var Inert = _interopDefault(require('inert'));
var BrowserSync = _interopDefault(require('browser-sync'));
var fs = _interopDefault(require('fs'));
var Boom = _interopDefault(require('boom'));

const ROOT_ID = 'root';







const TEXT = {
  TITLE: 'Image Browser',
  ROOT_FOLDER: 'Root Folder',
  PREVIEW: 'Sending Preview',
  SEND_TO_EDITOR: 'Send to Editor',
  REQUIRED: 'Field is required',
  BUTTON: {
    CHOOSE: 'Choose',
    SEND: 'Send',
    DELETE_FILE: 'Delete File',
    DELETE_FOLDER: 'Delete Folder',
    NEW_FOLDER: 'New Folder',
    SEND_EDITOR: 'Send to Editor',
    SUBMIT: 'Submit',
    CONFIRM: 'Confirm',
    CANCEL: 'Cancel'
  },
  FILE: {
    TOTAL: 'Total Files:',
    DEL: 'Delete File',
    DELS: 'Delete Files'
  },
  FOLDER: {
    NEW: 'New Folder',
    DEL: 'Delete Folder',
    CREATION: 'This folder will be created inside:',
    VALIDATION: [
      'Only <strong>letters, numbers</strong>',
      ' and the following characters: <span class="highlight">- _</span>'
    ].join(''),
    DELETION: [
      '<p class="folder-path">This folder <span>%1</span>',
      ' will be removed with all its contents: </p>',
      '<p>Total Files: <span class="destaque">%2</span>',
      ' &mdash; Total Subfolders: <span class="destaque">%3</span></p>'
    ].join('')
  },
  ALERT: {
    IMAGE: {
      NOT_MIN_SIZE: 'Only images with minimum %1 x %2!'
    },
    UPLOAD: {
      SENDING: 'An upload is already in progress!',
      NONE: 'No file!',
      SENT: 'All done!'
    }
  },
  API: {
    MESSAGES: {
      FOLDER: {
        CREATED: 'Folder created!',
        RENAMED: 'Folder renamed!',
        EXISTS: 'This folder already exists!'
      },
      FILE: {
        REMOVED: 'File(s) removed!'
      }
    }
  }
};

const ROUTES = {
  FILES: {
    ALL: '/files',
    UPLOAD: '/files',
    REMOVE: '/files'
  },
  FOLDER: {
    CREATE: '/folder',
    EDIT: '/folder/:id',
    REMOVE: '/folder/:id'
  }
};

/**
 * Get the first item that pass the test
 * by second argument function
 *
 * @param {Array} list
 * @param {Function} f
 * @return {*}
 */
/**
 * Deep copy the given object considering circular structure.
 * This function caches all nested objects and its copies.
 * If it detects circular structure, use cached copy to avoid infinite loop.
 *
 * @param {*} obj
 * @param {Array<Object>} cache
 * @return {*}
 */



/**
 * Conserve aspect ratio of the orignal region. Useful when shrinking/enlarging
 * images to fit into a certain area.
 *
 * @param {Number} w width of source image
 * @param {Number} h height of source image
 * @param {Number} maxWidth maximum available width
 * @param {Number} maxHeight maximum available height
 * @return {Object} { width, height }
*/










/**
 * Generates a GUID string.
 * @returns {String} The generated GUID.
 * @example af8a8416-6e18-a307-bd9c-f2c947bbb3aa
 * @author Slavik Meltser (slavik@meltser.info).
 * @link http://slavik.meltser.info/?p=142
 */


function ID() {
  return '_' + Math.random().toString(36).substr(2, 9);
}



// from https://github.com/jprichardson/string.js/blob/master/lib/string.js

function createFolder(dir) {
  return new Promise((resolve, reject) => {
    let error = true;
    if (fs.existsSync(dir)) {
      reject({ error, message: TEXT.API.MESSAGES.FOLDER.EXISTS });
    } else {
      fs.mkdir(dir, err => {
        const id = ID();
        err ? reject({ error, message: err }) : resolve({ id });
      });
    }
  });
}

async function getTree(dir, options = {}, parents = [], parentId) {
  const root = path.resolve(process.env.npm_package_config_ROOT_DIR);
  const staticPath = process.env.npm_package_config_STATIC_PATH || '/static';

  const results = { files: [], folders: {}};
  const files = safeReadDirSync(dir);

  if (parentId) {
    parents = parents.concat(parentId);
  } else {
    parents.push(ROOT_ID);
  }

  if (!files) return { error: `Directory '${dir}' not found.` };

  while (files.length > 0) {
    const f = files.pop();
    const file = path.resolve(dir, f);
    const stat = fs.statSync(file);
    if (!file) break;

    if (stat && stat.isDirectory()) {
      const id = ID();
      const recursive = await getTree(file, options, parents, id);

      results.folders[id] = {
        name: path.basename(file),
        files: recursive.files,
        folders: recursive.folders
      };

      if (parents.length) results.folders[id].parents = parents;

    } else if (stat && stat.isFile()) {
      const relativeDir = dir.replace(root, '').split(path.sep).join('/');
      const ext = path.extname(file).toLowerCase();
      const fileObj = {
        size: stat.size,
        name: path.basename(file),
        extension: ext,
        path: staticPath + relativeDir
      };

      if (options.extensions || options.exclude) {
        if (options.extensions.includes(ext)) {
          results.files.push(fileObj);
        }
      } else {
        results.files.push(fileObj);
      }
    }
  }
  return results;
}

function safeReadDirSync(dir) {
  let data;
  if (fs.existsSync(dir)) {
    try {
      data = fs.readdirSync(dir);
    } catch (ex) {
      if (ex.code === 'EACCES') {
        //User does not have permissions, ignore directory
        return null;
      } else throw ex;
    }
  }
  return data;
}

function removeFiles(folder, files) {
  return new Promise((resolve, reject) => {
    files.forEach((file, idx) => {
      file = path.join(folder, file);
      fs.unlink(file, err => {
        err && reject({ message: err });
        idx === files.length - 1 && resolve();
      });
    });
  });
}

const resolve = file => path.resolve(__dirname, file);
const root = path.resolve(process.env.npm_package_config_ROOT_DIR);
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
        const path$$1 = `${root}/${directory}/${name}`;
        const fileStream = fs.createWriteStream(path$$1);

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
      const folder = path.join(root, request.payload.folder);

      removeFiles(folder, request.payload.files)
        .then(() => getTree(root))
        .then(tree => reply({ tree, message }));
    }
  },
  {
    method: 'POST',
    path: ROUTES.FOLDER.CREATE,
    handler: (request, reply) => {
      const dir = path.join(root, request.payload.path);
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

const server = new Hapi.Server();

const isProd = process.env.NODE_ENV === 'production';
const port = process.env.npm_package_config_PORT || process.env.PORT || 3000;

// const host = 'localhost';
const options = {
  ops: { interval: 10000 },
  reporters: {
    console: [
      {
        module: 'good-squeeze',
        name: 'Squeeze',
        args: [{ log: '*', response: '*', request: '*' }]
      },
      { module: 'good-console' },
      'stdout'
    ]
  }
};

server.connection({ port, routes: { cors: true }});
server.register([
  { register: Inert },
  { register: router },
  { register: Good, options }
], (err) => {
  if (err) return console.error(err);

  server.start(() => {
    console.info(`Server started at ${ server.info.uri }`);

    if (!isProd) {
      const bs = BrowserSync.create();
      bs.init({
        ui: false,
        notify: false,
        logLevel: 'info',
        proxy: 'localhost:' + port,
        files: ['examples/index.html', 'dist/**/*.js', 'dist/**/*.css']
      });
    }
  });
});