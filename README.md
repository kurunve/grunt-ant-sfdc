# grunt-ant-sfdc

> Add salesforce and force.com ANT tasks to your grunt builds

Note: This currently only supports deploys. More Ant tasks coming!

## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-ant-sfdc --save-dev
```

One the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-ant-sfdc');
```

## The "antdeploy" task

### Overview
In your project's Gruntfile, add a section named `antdeploy` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  antdeploy: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
})
```

### Options

#### options.root
Type: `String`
Default value: `'build/'`

The `build` options sets the base directory where metadata lives

#### options.version
Type: `String`
Default value: `'27.0'`

This option sets the api version to use for the package deployment

### Usage Examples

#### Single Org Deploy
In this example, we will deploy all static resources to a single org

```js
grunt.initConfig({
  antdeploy: {
    options: {},
    // specify one deploy target
    dev1: {
      user:  'myusername@gmail.com',
      pass:  'mypassword',
      token: 'myauthtoken',
      pkg: {
        staticresource: ['*']
      }
    }
  }
})
```

#### Multiple Org Deploy w/ Default Options
In this example, we specify two different org deploy targets with different metadata for each

```js
grunt.initConfig({
  antdeploy: {
    options: {
      root: 'my/metadata/', // note trailing slash is important
      version: '27.0'
    },
    // specify one deploy target
    dev1: {
      user:  'myusername1@gmail.com',
      pass:  'mypassword',
      token: 'myauthtoken',
      pkg: {
        staticresource: ['*']
      }
    },
    dev2: {
      user:  'myusername2@gmail.com',
      pass:  'mypassword',
      token: 'myauthtoken',
      pkg: {
        staticresource: ['resource1', 'resource2'],
        apexclass:      ['class1', 'class2']
      }
    }
  }
})
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_