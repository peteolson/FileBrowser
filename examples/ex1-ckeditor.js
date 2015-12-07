(function(win, doc){
  'use strict';
  
  var
    getRootPath = function(){
      var parts = win.location.pathname.split('/');
      parts.shift(); // remove first
      parts.pop(); // remove last
      parts.pop(); // yes, twice
      var path = parts.join('/');
      return '/' + path;
    },
    root_http = getRootPath(),
    browser_plugin = 'filebrowser_upload',
    plugin_dir = root_http + '/externs/ckeditor/plugins/',
    browser = new FileBrowser({
      root_http: root_http + '/server-side/writable',
      server_http: root_http + '/server-side/filebrowser.php',
    })
  ;
  CKEDITOR.plugins.addExternal(browser_plugin, plugin_dir + browser_plugin + '/');

  window.showUploadDialog = function(){
    browser.show();
  };
  var ckeditor = CKEDITOR.replace('editor', {
    extraPlugins: 'filebrowser_upload',
    toolbarGroups: [
      { name: 'basicstyles', groups: ['basicstyles', 'cleanup', 'colors'] },
      { name: 'tools', groups: ['tools'] },
      { name: 'upload', groups: ['filebrowser'] }
    ]
  });
  browser.setEditor(ckeditor);

})(window, document);
