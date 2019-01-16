"use strict";

let path = require('path');
let srcDir = path.join(__dirname, '..', 'lib');

require('blanket')({
  pattern: srcDir
});