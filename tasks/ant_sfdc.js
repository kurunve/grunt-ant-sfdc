/*
 * grunt-ant-sfdc
 * https://github.com/kevinohara80/grunt-ant-sfdc
 *
 * Copyright (c) 2013 Kevin O'Hara
 * Licensed under the MIT license.
 */

'use strict';

var path     = require('path');
var metadata = require('../lib/metadata.json');
var localTmp = path.resolve(__dirname, '../tmp');
var localAnt = path.resolve(__dirname, '../ant');

function buildPackageXml(pkg, version) {
  var packageXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Package xmlns="http://soap.sforce.com/2006/04/metadata">'
  ];
  if(pkg) {
    Object.keys(pkg).forEach(function(key) {  
      var type = pkg[key];
      var typeName;
      if(metadata[key.toLowerCase()] && metadata[key.toLowerCase()].xmlType) {
        typeName = metadata[key.toLowerCase()].xmlType;
      }
      if(!typeName) { grunt.log.error(key + ' is not a valid metadata type'); }
      packageXml.push('    <types>');
      type.forEach(function(t) {
        packageXml.push('        <members>' + t + '</members>');
      });
      packageXml.push('        <name>' + typeName + '</name>');
      packageXml.push('    </types>');
    });
  }
  packageXml.push('    <version>' + version + '</version>');
  packageXml.push('</Package>');
  return packageXml.join('\n');
}

// export

module.exports = function(grunt) {

  function clearLocalTmp() {
    grunt.file.delete(localTmp, { force: true });
  }

  function makeLocalTmp() {
    clearLocalTmp();
    grunt.file.mkdir(localTmp);
    grunt.file.mkdir(localTmp + '/ant');
    grunt.file.mkdir(localTmp + '/src');
  }

  function parseAuth(options, target) {
    var un = (!options.useEnv) ? options.user  : process.env.SFUSER;
    var pw = (!options.useEnv) ? options.pass  : process.env.SFPASS;
    var tk = (!options.useEnv) ? options.token : process.env.SFTOKEN;
    if(tk) pw += tk;
    if(!un) { grunt.log.error('no username specified for ' + target); }
    if(!pw) { grunt.log.error('no password specified for ' + target); }
    if(!un || !pw) grunt.fail.warn('username/password error');
    options.user = un;
    options.pass = pw;
    grunt.log.writeln('User -> ' + options.user.green);
  }

  function runAnt(task, target, args, done) {
    grunt.log.debug('ANT CMD: ant ' + args.join(' '));
    grunt.log.writeln('Starting ' + task + '...');
    grunt.util.spawn({
      cmd: 'ant',
      args: args
    }, function(error, result, code) {
      grunt.log.debug(String(result.stdout));
      if(error) {
        grunt.log.error(error);
      } else {
        grunt.log.ok(task + ' target ' + target + ' successful');
      }
      clearLocalTmp();
      done();
    });
  }

  /*************************************
   * antdeploy task
   *************************************/
  
  grunt.registerMultiTask('antdeploy', 'Run ANT deploy to Salesforce', function() {

    makeLocalTmp();

    var done = this.async();
    var target = this.target.green;
    var template = grunt.file.read(localAnt + '/antdeploy.build.xml');

    var options = this.options({
      user: false,
      pass: false,
      token: false,
      root: 'build',
      apiVersion: '27.0',
      serverurl: 'https://login.salesforce.com',
      checkOnly: false,
      runAllTests: false,
      rollbackOnError: true,
      useEnv: false
    });

    grunt.log.writeln('Deploy Target -> ' + target);

    parseAuth(options, target);

    options.tests = this.data.tests || [];

    var buildFile = grunt.template.process(template, { data: options });
    grunt.file.write(localTmp + '/ant/build.xml', buildFile);

    var packageXml = buildPackageXml(this.data.pkg, options.apiVersion);
    grunt.file.write(options.root + '/package.xml', packageXml);
    
    // build up our cli args
    var args =  [
      '-buildfile',
      localTmp + '/ant/build.xml',
      '-Dbasedir='     + process.cwd(),
      'deploy'
    ];

    runAnt('deploy', target, args, done);

  });

  /*************************************
   * antdestroy task
   *************************************/

  grunt.registerMultiTask('antdestroy', 'Run ANT destructive changes to Salesforce', function() {

    makeLocalTmp();

    var done = this.async();
    var target = this.target.green;
    var template = grunt.file.read(localAnt + '/antdeploy.build.xml');

    var options = this.options({
      user: false,
      pass: false,
      token: false,
      root: localTmp + '/src',
      apiVersion: '27.0',
      useEnv: false
    });

    grunt.log.writeln('Destroy Target -> ' + target);

    parseAuth(options, target);

    options.tests = this.data.tests || [];

    var buildFile = grunt.template.process(template, { data: options });
    grunt.file.write(localTmp + '/ant/build.xml', buildFile);

    var packageXml = buildPackageXml(null, options.apiVersion);
    grunt.file.write(localTmp + '/src/package.xml', packageXml);

    var destructiveXml = buildPackageXml(this.data.pkg, options.apiVersion);
    grunt.file.write(localTmp + '/src/destructiveChanges.xml', destructiveXml);

    var args =  [
      '-buildfile',
      localTmp + '/ant/build.xml',
      '-Dbasedir='     + process.cwd(),
      'deploy'
    ];

    runAnt('destroy', target, args, done);

  });

  /*************************************
   * antretrieve task
   *************************************/

  grunt.registerMultiTask('antretrieve', 'Run ANT retrieve to get metadata from Salesforce', function() {

    makeLocalTmp();

    var done = this.async();
    var target = this.target.green;
    var template = grunt.file.read(localAnt + '/antretrieve.build.xml');

    var options = this.options({
      user: false,
      pass: false,
      token: false,
      root: 'build',
      apiVersion: '27.0',
      serverurl: 'https://login.salesforce.com',
      retrieveTarget: false,
      unzip: true,
      useEnv: false
    });

    grunt.log.writeln('Retrieve Target -> ' + target);

    parseAuth(options, target);

    options.unpackaged = localTmp + '/package.xml';
    if(!options.retrieveTarget) options.retrieveTarget = options.root;

    var buildFile = grunt.template.process(template, { data: options });
    grunt.file.write(localTmp + '/ant/build.xml', buildFile);

    var packageXml = buildPackageXml(this.data.pkg, options.apiVersion);
    grunt.file.write(localTmp + '/package.xml', packageXml);

    var args =  [
      '-buildfile',
      localTmp + '/ant/build.xml',
      '-Dbasedir='     + process.cwd(),
      'retrieve'
    ];

    runAnt('retrieve', target, args, done);

  });

  /*************************************
   * antdescribe task
   *************************************/

  grunt.registerMultiTask('antdescribe', 'Describe all metadata types for an org', function() {
    
    makeLocalTmp();

    var done = this.async();
    var target = this.target.green;
    var template = grunt.file.read(localAnt + '/antdescribe.build.xml');

    var options = this.options({
      user: false,
      pass: false,
      token: false,
      apiVersion: '27.0',
      serverurl: 'https://login.salesforce.com',
      resultFilePath: '',
      trace: false,
      useEnv: false
    });

    grunt.log.writeln('Describe Target -> ' + target);

    parseAuth(options, target);

    var buildFile = grunt.template.process(template, { data: options });
    grunt.file.write(localTmp + '/ant/build.xml', buildFile);

    var args =  [
      '-buildfile',
      localTmp + '/ant/build.xml',
      '-Dbasedir='     + process.cwd(),
      'describe'
    ];

    runAnt('describe', target, args, done);

  });

};
